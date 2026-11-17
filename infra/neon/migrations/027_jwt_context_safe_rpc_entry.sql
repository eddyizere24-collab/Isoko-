BEGIN;

-- Neon pg_session_jwt 0.5.0 can clear request.jwt.claims when it is first
-- loaded from inside a SECURITY DEFINER function that has a SET search_path.
-- The wrapper below deliberately has NO SET clause. It resolves auth.user_id()
-- first, then calls the original hardened SECURITY DEFINER implementation.
-- All references in the wrapper are schema-qualified; the original secure
-- functions retain their pinned search_path, owner, body and authorization checks.
--
-- This does not mint, modify or trust a client-supplied user ID. The only identity
-- accepted here is auth.user_id() from the Data API's verified JWT context.
-- If no identity is present, the wrapper raises AUTH_REQUIRED and denies access.

DO $migration$
DECLARE
  target RECORD;
  grant_row RECORD;
  secure_name TEXT;
  call_args TEXT;
  claimed_user pg_catalog.text;
  wrapped_count INTEGER := 0;
  body_sql TEXT;
BEGIN
  FOR target IN
    SELECT
      p.oid,
      p.proname,
      p.proargnames,
      p.pronargs,
      pg_get_function_identity_arguments(p.oid) AS identity_args,
      pg_get_function_arguments(p.oid) AS full_args,
      pg_get_function_result(p.oid) AS result_type,
      p.proowner,
      p.proacl
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'claim_first_admin_v1',
        'start_seller_registration_v1',
        'register_basic_seller_v1',
        'create_seller_product_v1',
        'set_seller_product_status_v1',
        'update_seller_product_v1',
        'copy_seller_product_v1',
        'delete_seller_product_v1',
        'set_seller_product_visibility_v1',
        'admin_control_center_snapshot_v1',
        'admin_review_seller_v1',
        'admin_moderate_product_v1',
        'admin_resolve_report_v1'
      ])
      AND p.prosecdef
      AND EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg(value)
        WHERE cfg.value LIKE 'search_path=%'
      )
  LOOP
    secure_name := target.proname || '__secure_027';

    IF EXISTS (
      SELECT 1
      FROM pg_proc p2
      JOIN pg_namespace n2 ON n2.oid = p2.pronamespace
      WHERE n2.nspname = 'public'
        AND p2.proname = secure_name
    ) THEN
      RAISE EXCEPTION 'JWT wrapper migration found an existing internal function: %', secure_name;
    END IF;

    SELECT COALESCE(
      string_agg(format('%I', arg_name), ', ' ORDER BY ord),
      ''
    )
    INTO call_args
    FROM unnest(target.proargnames[1:target.pronargs])
      WITH ORDINALITY AS arg(arg_name, ord);

    -- Preserve the original implementation under a non-API name.
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) RENAME TO %I',
      target.proname,
      target.identity_args,
      secure_name
    );

    -- The wrapper has no SET search_path. It uses only qualified references.
    body_sql := format(
      'CREATE FUNCTION public.%I(%s) RETURNS %s
       LANGUAGE plpgsql
       SECURITY DEFINER
       AS $jwt_prime$
       DECLARE
         v_verified_user_id pg_catalog.text;
       BEGIN
         v_verified_user_id := auth.user_id();
         IF v_verified_user_id IS NULL OR v_verified_user_id = '''' THEN
           RAISE EXCEPTION ''AUTH_REQUIRED'' USING ERRCODE = ''28000'';
         END IF;
         RETURN public.%I(%s);
       END;
       $jwt_prime$',
      target.proname,
      target.full_args,
      target.result_type,
      secure_name,
      call_args
    );
    EXECUTE body_sql;

    -- The migration runs as the same function owner (isoko_owner). Keep the
    -- internal implementation owner and remove direct Data API execution.
    EXECUTE format(
      'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, authenticated, anonymous',
      secure_name,
      target.identity_args
    );

    -- Match the original API grants on the new public wrapper.
    EXECUTE format(
      'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, authenticated, anonymous',
      target.proname,
      target.identity_args
    );

    FOR grant_row IN
      SELECT DISTINCT g.grantee, g.privilege_type, r.rolname
      FROM aclexplode(COALESCE(target.proacl, acldefault('f', target.proowner))) AS g
      LEFT JOIN pg_roles r ON r.oid = g.grantee
      WHERE g.privilege_type = 'EXECUTE'
        AND g.grantee <> target.proowner
    LOOP
      IF grant_row.grantee = 0 THEN
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION public.%I(%s) TO PUBLIC',
          target.proname,
          target.identity_args
        );
      ELSE
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION public.%I(%s) TO %I',
          target.proname,
          target.identity_args,
          grant_row.rolname
        );
      END IF;
    END LOOP;

    wrapped_count := wrapped_count + 1;
  END LOOP;

  IF wrapped_count <> 13 THEN
    RAISE EXCEPTION 'Expected to wrap 13 authenticated RPCs, wrapped %', wrapped_count;
  END IF;
END;
$migration$;

INSERT INTO public.schema_migrations(version)
VALUES ('027_jwt_context_safe_rpc_entry')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

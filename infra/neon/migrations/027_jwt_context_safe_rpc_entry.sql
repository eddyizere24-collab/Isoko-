BEGIN;

-- Neon Data API can expose the verified JWT to auth.user_id() only before
-- a SECURITY DEFINER function pins search_path and initializes pg_session_jwt.
-- Keep every hardened implementation unchanged under an internal name.
-- This wrapper primes identity from the verified JWT before delegating.
--
-- The wrapper has no SET search_path clause, but all object references below
-- are schema-qualified. It never accepts an identity supplied by the caller.
-- Missing JWT identity remains a hard AUTH_REQUIRED failure.

DO $migration$
DECLARE
  target RECORD;
  grant_row RECORD;
  secure_name TEXT;
  call_args TEXT;
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

    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) RENAME TO %I',
      target.proname,
      target.identity_args,
      secure_name
    );

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

    EXECUTE format(
      'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, authenticated, anonymous',
      secure_name,
      target.identity_args
    );

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

  IF wrapped_count <> 12 THEN
    RAISE EXCEPTION 'Expected to wrap 12 authenticated RPCs, wrapped %', wrapped_count;
  END IF;
END;
$migration$;

INSERT INTO public.schema_migrations(version)
VALUES ('027_jwt_context_safe_rpc_entry')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

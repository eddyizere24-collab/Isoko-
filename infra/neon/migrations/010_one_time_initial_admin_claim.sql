-- One-time initial administrator claim. The raw code is never stored in GitHub or Neon.
INSERT INTO private.app_secrets(name,secret)
VALUES ('first_admin_code_sha256',decode('<GENERATED_SHA256_STORED_ONLY_IN_NEON_PRIVATE_APP_SECRETS>','hex'))
ON CONFLICT(name) DO UPDATE SET secret=EXCLUDED.secret;

CREATE OR REPLACE FUNCTION public.claim_first_admin_v1(
  p_full_name TEXT,
  p_phone TEXT,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_user_id TEXT := auth.user_id()::text;
  v_expected BYTEA;
  v_admin_id TEXT;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL OR v_user_id='' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000';
  END IF;
  IF p_full_name IS NULL OR length(trim(p_full_name))<2 THEN
    RAISE EXCEPTION 'FULL_NAME_REQUIRED' USING ERRCODE='22023';
  END IF;
  IF p_phone !~ '^2507[0-9]{8}$' THEN
    RAISE EXCEPTION 'RWANDA_PHONE_INVALID' USING ERRCODE='22023';
  END IF;

  IF EXISTS(SELECT 1 FROM public.profiles WHERE role='admin' AND status='approved') THEN
    RAISE EXCEPTION 'ADMIN_ALREADY_INITIALIZED' USING ERRCODE='55000';
  END IF;
  IF EXISTS(SELECT 1 FROM public.profiles WHERE auth_user_id=v_user_id) THEN
    RAISE EXCEPTION 'ACCOUNT_ALREADY_REGISTERED' USING ERRCODE='23505';
  END IF;
  IF EXISTS(SELECT 1 FROM public.profiles WHERE phone=p_phone) THEN
    RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED' USING ERRCODE='23505';
  END IF;

  SELECT secret INTO v_expected FROM private.app_secrets
  WHERE name='first_admin_code_sha256';
  IF v_expected IS NULL OR public.digest(COALESCE(p_code,''),'sha256') <> v_expected THEN
    RAISE EXCEPTION 'ADMIN_BOOTSTRAP_CODE_INVALID' USING ERRCODE='28000';
  END IF;

  v_admin_id := 'prof-admin-' || replace(gen_random_uuid()::text,'-','');
  INSERT INTO public.profiles(
    id,auth_user_id,role,full_name,phone,whatsapp,password_hash,
    status,status_reason,approved_by,approved_at,terms_version,terms_accepted_at,created_at
  ) VALUES (
    v_admin_id,v_user_id,'admin',trim(p_full_name),p_phone,p_phone,NULL,
    'approved',NULL,NULL,now(),'1.0',now(),now()
  );

  INSERT INTO public.audit_log(id,actor_id,actor_name,action,target_type,target_id,details)
  VALUES (
    'audit-' || replace(gen_random_uuid()::text,'-',''),
    v_admin_id,trim(p_full_name),'initial_admin_claimed','admin',v_admin_id,
    jsonb_build_object('method','one_time_bootstrap','status','approved')
  );

  DELETE FROM private.app_secrets WHERE name='first_admin_code_sha256';
  SELECT to_jsonb(p)-'password_hash'-'auth_user_id' INTO v_result
  FROM public.profiles p WHERE p.id=v_admin_id;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_first_admin_v1(TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin_v1(TEXT,TEXT,TEXT) TO authenticated;

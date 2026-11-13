-- Keep the shop photo and identity documents in the private KYC bucket. Never publish KYC files as store imagery.
INSERT INTO private.app_secrets(name,secret)
VALUES ('tin_encryption',gen_random_bytes(32))
ON CONFLICT(name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.register_seller_v1(
  p_full_name TEXT,p_phone TEXT,p_whatsapp TEXT,p_shop_name TEXT,
  p_district_id INTEGER,p_sector_id INTEGER,p_landmark TEXT,p_delivery_text TEXT,p_about TEXT,
  p_business_type TEXT,p_national_id_number TEXT,p_id_front_key TEXT,p_id_back_key TEXT,
  p_selfie_key TEXT,p_shop_photo_key TEXT,p_tin TEXT,p_terms_accepted BOOLEAN,p_terms_version TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_auth_user_id TEXT := auth.user_id()::text;
  v_seller_id TEXT;
  v_shop_id TEXT;
  v_slug TEXT;
  v_fingerprint TEXT;
  v_profile JSONB;
  v_shop JSONB;
  v_kyc_secret BYTEA;
  v_tin_secret BYTEA;
  v_tin_ciphertext TEXT := NULL;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;
  IF COALESCE(p_terms_accepted, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'TERMS_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'FULL_NAME_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF p_phone !~ '^2507[0-9]{8}$' OR p_whatsapp !~ '^2507[0-9]{8}$' THEN
    RAISE EXCEPTION 'RWANDA_PHONE_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_shop_name IS NULL OR length(trim(p_shop_name)) < 2 THEN
    RAISE EXCEPTION 'SHOP_NAME_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF p_national_id_number IS NULL OR p_national_id_number !~ '^[0-9]{16}$' THEN
    RAISE EXCEPTION 'NATIONAL_ID_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_id_front_key IS NULL OR p_id_back_key IS NULL OR p_selfie_key IS NULL OR p_shop_photo_key IS NULL THEN
    RAISE EXCEPTION 'KYC_FILES_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF p_id_front_key NOT LIKE 'kyc/%' OR p_id_back_key NOT LIKE 'kyc/%'
    OR p_selfie_key NOT LIKE 'kyc/%' OR p_shop_photo_key NOT LIKE 'kyc/%' THEN
    RAISE EXCEPTION 'KYC_FILES_MUST_BE_PRIVATE' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM areas WHERE id=p_district_id AND sector IS NULL) THEN
    RAISE EXCEPTION 'DISTRICT_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_sector_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM areas WHERE id=p_sector_id AND parent_id=p_district_id AND sector IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'SECTOR_INVALID' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE auth_user_id=v_auth_user_id) THEN
    RAISE EXCEPTION 'ACCOUNT_ALREADY_REGISTERED' USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE phone=p_phone) THEN
    RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED' USING ERRCODE = '23505';
  END IF;

  SELECT secret INTO v_kyc_secret FROM private.app_secrets WHERE name='kyc_hmac';
  SELECT secret INTO v_tin_secret FROM private.app_secrets WHERE name='tin_encryption';
  IF v_kyc_secret IS NULL OR (NULLIF(trim(COALESCE(p_tin,'')),'') IS NOT NULL AND v_tin_secret IS NULL) THEN
    RAISE EXCEPTION 'KYC_CRYPTO_NOT_CONFIGURED' USING ERRCODE = '55000';
  END IF;
  v_fingerprint := encode(public.hmac(p_national_id_number, v_kyc_secret, 'sha256'), 'hex');
  IF EXISTS (SELECT 1 FROM seller_kyc WHERE national_id_fingerprint=v_fingerprint) THEN
    RAISE EXCEPTION 'NATIONAL_ID_ALREADY_USED' USING ERRCODE = '23505';
  END IF;
  IF NULLIF(trim(COALESCE(p_tin,'')),'') IS NOT NULL THEN
    v_tin_ciphertext := encode(public.pgp_sym_encrypt(trim(p_tin), encode(v_tin_secret,'hex')), 'base64');
  END IF;

  v_seller_id := 'prof-seller-' || replace(gen_random_uuid()::text, '-', '');
  v_shop_id := 'shop-' || replace(gen_random_uuid()::text, '-', '');
  v_slug := left(trim(both '-' from regexp_replace(lower(trim(p_shop_name)), '[^a-z0-9]+', '-', 'g')), 26);
  IF v_slug = '' THEN v_slug := 'iduka'; END IF;
  IF EXISTS (SELECT 1 FROM shops WHERE slug=v_slug) THEN
    v_slug := left(v_slug, 20) || '-' || substr(replace(gen_random_uuid()::text, '-', ''),1,6);
  END IF;

  INSERT INTO profiles (
    id,auth_user_id,role,full_name,phone,whatsapp,status,status_reason,
    approved_by,approved_at,terms_version,terms_accepted_at,created_at,password_hash
  ) VALUES (
    v_seller_id,v_auth_user_id,'seller',trim(p_full_name),p_phone,p_whatsapp,
    'pending',NULL,NULL,NULL,COALESCE(p_terms_version,'1.0'),now(),now(),NULL
  );

  INSERT INTO shops (
    id,owner_id,slug,name,logo_key,cover_key,about,whatsapp,phone,
    district_id,sector_id,district_name,sector_name,landmark,hours_text,
    delivery_text,product_limit,plan,plan_expires_at,status,created_at
  )
  SELECT
    v_shop_id,v_seller_id,v_slug,left(trim(p_shop_name),40),NULL,NULL,
    left(COALESCE(p_about,''),200),p_whatsapp,p_phone,
    d.id,p_sector_id,d.district,
    (SELECT a.sector FROM areas a WHERE a.id=p_sector_id),
    left(COALESCE(p_landmark,''),80),'08:30 – 19:30',
    left(COALESCE(p_delivery_text,'Gutanga mu Rwanda'),120),
    COALESCE((SELECT (value #>> '{}')::integer FROM settings WHERE key='DEFAULT_PRODUCT_LIMIT'),150),
    'free',NULL,'pending',now()
  FROM areas d WHERE d.id=p_district_id;

  INSERT INTO seller_kyc (
    seller_id,full_name_on_id,national_id_fingerprint,national_id_last4,
    id_front_key,id_back_key,selfie_key,shop_photo_key,tin_ciphertext,business_type,
    submitted_at
  ) VALUES (
    v_seller_id,trim(p_full_name),v_fingerprint,right(p_national_id_number,4),
    p_id_front_key,p_id_back_key,p_selfie_key,p_shop_photo_key,
    v_tin_ciphertext,left(COALESCE(p_business_type,'Iduka'),60),now()
  );

  INSERT INTO audit_log(id,actor_id,actor_name,action,target_type,target_id,details,created_at)
  VALUES (
    'audit-' || replace(gen_random_uuid()::text,'-',''),v_seller_id,trim(p_full_name),
    'seller_registered','seller',v_seller_id,
    jsonb_build_object('shop_id',v_shop_id,'status','pending'),now()
  );

  SELECT to_jsonb(p) - 'password_hash' - 'auth_user_id' INTO v_profile FROM profiles p WHERE p.id=v_seller_id;
  SELECT to_jsonb(s) INTO v_shop FROM shops s WHERE s.id=v_shop_id;
  RETURN jsonb_build_object('profile',v_profile,'shop',v_shop);
END;
$function$;

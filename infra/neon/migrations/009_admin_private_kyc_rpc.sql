-- Permit only verified admins to retrieve private KYC object keys for short-lived signed URLs.
-- Full national ID fingerprints and encrypted TIN are intentionally never returned.
CREATE OR REPLACE FUNCTION public.admin_get_kyc_private_v1(p_seller_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_isoko_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE='42501';
  END IF;

  SELECT jsonb_build_object(
    'seller_id',seller_id,
    'full_name_on_id',full_name_on_id,
    'business_type',business_type,
    'id_front_key',id_front_key,
    'id_back_key',id_back_key,
    'selfie_key',selfie_key,
    'shop_photo_key',shop_photo_key,
    'submitted_at',submitted_at
  )
  INTO v_result
  FROM public.seller_kyc
  WHERE seller_id=p_seller_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'KYC_RECORD_NOT_FOUND' USING ERRCODE='P0002';
  END IF;
  RETURN v_result;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_get_kyc_private_v1(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kyc_private_v1(TEXT) TO authenticated;

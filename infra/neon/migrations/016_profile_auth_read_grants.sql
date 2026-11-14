-- Grant the authenticated seller session access to the fields used by currentAccount().
GRANT SELECT (email,email_verified,identity_status) ON public.profiles TO authenticated;
INSERT INTO public.schema_migrations(version) VALUES ('016_profile_auth_read_grants') ON CONFLICT (version) DO NOTHING;

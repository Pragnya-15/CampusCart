/*
# Revoke EXECUTE on handle_new_user from anon and authenticated

The previous revocation was overridden when the function was recreated.
This ensures the trigger function is not callable via the REST API.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

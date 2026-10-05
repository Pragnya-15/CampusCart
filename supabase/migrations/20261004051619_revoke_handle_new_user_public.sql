/*
# Revoke EXECUTE on handle_new_user from PUBLIC

The function still had EXECUTE granted to PUBLIC (default).
Revoking from specific roles wasn't enough. This removes public access.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

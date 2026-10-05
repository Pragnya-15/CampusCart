/*
# Fix Security Advisor Warnings

## Changes
1. Set search_path on handle_new_user and update_updated_at functions to prevent search path injection
2. Revoke EXECUTE on handle_new_user from anon and authenticated roles (it's a trigger function, should not be callable via RPC)

## Security
- Fixes 4 advisor warnings about mutable search_path and public SECURITY DEFINER function execution
*/

-- Fix handle_new_user: set search_path and revoke public execute
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), new.email);
  RETURN new;
END;
$$;

-- Fix update_updated_at: set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Revoke EXECUTE from anon and authenticated on handle_new_user (trigger-only function)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

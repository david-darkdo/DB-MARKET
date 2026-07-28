-- ENREACH CORE CATALOG STABILIZATION & SCALABILITY MIGRATION
-- 1. Redefine check_user_owns_favorite to support both auth.uid() AND profile.id
CREATE OR REPLACE FUNCTION public.check_user_owns_favorite(target_user_id UUID, auth_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    target_user_id = auth_uuid
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = target_user_id AND auth_id = auth_uuid
    )
  );
$$;

-- 2. Drop existing RLS policies on favorites
DROP POLICY IF EXISTS "Allow users insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow authenticated users select favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow users delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Admins read favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow admins select favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users read own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;

-- 3. Re-enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users select favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING (public.check_user_owns_favorite(user_id, auth.uid()));

CREATE POLICY "Allow users insert their own favorites" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (public.check_user_owns_favorite(user_id, auth.uid()));

CREATE POLICY "Allow users delete their own favorites" ON public.favorites
  FOR DELETE TO authenticated
  USING (public.check_user_owns_favorite(user_id, auth.uid()));

CREATE POLICY "Allow admins select favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


DROP POLICY IF EXISTS "Profiles: read auth" ON public.profiles;
CREATE POLICY "Profiles: read auth" ON public.profiles FOR SELECT TO authenticated USING (true);

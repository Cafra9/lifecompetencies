
-- Fix infinite recursion between classes and class_teachers RLS policies
CREATE OR REPLACE FUNCTION public.get_class_segment(_class_id uuid)
RETURNS school_segment
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT segmento FROM public.classes WHERE id = _class_id
$$;

DROP POLICY IF EXISTS "Classes: own select" ON public.classes;
CREATE POLICY "Classes: own select" ON public.classes
FOR SELECT TO authenticated
USING (
  professor_id = auth.uid()
  OR professor_regente_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_class_teacher(id, auth.uid())
);

DROP POLICY IF EXISTS "CT: read" ON public.class_teachers;
CREATE POLICY "CT: read" ON public.class_teachers
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_class_teacher(class_id, auth.uid())
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
  OR is_coordinator_of_segment(auth.uid(), public.get_class_segment(class_id))
);

DROP POLICY IF EXISTS "CT: write" ON public.class_teachers;
CREATE POLICY "CT: write" ON public.class_teachers
FOR ALL TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
  OR public.is_class_teacher(class_id, auth.uid())
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
  OR public.is_class_teacher(class_id, auth.uid())
);

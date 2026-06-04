
CREATE POLICY "SE storage: insert auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-evidences' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "SE storage: read own or staff" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-evidences'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_any_role(auth.uid(), ARRAY['admin','diretora','coordenador']::app_role[])
    )
  );
CREATE POLICY "SE storage: update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-evidences' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "SE storage: delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-evidences' AND (storage.foldername(name))[1] = auth.uid()::text);

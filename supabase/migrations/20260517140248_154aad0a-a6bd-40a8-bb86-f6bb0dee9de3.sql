
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('professor', 'coordenador', 'admin');
CREATE TYPE public.school_segment AS ENUM ('infantil', 'fundamental_1', 'fundamental_2', 'medio');
CREATE TYPE public.assessment_level AS ENUM ('inicial', 'em_desenvolvimento', 'proficiente', 'avancado');
CREATE TYPE public.resource_type AS ENUM ('artigo', 'video', 'podcast', 'infografico', 'guia', 'externo');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  segmento school_segment,
  disciplina TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role: SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ AUTO-CREATE PROFILE + DEFAULT ROLE ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'professor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COMPETENCIES / SKILLS ============
CREATE TABLE public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  indicadores JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- ============ COURSES (FORMAÇÃO) ============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  concluido BOOLEAN NOT NULL DEFAULT false,
  concluido_em TIMESTAMPTZ,
  UNIQUE (user_id, module_id)
);
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- ============ RESOURCES (BIBLIOTECA) ============
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID REFERENCES public.competencies(id) ON DELETE SET NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  tipo resource_type NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT,
  link_externo TEXT,
  segmento school_segment,
  disciplina TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ============ LESSON PLANS ============
CREATE TABLE public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  objetivos TEXT,
  competency_id UUID REFERENCES public.competencies(id) ON DELETE SET NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  serie TEXT,
  disciplina TEXT,
  materiais TEXT,
  evidencias TEXT,
  arquivo_url TEXT,
  publicado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER lesson_plans_updated_at BEFORE UPDATE ON public.lesson_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lesson_plan_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_plan_id)
);
ALTER TABLE public.lesson_plan_favorites ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lesson_plan_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_plan_comments ENABLE ROW LEVEL SECURITY;

-- ============ CLASSES / STUDENTS ============
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  segmento school_segment NOT NULL,
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ============ ASSESSMENTS ============
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  nivel assessment_level NOT NULL,
  observacao TEXT,
  evidence_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- ============ CHALLENGES ============
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- profiles: users see/edit own; admin sees all
CREATE POLICY "Profiles: select own or admin" ON public.profiles FOR SELECT
TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE
TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: admin update all" ON public.profiles FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: user sees own; only admin manages
CREATE POLICY "Roles: select own" ON public.user_roles FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Roles: admin manage" ON public.user_roles FOR ALL
TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- competencies / skills: all authenticated read; admin writes
CREATE POLICY "Competencies: read all auth" ON public.competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Competencies: admin write" ON public.competencies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Skills: read all auth" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Skills: admin write" ON public.skills FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- courses: all read; admin write
CREATE POLICY "Courses: read auth" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Courses: admin write" ON public.courses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Modules: read auth" ON public.course_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modules: admin write" ON public.course_modules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- course_progress: own
CREATE POLICY "Progress: own select" ON public.course_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Progress: own write" ON public.course_progress FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- resources: all auth read; author or admin manage
CREATE POLICY "Resources: read auth" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Resources: insert auth" ON public.resources FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "Resources: update own or admin" ON public.resources FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Resources: delete own or admin" ON public.resources FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- lesson_plans: published readable by all auth; own/admin manage
CREATE POLICY "LP: read published or own" ON public.lesson_plans FOR SELECT TO authenticated
USING (publicado = true OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "LP: insert own" ON public.lesson_plans FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());
CREATE POLICY "LP: update own or admin" ON public.lesson_plans FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "LP: delete own or admin" ON public.lesson_plans FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- favorites: own
CREATE POLICY "Fav: own all" ON public.lesson_plan_favorites FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- comments: all read, own write
CREATE POLICY "LPC: read auth" ON public.lesson_plan_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "LPC: insert own" ON public.lesson_plan_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "LPC: update own" ON public.lesson_plan_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "LPC: delete own or admin" ON public.lesson_plan_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- classes: professor owns; admin all
CREATE POLICY "Classes: own select" ON public.classes FOR SELECT TO authenticated
USING (professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Classes: own insert" ON public.classes FOR INSERT TO authenticated
WITH CHECK (professor_id = auth.uid());
CREATE POLICY "Classes: own update" ON public.classes FOR UPDATE TO authenticated
USING (professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Classes: own delete" ON public.classes FOR DELETE TO authenticated
USING (professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- students: via class ownership
CREATE POLICY "Students: own select" ON public.students FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND (c.professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Students: own insert" ON public.students FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND c.professor_id = auth.uid()));
CREATE POLICY "Students: own update" ON public.students FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND (c.professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Students: own delete" ON public.students FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND (c.professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- assessments: created by professor of student's class
CREATE POLICY "Assessments: own select" ON public.assessments FOR SELECT TO authenticated
USING (created_by = auth.uid());
CREATE POLICY "Assessments: own insert" ON public.assessments FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id
              WHERE s.id = assessments.student_id AND c.professor_id = auth.uid())
);
CREATE POLICY "Assessments: own update" ON public.assessments FOR UPDATE TO authenticated
USING (created_by = auth.uid());
CREATE POLICY "Assessments: own delete" ON public.assessments FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- challenges: read auth; admin write
CREATE POLICY "Challenges: read auth" ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Challenges: admin write" ON public.challenges FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('resources', 'resources', true),
  ('lesson-plan-files', 'lesson-plan-files', true),
  ('assessment-evidences', 'assessment-evidences', false),
  ('avatars', 'avatars', true);

-- Public buckets: anyone authenticated can read; uploader writes own files
CREATE POLICY "Public buckets read" ON storage.objects FOR SELECT TO public
USING (bucket_id IN ('resources','lesson-plan-files','avatars'));

CREATE POLICY "Auth upload public buckets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('resources','lesson-plan-files','avatars') AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth update own files public" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('resources','lesson-plan-files','avatars') AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth delete own files public" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('resources','lesson-plan-files','avatars') AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Private evidences: only uploader can read/write
CREATE POLICY "Evidences own read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'assessment-evidences' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Evidences own write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assessment-evidences' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Evidences own update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'assessment-evidences' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Evidences own delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'assessment-evidences' AND (auth.uid())::text = (storage.foldername(name))[1]);

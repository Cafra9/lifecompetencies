# Briefing técnico do projeto para ChatGPT

Vou gerar um único arquivo Markdown consolidado em `/mnt/documents/projeto-isp-briefing.md`, pronto para você colar (ou anexar) no ChatGPT.

## O que o documento vai conter

1. **Visão geral**
   - Propósito da plataforma (formação docente + avaliação por competências, framework ISP Life Competencies)
   - Perfis de usuário (Professor, Coordenador, Admin) e fluxos principais
   - Identidade visual (logo Aubrick ISP, cores do framework por competência, heatmap verde)

2. **Stack técnica**
   - TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + shadcn/ui
   - Lovable Cloud (Supabase) para auth, DB, storage
   - TanStack Query, Recharts, jsPDF, react-hook-form + zod

3. **Arquitetura de rotas** (mapa de `src/routes/`)
   - `/`, `/login`, `/auth`, `/avaliacoes`, `/avaliacoes/rubrica`, `/turmas`, `/turmas/$id`, `/alunos/$id`, `/formacao`, `/formacao/$slug`, `/biblioteca`, `/planos`, `/relatorios`, `/perfil`, `/admin`
   - Layout (`AppLayout`, `AppSidebar`) e proteção de rotas

4. **Modelo de dados (Supabase)** — todas as 15 tabelas com colunas, tipos e RLS resumida:
   `profiles`, `user_roles`, `competencies`, `skills`, `courses`, `course_modules`, `course_progress`, `resources`, `lesson_plans`, `lesson_plan_favorites`, `lesson_plan_comments`, `classes`, `students`, `assessments`, `student_assessments`, `student_assessment_meta`, `challenges`
   - Enum `app_role` + função `has_role` (SECURITY DEFINER)
   - Trigger `handle_new_user` (cria profile + role `professor` no signup)
   - Storage buckets: `resources`, `lesson-plan-files`, `assessment-evidences` (privado), `avatars`

5. **Framework de competências ISP (Big 5)**
   - Os 5 statements (`BIG5_STATEMENTS`)
   - As 15 habilidades agrupadas por competência (`FRAMEWORK_SKILLS` completo: Interpessoal, Cognitiva, Global, Digital, Autoliderança — com sub-habilidades)
   - Cores oficiais por competência (`COMPETENCIA_CORES`): Cognitivo verde, Global violeta, Digital azul, Autoliderança rosa, Interpessoal amarelo
   - Regra de cor da página de Avaliações: bolinhas/títulos seguem cor do framework; rubricas (Iniciando/Desenvolvendo/Dominando) em degradê verde único; heatmap em tons de verde

6. **Conteúdo pedagógico**
   - Objetivos do semestre, estratégias pedagógicas, Learning-First Design, plano de aula exemplo, escala de desenvolvimento, indicadores observáveis, badges, desafios mensais (extraído de `src/lib/iSP-content.ts`)

7. **Páginas principais e o que cada uma faz**
   - Dashboard, Formação, Biblioteca, Planos, Turmas, Avaliações (com `AvaliarDialog`, `HeatmapDialog`, `ClassHeatmapDialog`), Relatórios (PDF via jsPDF), Admin

8. **Regras de privacidade / RLS** (resumo legível)
   - Professor só vê suas turmas/alunos/avaliações
   - Admin gerencia estrutura (competências, habilidades, conteúdos)
   - Coordenador: leitura agregada

9. **Como rodar / publicar**
   - URL preview e publicada
   - Variáveis públicas (`VITE_SUPABASE_*`) e segredos servidor (`LOVABLE_API_KEY`, service role)

## Entrega

Após gerar o arquivo, vou expor um `<presentation-artifact>` com link de download direto do `.md`. Você poderá:
- Baixar e anexar no ChatGPT, ou
- Abrir e copiar o conteúdo inteiro.

Sem alterações de código — apenas geração de documento.

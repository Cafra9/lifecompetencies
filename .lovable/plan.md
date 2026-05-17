## Visão Geral

Plataforma web exclusiva para professores, com 3 perfis (Professor, Coordenador, Administrador), foco em formação continuada nas 5 competências e avaliação individual de alunos por habilidade. Backend via Lovable Cloud (Supabase), com RLS rigorosa para privacidade.

## Escopo do MVP

1. Autenticação (e-mail/senha) + perfis de usuário
2. Dashboard inicial personalizado por perfil
3. Formação Docente (5 trilhas + quiz + progresso)
4. Biblioteca Pedagógica (repositório com filtros e upload)
5. Planos de Aula colaborativos (CRUD, favoritos, comentários)
6. Avaliação de Alunos (turmas, alunos, registro por habilidade, evidências)
7. Relatórios básicos (radar das 5 competências + exportação PDF)
8. Perfil do usuário

Fora do MVP (Fase 2): fóruns, certificados automáticos, gamificação completa, mobile, IA, Google Drive.

## Identidade Visual

- Layout limpo, acolhedor e profissional; navegação lateral fixa; design responsivo.
- Paleta por competência: Cognitiva (azul), Global (verde), Digital (roxo), Autoliderança (laranja), Interpessoal (vermelho).
- Cards com ícone da competência, gráficos simples (radar, barras), tipografia clara — pensado para professores com baixo letramento digital (botões grandes, linguagem direta, fluxos curtos).

## Arquitetura de Navegação

Sidebar com: Dashboard · Formação · Biblioteca · Planos de Aula · Minhas Turmas · Avaliações · Relatórios · Perfil. Admin vê seção extra "Administração" (usuários, competências/habilidades, conteúdos).

## Modelo de Dados (Lovable Cloud)

- `profiles` (id→auth.users, nome, email, segmento, disciplina)
- `user_roles` (user_id, role: professor|coordenador|admin) — tabela separada + função `has_role` SECURITY DEFINER
- `competencies` (id, nome, descricao, cor, ordem)
- `skills` (id, competency_id, nome, descricao, indicadores jsonb, ordem)
- `courses` (trilhas) + `course_modules` + `course_progress` (user_id, module_id, concluido)
- `quizzes` + `quiz_questions` + `quiz_attempts`
- `resources` (biblioteca: tipo, titulo, descricao, competency_id, skill_id, segmento, disciplina, arquivo_url)
- `lesson_plans` (autor, titulo, descricao, competency_id, skill_id, serie, disciplina, materiais, evidencias)
- `lesson_plan_favorites`, `lesson_plan_comments`
- `classes` (nome, segmento, professor_id)
- `students` (nome, class_id)
- `assessments` (student_id, skill_id, nivel 1-4, observacao, evidence_url, created_by, data)
- `challenges` (titulo, descricao, data_inicio, data_fim)

Storage buckets: `resources`, `lesson-plan-files`, `assessment-evidences`, `avatars`.

## Regras de Privacidade (RLS)

- Professor lê/escreve apenas suas turmas, seus alunos, suas avaliações, seus planos (e planos públicos para leitura).
- Coordenador: leitura agregada (views sem PII de aluno individual quando aplicável).
- Admin: gerencia estrutura (competências, habilidades, usuários, conteúdo) — sem acesso pedagógico direto a avaliações individuais.
- Toda ação registrada (created_by, timestamps).

## Fluxos Principais

- Avaliação: Minhas Turmas → Aluno → Competência → Habilidade → Nível (Inicial/Em Desenvolvimento/Proficiente/Avançado) → Observação → Upload evidência → Salvar.
- Formação: Trilha → Módulos sequenciais → Quiz final → marca conclusão (certificado fica para Fase 2).
- Plano de aula: criar/editar → publicar → outros favoritam/comentam/baixam.

## Visualizações

- Perfil do aluno: radar das 5 competências + linha do tempo de avaliações + comentários.
- Visão da turma: médias por competência, habilidades com mais necessidade.
- Relatório PDF: dados do aluno, níveis, comentários, recomendações.

## Detalhes Técnicos

- Stack: React + Vite + Tailwind + shadcn/ui; Lovable Cloud (Supabase) para auth, DB, storage.
- Tokens semânticos no `index.css` para as 5 cores de competência (HSL).
- Gráficos: Recharts (radar, barras).
- PDF: `jspdf` + `jspdf-autotable`.
- Validação de formulários: `zod` + react-hook-form.
- Estado servidor: `@tanstack/react-query`.
- Estrutura `competencies`/`skills` populada com seeds editáveis — você enviará os nomes reais das 15 habilidades depois; entrego com placeholders e tela admin de edição.
- Roles em tabela separada `user_roles` + função `has_role` (evita escalonamento de privilégios).

## Plano de Entrega (iterativo)

1. Fundação: Cloud, schema base (competências, habilidades, perfis, roles), seeds, design system, layout + sidebar, login/cadastro.
2. Turmas + Alunos + Avaliações (com upload de evidências) + perfil do aluno com radar.
3. Formação Docente (trilhas, módulos, quiz, progresso).
4. Biblioteca Pedagógica (upload, filtros, busca).
5. Planos de Aula colaborativos (CRUD, favoritos, comentários).
6. Relatórios (turma/aluno) + exportação PDF + dashboard consolidado.
7. Painel Admin (editar competências/habilidades, gerir usuários) + perfil do usuário.

Cada etapa entregue, testada e refinada antes da próxima.

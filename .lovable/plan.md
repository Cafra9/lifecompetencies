
## Visão geral

Criar uma área **Configurações** (admin/diretora) para:
1. Convidar diretoras e coordenadoras por e-mail.
2. Associar coordenadoras a segmentos (Infantil, Fund I, Fund II, Médio).
3. Associar professores a ano(s) escolar(es).
4. Coordenadora definir, por ano sob sua responsabilidade, quais tipos de evidência são exigidos (rubrica, portfólio, notas, observação de comportamento).
5. Gerar **Relatório Consolidado do Aluno**, agregando rubricas + portfólio + observações de todos os professores do ano.

---

## 1. Modelo de dados (migrações)

**Novos enums**
- Adicionar `'diretora'` a `app_role` (já tem `professor`, `coordenador`, `admin`).
- Novo enum `evidence_type`: `rubrica`, `portfolio`, `notas`, `observacao_comportamento`.
- Novo enum `school_year`: `infantil_1`, `infantil_2`, `infantil_3`, `ano_1`...`ano_9`, `em_1`, `em_2`, `em_3` (mapeado por segmento).

**Novas tabelas**

- `invitations` — convites por e-mail
  - `email`, `role` (app_role), `segmento` (nullable), `anos` (text[] nullable), `token` (uuid), `expires_at`, `accepted_at`, `invited_by`.
  - RLS: admin/diretora gerencia; convidado consulta pelo token via fn.

- `coordinator_segments` — coordenadora ↔ segmento
  - `user_id`, `segmento`. Unique. Admin/diretora escreve; coordenadora lê o seu.

- `teacher_years` — professor ↔ ano(s)
  - `user_id`, `segmento`, `ano` (school_year). Unique. Coordenadora do segmento + admin escrevem; professor lê o seu.

- `year_evidence_requirements` — exigências por ano
  - `segmento`, `ano`, `evidence_type`, `obrigatorio` (bool), `descricao`, `created_by`.
  - Unique (segmento, ano, evidence_type). Coordenadora do segmento escreve; todos autenticados leem.

- `student_evidences` — entregas dos professores
  - `student_id`, `created_by` (professor), `evidence_type`, `competency_id` (nullable), `skill_id` (nullable), `titulo`, `descricao`, `arquivo_url`, `nota` (numeric nullable), `periodo` (text — bimestre/semestre), `created_at`.
  - RLS: professor cria/edita o próprio; coordenadora do segmento do aluno + diretora + admin leem todos.

- Reutilizar `student_assessments` (rubricas) e a tabela existente para observações; adicionar coluna `periodo` em `student_assessments` se necessário.

**Funções/triggers**
- `has_any_role(uuid, app_role[])` security definer.
- `is_coordinator_of_segment(uuid, school_segment)` — lê `coordinator_segments`.
- `student_segment(uuid)` — retorna segmento via `classes`.
- Trigger em `auth.users` (já existe `handle_new_user`) — estender para ler convite pendente por e-mail e atribuir `role` + vínculos.

**Grants** em todas as novas tabelas: `authenticated` SELECT/INSERT/UPDATE/DELETE conforme RLS, `service_role` ALL.

---

## 2. Fluxo de convites

- `/configuracoes/equipe` (admin + diretora): formulário "Convidar" com e-mail + papel (diretora/coordenadora/professor) + segmento (se coord) + anos (se professor).
- Server fn `createInvitation` insere em `invitations` e dispara e-mail via **Lovable Auth Email** (template "Convite") com link `/auth?invite=<token>`.
- Em `/auth`, se houver `?invite=...`, abre tela de signup pré-preenchida; após signup, trigger `handle_new_user` lê convite, atribui role e cria vínculo (`coordinator_segments` ou `teacher_years`).

E-mails: usar `email_domain--scaffold_auth_email_templates` (ou template transacional) — exige domínio de e-mail configurado.

---

## 3. Páginas e UI

**Nova rota `/configuracoes`** (layout com sub-tabs, gated por role):

- **Equipe** (admin/diretora) — listar usuários por papel, convidar, revogar, reatribuir segmento/anos.
- **Meu segmento** (coordenadora) — ver professores do segmento, ver/editar anos atribuídos, ver exigências por ano.
- **Exigências por ano** (coordenadora) — para cada ano do segmento, checklist dos `evidence_type` + campo descrição/orientação para o professor.
- **Meus anos** (professor) — visualização read-only dos anos e exigências.

Sidebar: novo item "Configurações" (ícone Settings) — visível para `admin`, `diretora`, `coordenadora`. Para `professor`, item "Minhas exigências".

---

## 4. Captura de evidências (professor)

- Em `/alunos/$id` adicionar abas: **Rubrica**, **Portfólio**, **Notas**, **Observações** (renderizadas conforme `year_evidence_requirements` do ano do aluno).
- Cada aba grava em `student_evidences` (ou `student_assessments` para rubrica).
- Badge "pendente"/"completo" por exigência, por período.

---

## 5. Relatório consolidado do aluno

**Nova rota `/relatorios/aluno/$id`** (coordenadora do segmento + diretora + admin + professor do aluno):

- Cabeçalho: aluno, turma, ano, professores vinculados (todos que lançaram algo).
- **Por competência** (cards com cor de `COMPETENCIA_CORES`):
  - Heatmap das habilidades (consolidado de todos os professores).
  - Lista de evidências (rubricas + portfólio + notas + observações) com autor, data, tipo, anexo.
- Filtros: período, professor, tipo de evidência.
- Botão "Exportar PDF" reaproveitando `src/lib/pdf.ts`.

Server fn `getStudentConsolidatedReport(studentId)` faz `Promise.all` de:
- `student_assessments` + `assessments` (rubricas)
- `student_evidences` (portfólio/notas/observação)
- `student_assessment_meta` (observação geral)
- profiles dos `created_by` para mostrar autores.

---

## 6. RLS resumida (linguagem natural)

- **invitations**: admin e diretora gerenciam; ninguém mais lê.
- **coordinator_segments**: admin/diretora escrevem; coordenadora lê o próprio.
- **teacher_years**: admin/diretora/coordenadora do segmento escrevem; professor lê o próprio.
- **year_evidence_requirements**: coordenadora do segmento e diretora escrevem; todos autenticados leem.
- **student_evidences**: professor cria/edita as próprias; coordenadora do segmento do aluno, diretora e admin leem todas; professor lê as próprias.
- Relatório consolidado é acessível a: professor vinculado ao aluno, coordenadora do segmento, diretora, admin.

---

## 7. Ordem de execução

1. Migração: enum updates + novas tabelas + grants + RLS + funções + trigger estendido.
2. Server functions (`src/lib/*.functions.ts`): convites, gestão de equipe, exigências, evidências, relatório consolidado.
3. UI: `/configuracoes` (4 sub-tabs por papel), item de sidebar.
4. Captura nas páginas existentes de aluno (abas dinâmicas conforme exigências).
5. Página `/relatorios/aluno/$id` + export PDF.
6. Setup do e-mail de convite (chamará `email_domain--check_email_domain_status` e, se necessário, o setup dialog).

---

## Pontos técnicos relevantes

- Roles em tabela separada (`user_roles`) — manter padrão, **não** colocar em `profiles`.
- `has_role` security definer já existe; adicionar `has_any_role` e `is_coordinator_of_segment` no mesmo padrão.
- Trigger `handle_new_user` precisará ler `invitations.email = NEW.email` e aplicar role/vínculo dentro de `SECURITY DEFINER`.
- `student_evidences.arquivo_url` usa bucket **privado** novo `student-evidences` (criar via `storage_create_bucket`).
- Reaproveitar `COMPETENCIA_CORES` e rubricas verdes já definidas.
- E-mail de convite depende de domínio configurado — se não houver, planejar caminho alternativo: copiar link de convite manualmente.

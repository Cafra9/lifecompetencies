
## Objetivo

Transformar **anos escolares** e **tipos de exigência** de enums fixos no código em **registros de banco**, permitindo CRUD pela administração. Adicionar CRUD de professores e fazer o relatório final usar dinamicamente as exigências cadastradas para o ano do aluno.

---

## 1. Banco de dados (migração única)

### Novas tabelas

**`school_years`** — anos escolares dinâmicos
- `codigo` (text, único, ex: `K1`, `K5`, `ANO_3`)
- `nome` (text, ex: "K1", "5º ano")
- `segmento` (school_segment, mantido como segmento — Infantil/Fund I/Fund II/Médio)
- `ordem` (int)
- `ativo` (bool)

**`evidence_requirements`** — catálogo de exigências (Rubricas, Portfólio, Relatório descritivo, Fotos, Avaliações, Observações, Produções, Projetos, etc.)
- `nome` (text, único)
- `descricao` (text)
- `slug` (text, único)
- `ativo` (bool)

**`year_requirements`** — junção ano × exigência (substitui `year_evidence_requirements`)
- `school_year_id` (fk)
- `requirement_id` (fk)
- `obrigatorio` (bool)
- `orientacao` (text)
- unique (school_year_id, requirement_id)

### Tabelas alteradas

- **`teacher_years`** — substituir coluna `ano` (enum) por `school_year_id` (fk para `school_years`); manter `segmento` opcional.
- **`student_evidences`** — substituir `evidence_type` (enum) por `requirement_id` (fk para `evidence_requirements`).
- **`classes`** — adicionar `school_year_id` opcional para indicar o ano da turma (necessário para o relatório saber qual ano um aluno cursa).

### Seed inicial

- Renomear segmento `infantil` → rótulo "K" no app (mantemos o enum `school_segment` interno; só muda o label).
- Inserir registros default em `school_years`: **K1, K2, K3, K4, K5** (segmento `infantil`) + manter anos Fund/EM existentes migrando do enum atual.
- Inserir registros default em `evidence_requirements` a partir dos tipos atuais (Rubricas, Portfólio, Notas, Observações) + os novos do briefing (Relatório descritivo, Evidências fotográficas, Avaliações acadêmicas, Produções dos alunos, Projetos realizados).
- Migrar dados existentes de `year_evidence_requirements` → `year_requirements`.

### RLS

- `school_years`, `evidence_requirements`: leitura para todos os autenticados; escrita só admin/diretora.
- `year_requirements`: leitura para todos os autenticados; escrita para admin/diretora/coordenadora do segmento.
- `teacher_years` e `student_evidences`: manter políticas atuais, ajustando para as novas colunas.

### Depreciação

- Os enums `school_year` e `evidence_type` ficam **inutilizados** após a migração (deixar no banco para não quebrar, mas o código não referencia mais).

---

## 2. Configurações — novas abas/UI

Reorganizar `/configuracoes` em 4 abas (visíveis para admin/diretora; coordenadora vê o subset dela):

### a) **Anos escolares**
- Tabela com colunas: código, nome, segmento, ordem, ativo.
- Botões: **Adicionar**, **Editar**, **Excluir** (com confirmação; bloqueia exclusão se houver turmas/professores vinculados — sugere desativar).

### b) **Exigências** (catálogo)
- Tabela: nome, descrição, ativo.
- CRUD completo.

### c) **Exigências por ano**
- Seletor de ano → lista de exigências do catálogo com checkbox **obrigatório** + campo **orientação**.
- Salva em `year_requirements`.

### d) **Professores**
- Tabela: nome, e-mail, cargo, anos atendidos (chips), status (ativo/inativo).
- **Adicionar**: envia convite por e-mail (reaproveita `invitations`) já com anos pré-selecionados.
- **Editar**: alterar anos atendidos (escreve em `teacher_years`), cargo (campo novo em `profiles` — `cargo` text), status (campo novo em `profiles` — `ativo` bool).
- **Excluir**: desativa (soft delete via `ativo=false`); botão "remover papel" para revogar role professor.

### e) **Equipe** (mantida)
- Continua para diretoras/coordenadoras (convites de gestão).

---

## 3. Relatório consolidado

`/relatorios/aluno/$id`:
- Buscar o `school_year_id` do aluno via `classes.school_year_id`.
- Buscar `year_requirements` desse ano (apenas os obrigatórios/ativos).
- Para cada exigência, agregar as `student_evidences` correspondentes (`requirement_id`) + rubricas (`student_assessments`, se "Rubricas" estiver entre as exigências) + observações (se exigência "Observações comportamentais" presente).
- Renderizar uma seção por exigência cadastrada — **nada hard-coded**.
- Se o ano não tem exigências cadastradas, mostrar aviso com link para "Exigências por ano".

---

## 4. Código

- **Remover** `YEAR_LABELS`, `YEARS_BY_SEGMENT`, `EVIDENCE_LABELS`, `EVIDENCE_DESCRIPTIONS`, `ALL_EVIDENCE_TYPES` de `src/lib/school-config.ts` (manter apenas `SEGMENT_LABELS` ajustado: Infantil → "K").
- Criar hooks/funções (`src/lib/years.functions.ts`, `evidence-requirements.functions.ts`, `teachers.functions.ts`) com `createServerFn` para CRUDs.
- Substituir todos os usos dos enums por queries dinâmicas das novas tabelas.
- Atualizar páginas de captura de evidência em `/alunos/$id` para renderizar abas com base em `year_requirements` do ano da turma do aluno.

---

## 5. Ordem de execução

1. Migração SQL (criação de tabelas, alterações, seed e migração de dados).
2. Server functions (years, requirements, year-requirements, teachers).
3. UI `/configuracoes` reorganizada (4 abas + edição inline).
4. Refatorar `school-config.ts` e remover referências aos enums.
5. Atualizar relatório consolidado para usar `year_requirements` dinâmicas.
6. Ajustar captura de evidências em `/alunos/$id`.

---

## ⚠️ Pontos de atenção

- **Migração destrutiva** em `teacher_years` e `student_evidences` (troca de coluna). Faremos `ALTER` com `USING` para converter os enums existentes nos novos FKs com base no seed.
- A **turma** precisa de `school_year_id` para o relatório funcionar — vamos adicionar e tentar inferir o ano a partir do nome da turma quando possível; caso contrário, o admin precisa preencher manualmente.
- "K" substitui "Infantil" apenas como **label** (segmento interno continua `infantil`) — evita migração de enum.

Posso prosseguir?

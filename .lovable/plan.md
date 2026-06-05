## Objetivo

Tornar o botão **Evidências** do card do aluno (em `/avaliacoes`) dependente das evidências que a **turma** exige, com contador dinâmico `X/Y` e um diálogo organizado pela lista de requisitos da turma.

A base já existe no banco — `year_requirements` (school_year_id → requirement_id) é o que define o que cada turma exige, e já é usado em `routes/turmas/$id.tsx` e `routes/alunos/$id.tsx`. Vamos reaproveitar a mesma fonte na tela de avaliações.

## Mudanças

### 1. `src/routes/avaliacoes/index.tsx`
- Após carregar a turma selecionada, buscar `school_year_id` da turma e a lista de `year_requirements` correspondente (join com `evidence_requirements` para obter `nome`, `slug`, `allowed_extensions`, `orientacao`, `obrigatorio`).
- Passar essa lista (`requirements`) para cada `AlunoCard` e para o `EvidencesDialog`.
- `AlunoCard`: substituir `useEvidenceCount` por um hook que retorna `{ fulfilled, total }`:
  - `total` = nº de requisitos definidos para a turma (ou 0 se a turma não tem requisitos).
  - `fulfilled` = nº de `requirement_id` distintos presentes em `student_evidences` do aluno que estão dentro do conjunto exigido.
- Botão passa a exibir `Evidências (X/Y)`. Quando `total === 0`, exibe `Evidências` (sem fração) e o diálogo mostra um aviso de "Nenhum requisito definido para esta turma — defina em Configurações".

### 2. `src/components/EvidencesDialog.tsx`
- Aceitar nova prop `requirements: Array<{ id, nome, orientacao, obrigatorio, allowed_extensions }>`.
- Reorganizar o conteúdo: em vez de uma lista plana de uploads, mostrar **uma seção por requisito** na ordem definida:
  - Cabeçalho com nome, badge "Obrigatório/Opcional", check verde quando já há ao menos uma evidência daquele `requirement_id`, e botão **Adicionar evidência** que abre `EvidenceUploadDialog` já com `defaultRequirementId` fixado (a categoria não é editável no upload neste fluxo).
  - Lista das evidências enviadas para aquele requisito (mesmo card atual com visualizar/baixar/excluir).
- Evidências "órfãs" (sem `requirement_id` ou com requisito que não pertence mais à turma) ficam em uma seção final "Outras evidências".
- Resumo no topo: `X/Y requisitos atendidos`.

### 3. `src/components/EvidenceUploadDialog.tsx`
- Quando receber `defaultRequirementId`, esconder o seletor de categoria e travar nesse requisito (mantendo as extensões permitidas dinâmicas, como já está).

### 4. Hook utilitário
- Em `EvidencesDialog.tsx`, substituir `useEvidenceCount` por `useEvidenceProgress(studentId, requiredIds)` que retorna `{ fulfilled, total, fulfilledIds }`. Mantém uma única query (`student_evidences` por `student_id` selecionando `requirement_id`) e calcula a interseção no cliente.

## Fora de escopo
- Não muda schema do banco, RLS, nem o fluxo da página `/alunos/$id` (que já segue padrão semelhante).
- Não altera regras de avaliação/N-A, heatmap ou relatório IA.
- Não cria/edita requisitos por turma — isso continua em Configurações.

## Arquivos afetados
- `src/routes/avaliacoes/index.tsx`
- `src/components/EvidencesDialog.tsx`
- `src/components/EvidenceUploadDialog.tsx`

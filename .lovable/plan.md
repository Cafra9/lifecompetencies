## Objetivo

Permitir que o professor marque cada habilidade da rubrica como **"Não se aplica" (N/A)**, opcionalmente com uma breve justificativa. O item N/A é registrado sem pontuação e aparece de forma transparente no relatório, garantindo que toda habilidade foi avaliada ou justificadamente excluída.

## Mudanças

### 1. Modelo de dados (`student_assessments`)
- Adicionar valor lógico `"nao_aplica"` ao tipo `Nivel` (a coluna `nivel` é `text`, não enum — não exige migration de tipo).
- Adicionar coluna `justificativa text` (nullable, máx. 500 chars) em `student_assessments` via migration, para guardar a justificativa breve quando `nivel = 'nao_aplica'`.
- `countByLevel` passa a contar `naoAplica` separado e **não** soma ao `total` pontuável (só conta habilidades com nível pontuável: iniciando/desenvolvendo/dominando). Um novo contador `cobertas = pontuadas + naoAplica` é usado para indicar "todas as habilidades foram tratadas".

### 2. UI — `AvaliarDialog`
- Adicionar 4ª opção no grid de níveis dentro do accordion de cada habilidade: **"Não se aplica"** (estilo neutro/cinza, diferente dos verdes).
- Ao selecionar N/A, mostrar um `Textarea` compacto inline ("Justificativa breve — opcional", maxLength 500) que persiste junto.
- Badge do item passa a mostrar "N/A" quando aplicável.
- Contador no topo: `X/15 habilidades avaliadas · Y N/A` (ou cobertura `Z/15`).
- `save()` / store atualizados para enviar `justificativa` no upsert e limpá-la quando o nível volta a ser pontuável.

### 3. UI — `AlunoCard` (lista de avaliações)
- Nova linha "Não se aplica" no resumo (cinza).
- Botões "Heatmap" / "Relatório" passam a ficar habilitados quando houver qualquer item tratado (pontuado **ou** N/A), não só pontuados.
- "Fechar avaliação" exige que **todas as 15 habilidades estejam cobertas** (pontuadas ou marcadas como N/A), reforçando a regra de "relatório completo".

### 4. Heatmap (`HeatmapDialog`, `ClassHeatmapDialog`)
- Células N/A renderizadas com hachura/cinza claro e tooltip "Não se aplica — <justificativa>".

### 5. Relatório IA (`src/lib/report.functions.ts`)
- Schema Zod aceita `nivel: "iniciando" | "desenvolvendo" | "dominando" | "nao_aplica"` e `justificativa?: string`.
- Prompt atualizado: instrui a IA a **listar explicitamente as habilidades marcadas como N/A** em um parágrafo dedicado ("Habilidades não aplicáveis neste momento"), citando a justificativa quando houver, sem atribuir nível/pontuação.
- `AvaliarDialog.handleGerarCompleto` passa também os itens N/A (hoje filtra implicitamente pelo `Object.entries(data)`; precisa propagar `justificativa`).

### 6. PDF
- Sem mudança estrutural — o texto gerado pela IA já contemplará o bloco de N/A.

## Arquivos afetados

- `supabase/migrations/<novo>.sql` — adiciona coluna `justificativa` em `student_assessments`.
- `src/lib/rubrica-infantil.ts` — estende `Nivel` e `NIVEL_LABEL`.
- `src/lib/assessments-store.ts` — persistência da justificativa + `countByLevel` com `naoAplica` e `cobertas`.
- `src/components/AvaliarDialog.tsx` — botão N/A + campo justificativa + cálculo.
- `src/routes/avaliacoes/index.tsx` — `AlunoCard`: nova linha, regra de fechamento, habilitação de Heatmap/Relatório.
- `src/components/HeatmapDialog.tsx`, `src/components/ClassHeatmapDialog.tsx` — render N/A.
- `src/lib/report.functions.ts` — schema + prompt.

## Fora de escopo

- Não muda a tabela legada `assessments` (USER-DEFINED enum) — ela não é usada pelo fluxo de rubrica do aluno.
- Não altera evidências, turmas, ou auth.
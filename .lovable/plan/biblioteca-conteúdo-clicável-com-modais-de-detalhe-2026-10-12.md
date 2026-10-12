# Biblioteca: conteúdo clicável com modais de detalhe

## Problema
A página `/biblioteca` é estática: os 3 cards de recurso (Framework ISP, Rubricas por estágio, Templates KSU) não têm ação de clique.

## Solução
Tornar os 3 cards clicáveis; cada um abre um modal (Dialog) com o conteúdo completo já existente no app — sem novas páginas e sem alterar dados.

## Implementação
Arquivo principal: `src/routes/biblioteca/index.tsx` (+ um novo componente de modal, ex.: `src/components/BibliotecaDetalheDialog.tsx`).

1. **Card "Framework ISP"** → modal com as 5 competências (`FRAMEWORK_SKILLS` de `src/lib/iSP-content.ts`): cada competência com suas subcompetências e a lista completa de habilidades, colorido com `competencyColor`.

2. **Card "Rubricas por estágio"** → modal com as 4 etapas (Stage 1–4):
   - Stage 1 (4–7 anos): rubrica completa de `RUBRICA_INFANTIL` (`src/lib/rubrica-infantil.ts`) — competências, habilidades, descritores (Iniciando / Desenvolvendo / Dominando) e exemplos de cada nível.
   - Stages 2–4 (7–11, 11–14, 14–18): exibidos como indisponíveis ("em breve"), usando `SEGMENTOS` — sem inventar conteúdo.

3. **Card "Templates KSU"** → modal com:
   - Modelo de plano (campos do `MODELO_PLANO`).
   - Exemplo de plano completo (`PLANO_EXEMPLO`: objetivos, momentos da aula, competências trabalhadas).
   - Design "Learning First" (`LEARNING_FIRST_DESIGN`: os 4 passos).

Detalhes de UX:
- Cards ganham cursor de clique, hover sutil e ícone indicativo (ex.: seta/olho).
- Modais roláveis, largura confortável, título e descrição do recurso no cabeçalho.
- Conteúdo reutiliza os componentes atuais (Card, Badge, Tabs) — nenhuma dependência nova.

## Fora do escopo
- Nada de backend, banco de dados ou edição de conteúdo pelo admin.
- Rubricas dos Stages 2–4 não são criadas (não existem no material atual).

## Verificação
- Build sem erros.
- Teste com Playwright: abrir `/biblioteca`, clicar em cada um dos 3 cards e confirmar que o modal correspondente abre com o conteúdo correto.

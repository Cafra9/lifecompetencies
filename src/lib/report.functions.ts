import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AvaliacaoSchema = z.object({
  competencia: z.string().min(1).max(80),
  habilidade: z.string().min(1).max(120),
  nivel: z.enum(["iniciando", "desenvolvendo", "dominando", "nao_aplica"]),
  justificativa: z.string().max(500).optional(),
});

const KnowledgeBaseSchema = z.object({
  titulo: z.string().min(1).max(200),
  conteudo: z.string().min(1),
});

const EvidenciaSchema = z.object({
  id: z.string().max(100).optional().default(""),
  titulo: z.string().min(1).max(200),
  categoria: z.string().min(1).max(120),
  descricao: z.string().max(2000).optional().default(""),
  arquivo: z.string().max(300).optional().default(""),
  analysisStatus: z.enum(["pending", "analyzing", "analyzed", "error", "skipped"]).optional().default("pending"),
  analysisSummary: z.string().max(6000).optional().default(""),
  analysisError: z.string().max(1200).optional().default(""),
});

const TomSchema = z.enum(["descritivo", "objetivo", "afetivo"]).optional().default("descritivo");

const FullInputSchema = z.object({
  mode: z.literal("full"),
  alunoNome: z.string().min(1).max(120),
  professorNome: z.string().min(1).max(120),
  segmentoLabel: z.string().min(1).max(80),
  observacaoProfessor: z.string().max(4000).optional().default(""),
  avaliacoes: z.array(AvaliacaoSchema).min(1).max(50),
  basesConhecimento: z.array(KnowledgeBaseSchema).max(100).optional().default([]),
  evidencias: z.array(EvidenciaSchema).max(60).optional().default([]),
  tom: TomSchema,
});

const RewriteInputSchema = z.object({
  mode: z.literal("rewrite"),
  alunoNome: z.string().min(1).max(120),
  trecho: z.string().min(1).max(4000),
  contexto: z.string().max(8000).optional().default(""),
  tom: TomSchema,
});

const InputSchema = z.discriminatedUnion("mode", [FullInputSchema, RewriteInputSchema]);

type TomRelatorio = "descritivo" | "objetivo" | "afetivo";

const NIVEL_LABEL: Record<"iniciando" | "desenvolvendo" | "dominando", string> = {
  iniciando: "Iniciando",
  desenvolvendo: "Desenvolvendo",
  dominando: "Dominando",
};

const STATUS_MOTIVO: Record<string, string> = {
  pending: "analise ainda pendente",
  analyzing: "analise ainda em andamento",
  error: "erro na analise automatica",
  skipped: "ignorada por limite tecnico ou ausencia de conteudo analisavel",
};

async function callGatewayText(prompt: string, apiKey: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("AI gateway error:", res.status, body);
    if (res.status === 429) return { texto: "", error: "Limite de uso atingido. Tente novamente em instantes." };
    if (res.status === 402) return { texto: "", error: "Creditos de IA esgotados no workspace." };
    return { texto: "", error: `Falha ao gerar relatorio (${res.status}).` };
  }
  const json = await res.json();
  const texto = json?.choices?.[0]?.message?.content ?? "";
  return { texto: String(texto).trim(), error: null as string | null };
}

function tomInstrucao(tom: TomRelatorio) {
  const tomInstrucoes: Record<TomRelatorio, string> = {
    descritivo:
      "TOM: mais descritivo e narrativo. Detalhe situacoes, cenas e nuances do cotidiano escolar; use exemplos concretos e paragrafos mais ricos.",
    objetivo:
      "TOM: mais objetivo e conciso. Use frases diretas, vocabulario tecnico-pedagogico moderado e priorize fatos observaveis.",
    afetivo:
      "TOM: mais afetivo e acolhedor. Use linguagem calorosa, proxima da familia, valorizando vinculos, conquistas e singularidades, mantendo profissionalismo.",
  };
  return tomInstrucoes[tom];
}

export const gerarRelatorioAluno = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { texto: "", error: "Chave de API indisponivel no servidor.", analisadas: [], naoAnalisadas: [] };
    }

    const tom = (data.tom ?? "descritivo") as TomRelatorio;
    const instrucaoTom = tomInstrucao(tom);

    if (data.mode === "rewrite") {
      const prompt = `Voce e um(a) coordenador(a) pedagogico(a) do programa iSP Life Competencies.
Reescreva APENAS o trecho abaixo do relatorio pedagogico do(a) aluno(a) "${data.alunoNome}", em portugues, em prosa fluida (sem bullets, sem markdown, sem titulos). Mantenha aproximadamente o mesmo tamanho.

${instrucaoTom}

${data.contexto ? `Contexto do relatorio completo (apenas para referencia, NAO reescreva):\n"""\n${data.contexto}\n"""\n` : ""}
Trecho a reescrever:
"""
${data.trecho}
"""

Responda APENAS com o texto reescrito, sem aspas, sem prefacios.`;
      const r = await callGatewayText(prompt, apiKey);
      return { ...r, analisadas: [], naoAnalisadas: [] };
    }

    const evidenciasAnalisadas = data.evidencias.filter(
      (e) => e.analysisStatus === "analyzed" && e.analysisSummary.trim(),
    );
    const evidenciasNaoAnalisadas = data.evidencias.filter(
      (e) => !(e.analysisStatus === "analyzed" && e.analysisSummary.trim()),
    );

    const analisadas = evidenciasAnalisadas.map((e) => ({
      titulo: e.titulo,
      categoria: e.categoria,
      arquivo: e.arquivo,
    }));

    const naoAnalisadas = evidenciasNaoAnalisadas.map((e) => ({
      titulo: e.titulo,
      arquivo: e.arquivo,
      motivo:
        e.analysisError ||
        STATUS_MOTIVO[e.analysisStatus] ||
        "sem resumo de analise salvo",
    }));

    const pontuadas = data.avaliacoes.filter((a) => a.nivel !== "nao_aplica");
    const naoAplicaveis = data.avaliacoes.filter((a) => a.nivel === "nao_aplica");

    const linhasPontuadas = pontuadas
      .map(
        (a) =>
          `- [${a.competencia} | ${a.habilidade}] estagio definido pela rubrica: ${
            NIVEL_LABEL[a.nivel as "iniciando" | "desenvolvendo" | "dominando"]
          } (${a.nivel})`,
      )
      .join("\n");

    const linhasNA = naoAplicaveis
      .map(
        (a) =>
          `- [${a.competencia} | ${a.habilidade}] NAO SE APLICA${
            a.justificativa ? ` - justificativa: ${a.justificativa}` : ""
          }`,
      )
      .join("\n");

    const obsBloco = data.observacaoProfessor.trim()
      ? `\nObservacoes do(a) professor(a) sobre o(a) aluno(a):\n"""\n${data.observacaoProfessor.trim()}\n"""\n`
      : "";

    const basesBloco = data.basesConhecimento.length
      ? `\nBASE DE CONHECIMENTO ATIVA DO ANO ESCOLAR (conhecimento integral da IA):\nTodo o conteudo abaixo deve ser considerado conhecimento ativo durante a geracao: rubricas, algoritmos, criterios, descritores, exemplos de redacao, modelos de texto, referencias e orientacoes pedagogicas. Use integralmente para interpretar as evidencias, determinar o estagio com a rubrica correspondente, organizar a narrativa e propor proximos passos. Nao copie mecanicamente, mas considere todos os criterios cadastrados.\n${data.basesConhecimento
          .map((b, i) => `--- Base ${i + 1}: ${b.titulo} ---\n${b.conteudo}`)
          .join("\n\n")}\n`
      : "";

    const evidenciasBloco = evidenciasAnalisadas.length
      ? `\nEVIDENCIAS INDIVIDUAIS DO ALUNO JA ANALISADAS (principal fonte de dados sobre a crianca):\nUse estes achados como materia-prima principal para descrever caracteristicas, comportamentos, avancos, potencialidades, necessidades e proximos passos. Interprete cada achado com a Base de Conhecimento ativa e com a rubrica correspondente. Nao invente fatos alem dos achados, das observacoes e da Base.\n${evidenciasAnalisadas
          .map(
            (e, i) =>
              `--- Evidencia ${i + 1}: ${e.titulo} [${e.categoria}]${e.arquivo ? ` - ${e.arquivo}` : ""} ---\n${
                e.descricao ? `Observacao do professor no upload: ${e.descricao}\n` : ""
              }Analise salva da evidencia:\n${e.analysisSummary}`,
          )
          .join("\n\n")}\n`
      : "";

    const naoAnalisadasBloco = naoAnalisadas.length
      ? `\nEVIDENCIAS CADASTRADAS MAS AINDA NAO ANALISADAS:\nNao use estas evidencias como fonte factual nesta geracao; mencione internamente que ficaram fora da analise por status tecnico.\n${naoAnalisadas
          .map((e) => `- ${e.titulo}${e.arquivo ? ` (${e.arquivo})` : ""}: ${e.motivo}`)
          .join("\n")}\n`
      : "";

    const prompt = `Voce e a inteligencia pedagogica do programa iSP Life Competencies.
Gere um relatorio descritivo PERSONALIZADO, em portugues, em prosa fluida, sobre a crianca "${data.alunoNome}" (${data.segmentoLabel}).

${instrucaoTom}

ARQUITETURA DE ANALISE:
1. Analise as evidencias individuais ja processadas. Elas sao a principal fonte de dados individuais do aluno.
2. Interprete essas evidencias usando integralmente a Base de Conhecimento ativa, incluindo algoritmos, criterios, rubricas, descritores, exemplos de redacao, modelos de texto, referencias e orientacoes pedagogicas.
3. Determine e respeite o estagio de desenvolvimento usando a Rubrica correspondente informada nas avaliacoes. A rubrica orienta a analise, mas nao deve virar o foco da redacao.
4. Gere uma narrativa sobre a crianca, nao sobre a rubrica.

PRINCIPIOS:
- A Base de Conhecimento e a inteligencia principal do sistema. Todo conteudo cadastrado nela deve ser considerado conhecimento ativo.
- As evidencias sao o dado individual mais importante. O relatorio deve refletir o que foi observado nas producoes, portfolios, fotos, videos, observacoes, relatorios, rubricas e projetos analisados.
- A rubrica define/orienta o estagio de desenvolvimento; use esse estagio para calibrar a interpretacao pedagogica, mas evite escrever um texto centrado em nomes de niveis.
- O texto final deve descrever caracteristicas, comportamentos, avancos, potencialidades e proximos passos de ${data.alunoNome}.
- Quando houver pouca evidencia analisada, seja transparente na cautela da linguagem e apoie-se nas observacoes do professor e na rubrica registrada.

REGRAS DE REDACAO:
- Nao escreva uma explicacao da rubrica. Escreva sobre a crianca.
- Nao transforme o relatorio em tabela, checklist, lista de habilidades ou comentario tecnico por competencia.
- Nao altere o estagio registrado na rubrica, mas tambem nao faca do estagio o centro da frase. Ele deve orientar a analise.
- Nao invente fatos, falas, comportamentos, producoes ou avancos que nao estejam nas evidencias analisadas, nas observacoes do professor ou na Base de Conhecimento.
- Nao mencione habilidades marcadas como NAO SE APLICA.
- Sem bullets, sem titulos, sem markdown - apenas paragrafos separados por linha em branco.
- Use o nome de ${data.alunoNome} com naturalidade, sem repeticao excessiva.

ESTRUTURA SUGERIDA (fluida, sem titulos visiveis):
1) Abertura situando a crianca e o momento de desenvolvimento observado.
2) Corpo com 2 a 4 paragrafos descrevendo comportamentos, producoes, formas de interagir, aprender, expressar-se, resolver desafios e participar do cotidiano escolar, sempre ancorado nas evidencias e interpretado pela Base de Conhecimento.
3) Fechamento com potencialidades e proximos passos, em tom de parceria entre escola e familia.

Insumos obrigatorios para sua escrita:

Avaliacoes da rubrica (fonte para determinar o estagio, nao o foco da redacao):
${linhasPontuadas || "(nenhuma habilidade pontuada)"}

${linhasNA ? `[Habilidades NAO SE APLICA - apenas para seu conhecimento; NAO mencione no relatorio]\n${linhasNA}\n` : ""}${obsBloco}${evidenciasBloco}${naoAnalisadasBloco}${basesBloco}
Responda APENAS com o texto do relatorio, em prosa fluida, sem titulos, sem markdown.`;

    const r = await callGatewayText(prompt, apiKey);
    return { ...r, analisadas, naoAnalisadas };
  });

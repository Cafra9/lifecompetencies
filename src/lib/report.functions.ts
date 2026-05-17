import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AvaliacaoSchema = z.object({
  competencia: z.string().min(1).max(80),
  habilidade: z.string().min(1).max(120),
  nivel: z.enum(["iniciando", "desenvolvendo", "dominando"]),
});

const FullInputSchema = z.object({
  mode: z.literal("full"),
  alunoNome: z.string().min(1).max(120),
  professorNome: z.string().min(1).max(120),
  segmentoLabel: z.string().min(1).max(80),
  observacaoProfessor: z.string().max(4000).optional().default(""),
  avaliacoes: z.array(AvaliacaoSchema).min(1).max(50),
});

const RewriteInputSchema = z.object({
  mode: z.literal("rewrite"),
  alunoNome: z.string().min(1).max(120),
  trecho: z.string().min(1).max(4000),
  contexto: z.string().max(8000).optional().default(""),
});

const InputSchema = z.discriminatedUnion("mode", [FullInputSchema, RewriteInputSchema]);

async function callGateway(prompt: string, apiKey: string) {
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
    if (res.status === 402) return { texto: "", error: "Créditos de IA esgotados no workspace." };
    return { texto: "", error: `Falha ao gerar relatório (${res.status}).` };
  }
  const json = await res.json();
  const texto = json?.choices?.[0]?.message?.content ?? "";
  return { texto: texto.trim(), error: null as string | null };
}

export const gerarRelatorioAluno = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { texto: "", error: "Chave de API indisponível no servidor." };
    }

    if (data.mode === "rewrite") {
      const prompt = `Você é um(a) coordenador(a) pedagógico(a) do programa iSP Life Competencies.
Reescreva APENAS o trecho abaixo do relatório pedagógico do(a) aluno(a) "${data.alunoNome}", mantendo o mesmo tom acolhedor e profissional, em português, em prosa fluida (sem bullets, sem markdown, sem títulos). Mantenha aproximadamente o mesmo tamanho.

${data.contexto ? `Contexto do relatório completo (apenas para referência, NÃO reescreva):\n"""\n${data.contexto}\n"""\n` : ""}
Trecho a reescrever:
"""
${data.trecho}
"""

Responda APENAS com o texto reescrito, sem aspas, sem prefácios.`;
      return callGateway(prompt, apiKey);
    }

    const linhas = data.avaliacoes
      .map((a) => `- [${a.competencia} · ${a.habilidade}] nível: ${a.nivel}`)
      .join("\n");

    const obsBloco = data.observacaoProfessor.trim()
      ? `\nObservações do(a) professor(a) sobre o(a) aluno(a):\n"""\n${data.observacaoProfessor.trim()}\n"""\n`
      : "";

    const prompt = `Você é um(a) coordenador(a) pedagógico(a) do programa iSP Life Competencies.
Gere um relatório pedagógico em português, em prosa fluida e profissional, sobre o desenvolvimento do(a) aluno(a) "${data.alunoNome}" (${data.segmentoLabel}), a partir das avaliações abaixo (níveis: iniciando, desenvolvendo, dominando) e das observações do(a) professor(a).

Avaliações:
${linhas}
${obsBloco}
Estruture o relatório com:
1) Um parágrafo de abertura com visão geral.
2) Um parágrafo por competência avaliada (Cognitivo, Global, Digital, Autoliderança, Interpessoal — apenas as que têm avaliações), destacando pontos fortes e áreas de crescimento.
3) Um parágrafo incorporando as observações do(a) professor(a), quando houver, de forma integrada à narrativa.
4) Um parágrafo final com recomendações práticas e próximos passos.

Use tom acolhedor, evite jargão técnico desnecessário, não use bullets nem markdown — apenas parágrafos separados por linha em branco. Não invente avaliações que não foram informadas.`;

    return callGateway(prompt, apiKey);
  });

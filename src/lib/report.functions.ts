import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  alunoNome: z.string().min(1).max(120),
  segmentoLabel: z.string().min(1).max(80),
  avaliacoes: z
    .array(
      z.object({
        competencia: z.string().min(1).max(80),
        habilidade: z.string().min(1).max(120),
        nivel: z.enum(["iniciando", "desenvolvendo", "dominando"]),
        observacao: z.string().max(2000).optional(),
      }),
    )
    .min(1)
    .max(50),
});

export const gerarRelatorioAluno = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        texto: "",
        error: "Chave de API indisponível no servidor.",
      };
    }

    const linhas = data.avaliacoes
      .map((a) => {
        const base = `- [${a.competencia} · ${a.habilidade}] nível: ${a.nivel}`;
        const obs = a.observacao?.trim();
        return obs ? `${base}\n    observação do professor: ${obs}` : base;
      })
      .join("\n");

    const prompt = `Você é um(a) coordenador(a) pedagógico(a) do programa iSP Life Competencies.
Gere um relatório pedagógico em português, em prosa fluida e profissional, sobre o desenvolvimento do(a) aluno(a) "${data.alunoNome}" (${data.segmentoLabel}), a partir das avaliações abaixo (níveis: iniciando, desenvolvendo, dominando).

Avaliações:
${linhas}

Estruture o relatório com:
1) Um parágrafo de abertura com visão geral.
2) Um parágrafo por competência avaliada (Cognitivo, Global, Digital, Autoliderança, Interpessoal — apenas as que têm avaliações), destacando pontos fortes e áreas de crescimento e incorporando, quando houver, as observações do(a) professor(a).
3) Um parágrafo final com recomendações práticas e próximos passos para o(a) professor(a).

Use tom acolhedor, evite jargão técnico desnecessário, não use bullets nem markdown — apenas parágrafos. Não invente avaliações que não foram informadas.`;

    try {
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
      return { texto, error: null as string | null };
    } catch (e) {
      console.error("Erro ao chamar AI gateway:", e);
      return { texto: "", error: "Serviço de IA indisponível no momento." };
    }
  });

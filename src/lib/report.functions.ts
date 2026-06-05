import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const AvaliacaoSchema = z.object({
  competencia: z.string().min(1).max(80),
  habilidade: z.string().min(1).max(120),
  nivel: z.enum(["iniciando", "desenvolvendo", "dominando", "nao_aplica"]),
  justificativa: z.string().max(500).optional(),
});

const KnowledgeBaseSchema = z.object({
  titulo: z.string().min(1).max(200),
  conteudo: z.string().min(1).max(8000),
});

const EvidenciaSchema = z.object({
  id: z.string().max(100).optional().default(""),
  titulo: z.string().min(1).max(200),
  categoria: z.string().min(1).max(120),
  descricao: z.string().max(2000).optional().default(""),
  storagePath: z.string().max(500).optional().default(""),
  arquivo: z.string().max(300).optional().default(""),
});

const FullInputSchema = z.object({
  mode: z.literal("full"),
  alunoNome: z.string().min(1).max(120),
  professorNome: z.string().min(1).max(120),
  segmentoLabel: z.string().min(1).max(80),
  observacaoProfessor: z.string().max(4000).optional().default(""),
  avaliacoes: z.array(AvaliacaoSchema).min(1).max(50),
  basesConhecimento: z.array(KnowledgeBaseSchema).max(20).optional().default([]),
  evidencias: z.array(EvidenciaSchema).max(60).optional().default([]),
});

const RewriteInputSchema = z.object({
  mode: z.literal("rewrite"),
  alunoNome: z.string().min(1).max(120),
  trecho: z.string().min(1).max(4000),
  contexto: z.string().max(8000).optional().default(""),
});

const InputSchema = z.discriminatedUnion("mode", [FullInputSchema, RewriteInputSchema]);

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6MB por arquivo
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB no total enviado para o modelo

function extOf(p: string): string {
  const clean = p.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

function mimeFromExt(ext: string): { mime: string; kind: "image" | "pdf" | "text" | "other" } {
  switch (ext) {
    case "png": return { mime: "image/png", kind: "image" };
    case "jpg":
    case "jpeg": return { mime: "image/jpeg", kind: "image" };
    case "webp": return { mime: "image/webp", kind: "image" };
    case "gif": return { mime: "image/gif", kind: "image" };
    case "heic": return { mime: "image/heic", kind: "image" };
    case "pdf": return { mime: "application/pdf", kind: "pdf" };
    case "txt": return { mime: "text/plain", kind: "text" };
    case "md": return { mime: "text/markdown", kind: "text" };
    case "csv": return { mime: "text/csv", kind: "text" };
    case "json": return { mime: "application/json", kind: "text" };
    case "docx": return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "other" };
    case "doc": return { mime: "application/msword", kind: "other" };
    case "pptx": return { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "other" };
    case "xlsx": return { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "other" };
    case "mp4":
    case "mov":
    case "webm":
    case "avi": return { mime: `video/${ext}`, kind: "other" };
    case "mp3":
    case "wav":
    case "m4a": return { mime: `audio/${ext}`, kind: "other" };
    case "zip": return { mime: "application/zip", kind: "other" };
    default: return { mime: "application/octet-stream", kind: "other" };
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  // btoa is available in workers
  return btoa(bin);
}

type EvidParte =
  | { kind: "image" | "pdf"; dataUrl: string; mime: string }
  | { kind: "text"; texto: string };

type EvidProcessada = {
  titulo: string;
  categoria: string;
  descricao: string;
  arquivo: string;
  parte: EvidParte | null;
  motivoSkip: string | null;
};

async function processarEvidencia(e: z.infer<typeof EvidenciaSchema>, restanteBytes: { v: number }): Promise<EvidProcessada> {
  const base: EvidProcessada = {
    titulo: e.titulo,
    categoria: e.categoria,
    descricao: e.descricao,
    arquivo: e.arquivo || (e.storagePath ? e.storagePath.split("/").pop() ?? "" : ""),
    parte: null,
    motivoSkip: null,
  };

  if (!e.storagePath) {
    base.motivoSkip = "sem arquivo anexado — apenas descrição textual considerada";
    return base;
  }

  const ext = extOf(e.storagePath);
  const { mime, kind } = mimeFromExt(ext);

  if (kind === "other") {
    base.motivoSkip = `formato .${ext || "desconhecido"} ainda não suportado para leitura automática (utilize PDF, imagem ou texto, ou descreva o conteúdo no campo Descrição)`;
    return base;
  }

  try {
    const { data: blob, error } = await supabaseAdmin.storage
      .from("student-evidences")
      .download(e.storagePath);
    if (error || !blob) {
      base.motivoSkip = `não foi possível abrir o arquivo (${error?.message ?? "erro de leitura"})`;
      return base;
    }
    const ab = await blob.arrayBuffer();
    if (ab.byteLength > MAX_FILE_BYTES) {
      base.motivoSkip = `arquivo maior que ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB — leitura automática indisponível`;
      return base;
    }
    if (ab.byteLength > restanteBytes.v) {
      base.motivoSkip = "limite total de dados para análise atingido — evidência não enviada ao modelo";
      return base;
    }
    restanteBytes.v -= ab.byteLength;

    if (kind === "text") {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(ab).slice(0, 8000);
      if (!text.trim()) {
        base.motivoSkip = "arquivo de texto vazio ou ilegível";
        return base;
      }
      base.parte = { kind: "text", texto: text };
      return base;
    }

    const b64 = bytesToBase64(new Uint8Array(ab));
    base.parte = { kind, dataUrl: `data:${mime};base64,${b64}`, mime };
    return base;
  } catch (err: any) {
    base.motivoSkip = `falha ao processar arquivo (${err?.message ?? "erro desconhecido"})`;
    return base;
  }
}

async function callGatewayMultimodal(
  systemText: string,
  userParts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>,
  apiKey: string,
) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: userParts },
      ],
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
  return { texto: String(texto).trim(), error: null as string | null };
}

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
    if (res.status === 402) return { texto: "", error: "Créditos de IA esgotados no workspace." };
    return { texto: "", error: `Falha ao gerar relatório (${res.status}).` };
  }
  const json = await res.json();
  const texto = json?.choices?.[0]?.message?.content ?? "";
  return { texto: String(texto).trim(), error: null as string | null };
}

export const gerarRelatorioAluno = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { texto: "", error: "Chave de API indisponível no servidor.", analisadas: [], naoAnalisadas: [] };
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
      const r = await callGatewayText(prompt, apiKey);
      return { ...r, analisadas: [], naoAnalisadas: [] };
    }

    // 1) Processa evidências (download + classificação)
    const restante = { v: MAX_TOTAL_BYTES };
    const processadas: EvidProcessada[] = [];
    for (const e of data.evidencias) {
      processadas.push(await processarEvidencia(e, restante));
    }

    const analisadas = processadas
      .filter((p) => p.parte !== null)
      .map((p) => ({ titulo: p.titulo, categoria: p.categoria, arquivo: p.arquivo }));
    const naoAnalisadas = processadas
      .filter((p) => p.parte === null && p.motivoSkip)
      .map((p) => ({ titulo: p.titulo, arquivo: p.arquivo, motivo: p.motivoSkip as string }));

    // 2) Monta blocos de texto auxiliares
    const pontuadas = data.avaliacoes.filter((a) => a.nivel !== "nao_aplica");
    const naoAplicaveis = data.avaliacoes.filter((a) => a.nivel === "nao_aplica");

    const linhasPontuadas = pontuadas
      .map((a) => `- [${a.competencia} · ${a.habilidade}] nível: ${a.nivel}`)
      .join("\n");

    const linhasNA = naoAplicaveis
      .map(
        (a) =>
          `- [${a.competencia} · ${a.habilidade}] NÃO SE APLICA${
            a.justificativa ? ` — justificativa: ${a.justificativa}` : ""
          }`,
      )
      .join("\n");

    const obsBloco = data.observacaoProfessor.trim()
      ? `\nObservações do(a) professor(a) sobre o(a) aluno(a):\n"""\n${data.observacaoProfessor.trim()}\n"""\n`
      : "";

    const naBloco = linhasNA
      ? `\nHabilidades marcadas como NÃO SE APLICA (sem pontuação):\n${linhasNA}\n`
      : "";

    const basesBloco = data.basesConhecimento.length
      ? `\nBases de Conhecimento vinculadas ao ano escolar (referência pedagógica obrigatória — utilize os critérios, descritores e orientações abaixo para fundamentar análise e recomendações, sem reproduzir literalmente):\n${data.basesConhecimento
          .map((b, i) => `--- Base ${i + 1}: ${b.titulo} ---\n${b.conteudo}`)
          .join("\n\n")}\n`
      : "";

    const evidTextoBloco = processadas
      .map((p, i) => {
        if (p.parte && p.parte.kind === "text") {
          return `--- Evidência textual ${i + 1} [${p.categoria}] "${p.titulo}" ---\n${p.parte.texto}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n\n");

    const evidIndex = processadas
      .map((p, i) => {
        if (!p.parte) return `- Evidência ${i + 1}: "${p.titulo}" [${p.categoria}] — NÃO analisada (${p.motivoSkip})${p.descricao ? `; descrição registrada: ${p.descricao}` : ""}`;
        if (p.parte.kind === "image") return `- Evidência ${i + 1}: "${p.titulo}" [${p.categoria}] — IMAGEM anexada (analise visualmente)${p.descricao ? `; descrição: ${p.descricao}` : ""}`;
        if (p.parte.kind === "pdf") return `- Evidência ${i + 1}: "${p.titulo}" [${p.categoria}] — PDF anexado (leia o conteúdo)${p.descricao ? `; descrição: ${p.descricao}` : ""}`;
        return `- Evidência ${i + 1}: "${p.titulo}" [${p.categoria}] — texto incluído acima${p.descricao ? `; descrição: ${p.descricao}` : ""}`;
      })
      .join("\n");

    const promptTexto = `Você é um(a) coordenador(a) pedagógico(a) do programa iSP Life Competencies.
Gere um relatório pedagógico em português, em prosa fluida e profissional, sobre o desenvolvimento do(a) aluno(a) "${data.alunoNome}" (${data.segmentoLabel}).

HIERARQUIA OBRIGATÓRIA DAS FONTES (use TODAS as disponíveis, nesta ordem de prioridade):
1) Rubricas preenchidas pelo(a) professor(a) — FONTE PRINCIPAL e definitiva do nível de desenvolvimento (níveis pontuáveis: iniciando, desenvolvendo, dominando).
2) Evidências anexadas (imagens, PDFs e textos enviados nesta mesma mensagem) — leia/interprete o conteúdo real de cada uma e relacione achados específicos às competências e habilidades avaliadas, usando-as para justificar, exemplificar e enriquecer os comentários.
3) Observações do(a) professor(a) — contexto qualitativo adicional.
4) Bases de Conhecimento vinculadas ao ano escolar — referência pedagógica para critérios, descritores e recomendações.

REGRAS:
- Se houver evidências anexadas, é OBRIGATÓRIO citá-las de forma natural na narrativa (ex.: "no PDF do portfólio observa-se…", "a imagem da produção mostra…"), relacionando-as às habilidades correspondentes. Não ignore nenhuma evidência analisável.
- Nunca infira ou altere os níveis das rubricas a partir das evidências — a avaliação profissional do(a) professor(a) prevalece.
- Não cite nomes de arquivos nem URLs no texto final.
- Não invente avaliações que não foram informadas.
- NUNCA atribua nível pontuável a uma habilidade marcada como NÃO SE APLICA.
- Use tom acolhedor; sem bullets, sem markdown — apenas parágrafos separados por linha em branco.

Avaliações pontuadas (FONTE PRINCIPAL):
${linhasPontuadas || "(nenhuma habilidade pontuada)"}
${naBloco}${obsBloco}
${processadas.length ? `\nÍndice das evidências anexadas (use TODAS as marcadas como analisáveis):\n${evidIndex}\n` : ""}
${evidTextoBloco ? `\nConteúdo das evidências de texto:\n${evidTextoBloco}\n` : ""}
${basesBloco}
Estrutura do relatório:
1) Parágrafo de abertura com visão geral.
2) Um parágrafo por competência avaliada (Cognitivo, Global, Digital, Autoliderança, Interpessoal — apenas as que têm habilidades pontuadas), destacando pontos fortes e áreas de crescimento e ancorando observações nas evidências analisadas, sem listá-las.
3) Um parágrafo incorporando as observações do(a) professor(a), quando houver.
${linhasNA ? '4) Um parágrafo dedicado às "Habilidades não aplicáveis neste momento": liste as habilidades marcadas como NÃO SE APLICA citando a justificativa do(a) professor(a) quando houver, sem atribuir qualquer nível.\n5) Parágrafo final com recomendações práticas e próximos passos, alinhadas às Bases de Conhecimento.' : "4) Parágrafo final com recomendações práticas e próximos passos, alinhadas às Bases de Conhecimento."}

Responda APENAS com o texto do relatório, sem títulos extras, sem markdown.`;

    const userParts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
      { type: "text", text: promptTexto },
    ];
    for (const p of processadas) {
      if (p.parte && (p.parte.kind === "image" || p.parte.kind === "pdf")) {
        userParts.push({ type: "image_url", image_url: { url: p.parte.dataUrl } });
      }
    }

    const systemText = "Você é coordenador(a) pedagógico(a) experiente. Sempre considere TODAS as fontes fornecidas (rubricas, evidências anexadas, observações e bases de conhecimento) e responda em português, em prosa fluida.";

    const r = await callGatewayMultimodal(systemText, userParts, apiKey);
    return { ...r, analisadas, naoAnalisadas };
  });

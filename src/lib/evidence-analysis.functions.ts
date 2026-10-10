import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const AnalyzeInputSchema = z.object({
  evidenceId: z.string().uuid(),
  accessToken: z.string().min(20),
});

type AnalysisStatus = "pending" | "analyzing" | "analyzed" | "error" | "skipped";

type AnalysisResult = {
  status: AnalysisStatus;
  summary: string | null;
  payload: Record<string, unknown> | null;
  error: string | null;
};

const MAX_ANALYSIS_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_CHARS = 14000;
const MAX_ZIP_ENTRY_BYTES = 4 * 1024 * 1024;
const MAX_ZIP_TOTAL_BYTES = 14 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 16;

const SUPPORTED_TEXT_EXTS = new Set(["txt", "md", "csv", "json"]);
const SUPPORTED_DOC_EXTS = new Set(["docx", "pptx", "xlsx"]);
const SUPPORTED_MEDIA_EXTS = new Set(["jpg", "jpeg", "png", "webp", "mp4", "mov"]);

function extOf(path: string): string {
  const clean = path.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

function fileNameFromPath(path: string | null | undefined): string {
  if (!path) return "";
  return (path.split("/").pop() ?? path).split("?")[0];
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "zip":
      return "application/zip";
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(bin);
}

function normalizeText(text: string, max = MAX_TEXT_CHARS): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function xmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlToText(xml: string): string {
  return normalizeText(xmlEntities(xml.replace(/<[^>]+>/g, " ")));
}

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function safeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? "erro desconhecido");
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
    return { texto: "", error: `Falha ao analisar evidência (${res.status}).` };
  }
  const json = await res.json();
  const texto = json?.choices?.[0]?.message?.content ?? "";
  return { texto: String(texto).trim(), error: null as string | null };
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
    return { texto: "", error: `Falha ao analisar evidência (${res.status}).` };
  }
  const json = await res.json();
  const texto = json?.choices?.[0]?.message?.content ?? "";
  return { texto: String(texto).trim(), error: null as string | null };
}

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
};

function findEocd(bytes: Uint8Array): number {
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      return i;
    }
  }
  return -1;
}

function parseZipDirectory(bytes: Uint8Array): ZipEntry[] {
  const eocd = findEocd(bytes);
  if (eocd < 0) throw new Error("Pacote ZIP sem diretório central legível.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const total = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];

  for (let i = 0; i < total && offset < bytes.length; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLen);
    const name = decodeText(nameBytes);
    if (!name.endsWith("/")) {
      entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Descompressão ZIP indisponível neste runtime.");
  }
  const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  if (entry.uncompressedSize > MAX_ZIP_ENTRY_BYTES) {
    throw new Error(`entrada maior que ${Math.round(MAX_ZIP_ENTRY_BYTES / (1024 * 1024))} MB`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(entry.localOffset, true) !== 0x04034b50) {
    throw new Error("cabeçalho local inválido");
  }
  const nameLen = view.getUint16(entry.localOffset + 26, true);
  const extraLen = view.getUint16(entry.localOffset + 28, true);
  const start = entry.localOffset + 30 + nameLen + extraLen;
  const compressed = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return inflateRaw(compressed);
  throw new Error(`método de compressão ZIP não suportado (${entry.method})`);
}

async function readZipEntries(bytes: Uint8Array): Promise<Array<{ name: string; bytes: Uint8Array }>> {
  const entries = parseZipDirectory(bytes)
    .filter((e) => e.uncompressedSize <= MAX_ZIP_ENTRY_BYTES)
    .slice(0, MAX_ZIP_ENTRIES);
  const out: Array<{ name: string; bytes: Uint8Array }> = [];
  let total = 0;
  for (const entry of entries) {
    if (total + entry.uncompressedSize > MAX_ZIP_TOTAL_BYTES) break;
    try {
      const data = await readZipEntry(bytes, entry);
      total += data.byteLength;
      out.push({ name: entry.name, bytes: data });
    } catch (err) {
      out.push({
        name: entry.name,
        bytes: new TextEncoder().encode(`[Entrada ignorada: ${safeError(err)}]`),
      });
    }
  }
  return out;
}

async function extractDocxText(bytes: Uint8Array): Promise<string> {
  const entries = await readZipEntries(bytes);
  return entries
    .filter((e) => /^word\/(document|header|footer|footnotes|endnotes).*\.xml$/i.test(e.name))
    .map((e) => xmlToText(decodeText(e.bytes)))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_TEXT_CHARS);
}

async function extractPptxText(bytes: Uint8Array): Promise<string> {
  const entries = await readZipEntries(bytes);
  return entries
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((e, i) => `Slide ${i + 1}: ${xmlToText(decodeText(e.bytes))}`)
    .filter((s) => s.replace(/^Slide \d+:\s*/, "").trim())
    .join("\n\n")
    .slice(0, MAX_TEXT_CHARS);
}

function extractSharedStrings(xml: string): string[] {
  const items: string[] = [];
  const regex = /<si[\s\S]*?<\/si>/g;
  const matches = xml.match(regex) ?? [];
  for (const item of matches) items.push(xmlToText(item));
  return items;
}

function extractSheetValues(xml: string, shared: string[]): string[] {
  const values: string[] = [];
  const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  let match: RegExpExecArray | null;
  while ((match = cellRegex.exec(xml)) && values.length < 120) {
    const attrs = match[1];
    const body = match[2];
    const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? "";
    const raw = body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? body.match(/<is[^>]*>([\s\S]*?)<\/is>/)?.[1] ?? "";
    const clean = xmlToText(raw);
    if (!clean) continue;
    values.push(type === "s" ? shared[Number(clean)] ?? clean : clean);
  }
  return values;
}

async function extractXlsxText(bytes: Uint8Array): Promise<string> {
  const entries = await readZipEntries(bytes);
  const sharedXml = entries.find((e) => e.name === "xl/sharedStrings.xml");
  const shared = sharedXml ? extractSharedStrings(decodeText(sharedXml.bytes)) : [];
  const sheetTexts = entries
    .filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((e, i) => {
      const values = extractSheetValues(decodeText(e.bytes), shared);
      return values.length ? `Aba ${i + 1}: ${values.join(" | ")}` : "";
    })
    .filter(Boolean);
  return sheetTexts.join("\n\n").slice(0, MAX_TEXT_CHARS);
}

function decodePdfLiteral(text: string): string {
  return text
    .replace(/\\([nrtbf()\\])/g, (_, c) => {
      const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
      return map[c] ?? c;
    })
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function extractPdfText(bytes: Uint8Array): string {
  const raw = new TextDecoder("latin1", { fatal: false }).decode(bytes);
  const parts: string[] = [];
  const literalRegex = /\((?:\\.|[^\\)]){2,}\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = literalRegex.exec(raw)) && parts.join(" ").length < MAX_TEXT_CHARS) {
    parts.push(decodePdfLiteral(match[0].replace(/\)\s*Tj$/, "").slice(1)));
  }
  const arrayRegex = /\[((?:\s*\((?:\\.|[^\\)])*\)\s*)+)[^\]]*\]\s*TJ/g;
  while ((match = arrayRegex.exec(raw)) && parts.join(" ").length < MAX_TEXT_CHARS) {
    const inner = match[1];
    const strings = inner.match(/\((?:\\.|[^\\)])*\)/g) ?? [];
    parts.push(strings.map((s) => decodePdfLiteral(s.slice(1, -1))).join(""));
  }
  return normalizeText(parts.join(" "));
}

async function extractOoxmlText(ext: string, bytes: Uint8Array): Promise<string> {
  if (ext === "docx") return extractDocxText(bytes);
  if (ext === "pptx") return extractPptxText(bytes);
  if (ext === "xlsx") return extractXlsxText(bytes);
  return "";
}

async function extractZipPackageText(bytes: Uint8Array): Promise<{ text: string; included: string[]; skipped: string[] }> {
  const entries = await readZipEntries(bytes);
  const included: string[] = [];
  const skipped: string[] = [];
  const chunks: string[] = [];

  for (const entry of entries) {
    const ext = extOf(entry.name);
    try {
      if (SUPPORTED_TEXT_EXTS.has(ext)) {
        const text = normalizeText(decodeText(entry.bytes), 5000);
        if (text) {
          included.push(entry.name);
          chunks.push(`Arquivo ${entry.name}:\n${text}`);
        }
      } else if (SUPPORTED_DOC_EXTS.has(ext)) {
        const text = normalizeText(await extractOoxmlText(ext, entry.bytes), 5000);
        if (text) {
          included.push(entry.name);
          chunks.push(`Arquivo ${entry.name}:\n${text}`);
        }
      } else if (ext === "pdf") {
        const text = normalizeText(extractPdfText(entry.bytes), 5000);
        if (text) {
          included.push(entry.name);
          chunks.push(`Arquivo ${entry.name}:\n${text}`);
        } else {
          skipped.push(`${entry.name} (PDF sem texto extraível no pacote)`);
        }
      } else {
        skipped.push(`${entry.name} (formato listado, não analisado dentro do ZIP)`);
      }
    } catch (err) {
      skipped.push(`${entry.name} (${safeError(err)})`);
    }
    if (chunks.join("\n\n").length >= MAX_TEXT_CHARS) break;
  }

  return { text: chunks.join("\n\n").slice(0, MAX_TEXT_CHARS), included, skipped };
}

function evidencePrompt(input: {
  titulo: string;
  categoria: string;
  descricao: string;
  arquivo: string;
  extractedText: string;
}) {
  return `Voce esta preparando dados individuais de um aluno para o motor pedagogico do programa iSP Life Competencies.
Analise a evidencia abaixo como fonte primaria sobre a crianca.

Regras:
- Extraia apenas fatos observaveis no material ou na observacao registrada.
- Descreva producoes, comportamentos, escolhas, estrategias, interacoes, avancos, dificuldades, contexto de aprendizagem e sinais de potencialidade.
- Nao determine nem altere estagio de rubrica; essa interpretacao acontecera depois, com a Base de Conhecimento ativa e a rubrica correspondente.
- Se o material for insuficiente, diga isso claramente.
- Nao invente conteudo nao extraido ou nao observado.

Evidencia:
Titulo: ${input.titulo}
Categoria: ${input.categoria}
Arquivo: ${input.arquivo || "sem arquivo"}
Observacao do professor: ${input.descricao || "nao informada"}

Texto/estrutura extraida:
"""
${input.extractedText}
"""

Responda em portugues, em 1 a 3 paragrafos objetivos, como um resumo de achados observaveis que sera interpretado posteriormente pela Base de Conhecimento.`;
}

async function summarizeExtractedText(input: {
  titulo: string;
  categoria: string;
  descricao: string;
  arquivo: string;
  extractedText: string;
  apiKey: string;
}) {
  const r = await callGatewayText(evidencePrompt(input), input.apiKey);
  if (r.error) throw new Error(r.error);
  return r.texto || "Evidência analisada, mas sem resumo retornado pela IA.";
}

async function analyzeMedia(input: {
  titulo: string;
  categoria: string;
  descricao: string;
  arquivo: string;
  bytes: Uint8Array;
  mime: string;
  ext: string;
  apiKey: string;
}) {
  const prompt = `Analise esta evidencia individual do aluno como fonte primaria de dados observaveis para uso futuro em relatorio pedagogico.

Categoria: ${input.categoria}
Titulo: ${input.titulo}
Arquivo: ${input.arquivo}
Observacao do professor: ${input.descricao || "nao informada"}

Extraia apenas fatos visiveis/audiveis ou explicitamente documentados: producoes, comportamentos, interacoes, estrategias, avancos, dificuldades, contexto e potencialidades. Nao determine nem altere estagio de rubrica; a interpretacao final acontecera depois, com Base de Conhecimento e rubrica correspondente. Gere um resumo em portugues, com 1 a 3 paragrafos, sem inventar fatos.`;
  const dataUrl = `data:${input.mime};base64,${bytesToBase64(input.bytes)}`;
  const r = await callGatewayMultimodal(
    "Voce extrai achados observaveis de evidencias pedagogicas com precisao, sem inventar fatos.",
    [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: dataUrl } },
    ],
    input.apiKey,
  );
  if (r.error) throw new Error(r.error);
  return r.texto || "Evidência analisada, mas sem resumo retornado pela IA.";
}

async function buildAnalysis(evidence: any, bytes: Uint8Array | null, apiKey: string | null): Promise<AnalysisResult> {
  const arquivo = String(evidence.arquivo_nome || fileNameFromPath(evidence.arquivo_url) || "");
  const ext = extOf(arquivo || evidence.arquivo_url || "");
  const categoria = String(evidence.requirement?.nome ?? evidence.evidence_type ?? "Outro");
  const descricao = String(evidence.descricao ?? "").trim();
  const basePayload = {
    evidence_id: evidence.id,
    titulo: evidence.titulo,
    categoria,
    arquivo,
    extensao: ext || null,
    descricao,
  };

  if (!bytes) {
    if (!descricao) {
      return {
        status: "skipped",
        summary: null,
        payload: { ...basePayload, reason: "sem arquivo e sem observação" },
        error: "Evidência sem arquivo anexado e sem observação para análise.",
      };
    }
    return {
      status: "analyzed",
      summary: `Evidência cadastrada sem arquivo anexado. Observação registrada pelo professor: ${descricao}`,
      payload: { ...basePayload, source: "descricao" },
      error: null,
    };
  }

  if (bytes.byteLength > MAX_ANALYSIS_FILE_BYTES) {
    return {
      status: "skipped",
      summary: null,
      payload: { ...basePayload, size_bytes: bytes.byteLength, limit_bytes: MAX_ANALYSIS_FILE_BYTES },
      error: `Arquivo armazenado, mas maior que o limite técnico de análise automática (${Math.round(MAX_ANALYSIS_FILE_BYTES / (1024 * 1024))} MB).`,
    };
  }

  if (!apiKey) {
    return {
      status: "error",
      summary: null,
      payload: { ...basePayload, size_bytes: bytes.byteLength },
      error: "Chave de IA indisponível no servidor.",
    };
  }

  if (SUPPORTED_TEXT_EXTS.has(ext)) {
    const extractedText = normalizeText(decodeText(bytes));
    if (!extractedText) {
      return { status: "skipped", summary: null, payload: basePayload, error: "Arquivo textual vazio ou ilegível." };
    }
    const summary = await summarizeExtractedText({ titulo: evidence.titulo, categoria, descricao, arquivo, extractedText, apiKey });
    return {
      status: "analyzed",
      summary,
      payload: { ...basePayload, source: "text", extracted_excerpt: extractedText.slice(0, 6000), size_bytes: bytes.byteLength },
      error: null,
    };
  }

  if (SUPPORTED_DOC_EXTS.has(ext)) {
    const extractedText = normalizeText(await extractOoxmlText(ext, bytes));
    if (!extractedText) {
      return { status: "skipped", summary: null, payload: { ...basePayload, source: "ooxml" }, error: `Não foi possível extrair texto do arquivo .${ext}.` };
    }
    const summary = await summarizeExtractedText({ titulo: evidence.titulo, categoria, descricao, arquivo, extractedText, apiKey });
    return {
      status: "analyzed",
      summary,
      payload: { ...basePayload, source: "ooxml", extracted_excerpt: extractedText.slice(0, 6000), size_bytes: bytes.byteLength },
      error: null,
    };
  }

  if (ext === "pdf") {
    const extractedText = extractPdfText(bytes);
    if (extractedText.length > 250) {
      const summary = await summarizeExtractedText({ titulo: evidence.titulo, categoria, descricao, arquivo, extractedText, apiKey });
      return {
        status: "analyzed",
        summary,
        payload: { ...basePayload, source: "pdf_text", extracted_excerpt: extractedText.slice(0, 6000), size_bytes: bytes.byteLength },
        error: null,
      };
    }
    const summary = await analyzeMedia({ titulo: evidence.titulo, categoria, descricao, arquivo, bytes, mime: "application/pdf", ext, apiKey });
    return {
      status: "analyzed",
      summary,
      payload: { ...basePayload, source: "pdf_multimodal", extracted_excerpt: extractedText || null, size_bytes: bytes.byteLength },
      error: null,
    };
  }

  if (SUPPORTED_MEDIA_EXTS.has(ext)) {
    const mime = mimeFromExt(ext);
    const summary = await analyzeMedia({ titulo: evidence.titulo, categoria, descricao, arquivo, bytes, mime, ext, apiKey });
    return {
      status: "analyzed",
      summary,
      payload: { ...basePayload, source: ext === "mp4" || ext === "mov" ? "video_multimodal" : "image_multimodal", mime, size_bytes: bytes.byteLength },
      error: null,
    };
  }

  if (ext === "zip") {
    const zip = await extractZipPackageText(bytes);
    if (!zip.text.trim()) {
      return {
        status: "skipped",
        summary: null,
        payload: { ...basePayload, source: "zip", included: zip.included, skipped: zip.skipped, size_bytes: bytes.byteLength },
        error: "ZIP aberto, mas nenhum arquivo suportado pôde ser analisado dentro dos limites técnicos.",
      };
    }
    const summary = await summarizeExtractedText({
      titulo: evidence.titulo,
      categoria,
      descricao,
      arquivo,
      extractedText: zip.text,
      apiKey,
    });
    return {
      status: "analyzed",
      summary,
      payload: { ...basePayload, source: "zip", included: zip.included, skipped: zip.skipped, extracted_excerpt: zip.text.slice(0, 6000), size_bytes: bytes.byteLength },
      error: zip.skipped.length ? `Alguns itens do ZIP não foram analisados: ${zip.skipped.slice(0, 6).join("; ")}` : null,
    };
  }

  return {
    status: "skipped",
    summary: null,
    payload: { ...basePayload, size_bytes: bytes.byteLength },
    error: `Formato .${ext || "desconhecido"} armazenado, mas não suportado para análise automática.`,
  };
}

async function canAnalyze(evidence: any, requesterId: string) {
  if (evidence.created_by === requesterId) return true;
  const sb = supabaseAdmin as any;
  const { data } = await sb.from("user_roles").select("role").eq("user_id", requesterId);
  const roles = ((data ?? []) as any[]).map((r) => String(r.role));
  if (roles.some((role) => role === "admin" || role === "diretora")) return true;
  if (!roles.includes("coordenador")) return false;

  const { data: student } = await sb
    .from("students")
    .select("class:classes(segmento)")
    .eq("id", evidence.student_id)
    .maybeSingle();
  const classRel = Array.isArray(student?.class) ? student.class[0] : student?.class;
  const segmento = classRel?.segmento;
  if (!segmento) return false;
  const { data: ok } = await sb.rpc("is_coordinator_of_segment", {
    _user_id: requesterId,
    _segmento: segmento,
  });
  return !!ok;
}

export const analisarEvidenciaAluno = createServerFn({ method: "POST" })
  .inputValidator((data) => AnalyzeInputSchema.parse(data))
  .handler(async ({ data }) => {
    const sb = supabaseAdmin as any;
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(data.accessToken);
    const requesterId = authData.user?.id;
    if (authError || !requesterId) {
      return { status: "error" as AnalysisStatus, summary: "", error: "Sessão inválida para analisar evidência." };
    }

    const { data: evidence, error } = await sb
      .from("student_evidences")
      .select("*, requirement:evidence_requirements(nome, slug)")
      .eq("id", data.evidenceId)
      .maybeSingle();

    if (error) return { status: "error" as AnalysisStatus, summary: "", error: error.message };
    if (!evidence) return { status: "error" as AnalysisStatus, summary: "", error: "Evidência não encontrada." };
    if (!(await canAnalyze(evidence, requesterId))) {
      return { status: "error" as AnalysisStatus, summary: "", error: "Você não tem permissão para analisar esta evidência." };
    }

    await sb
      .from("student_evidences")
      .update({
        analysis_status: "analyzing",
        analysis_error: null,
        analysis_summary: null,
        analyzed_at: null,
      })
      .eq("id", data.evidenceId);

    const arquivoNome = String(evidence.arquivo_nome || fileNameFromPath(evidence.arquivo_url) || "");
    const ext = extOf(arquivoNome || evidence.arquivo_url || "");
    const apiKey = process.env.LOVABLE_API_KEY ?? null;

    try {
      let bytes: Uint8Array | null = null;
      let mime = evidence.arquivo_mime || (ext ? mimeFromExt(ext) : null);
      let size = evidence.arquivo_tamanho ?? null;

      if (evidence.arquivo_url) {
        const { data: blob, error: downErr } = await sb.storage
          .from("student-evidences")
          .download(evidence.arquivo_url);
        if (downErr || !blob) throw new Error(`Não foi possível abrir o arquivo (${downErr?.message ?? "erro de leitura"}).`);
        const ab = await blob.arrayBuffer();
        bytes = new Uint8Array(ab);
        size = bytes.byteLength;
        mime = blob.type || mime || mimeFromExt(ext);
      }

      const result = await buildAnalysis(evidence, bytes, apiKey);
      await sb
        .from("student_evidences")
        .update({
          arquivo_nome: arquivoNome || null,
          arquivo_mime: mime,
          arquivo_tamanho: size,
          analysis_status: result.status,
          analysis_summary: result.summary,
          analysis_payload: result.payload,
          analysis_error: result.error,
          analyzed_at: result.status === "analyzed" ? new Date().toISOString() : null,
        })
        .eq("id", data.evidenceId);

      return {
        status: result.status,
        summary: result.summary ?? "",
        error: result.error,
      };
    } catch (err) {
      const message = safeError(err);
      await sb
        .from("student_evidences")
        .update({
          analysis_status: "error",
          analysis_error: message,
          analyzed_at: null,
        })
        .eq("id", data.evidenceId);
      return { status: "error" as AnalysisStatus, summary: "", error: message };
    }
  });

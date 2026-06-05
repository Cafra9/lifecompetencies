import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { jsPDF } from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Sparkles, Download, Check, Loader2, RotateCcw, Pencil, Eye, MinusCircle } from "lucide-react";
import {
  RUBRICA_INFANTIL,
  NIVEL_LABEL,
  NIVEL_OU_NA_LABEL,
  type Nivel,
  type NivelOuNA,
} from "@/lib/rubrica-infantil";
import { useStudentAssessment, type AssessmentMap, type JustificativaMap } from "@/lib/assessments-store";
import { gerarRelatorioAluno } from "@/lib/report.functions";
import { useAuth } from "@/hooks/useAuth";
import ispLogo from "@/assets/isp-logo.png";
import { corDaCompetencia } from "@/lib/competencia-cores";
import { supabase } from "@/integrations/supabase/client";

const NIVEIS: Nivel[] = ["iniciando", "desenvolvendo", "dominando"];

const NIVEL_CELL: Record<Nivel, string> = {
  iniciando: "bg-green-200 text-green-900",
  desenvolvendo: "bg-green-500 text-white",
  dominando: "bg-green-700 text-white",
};

const NA_CELL = "bg-muted text-muted-foreground border-dashed";

function key(comp: string, hab: string) {
  return `${comp}::${hab}`;
}

export function AvaliarDialog({
  open,
  onOpenChange,
  alunoId,
  alunoNome,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  alunoId: string;
  alunoNome: string;
}) {
  const { data, justificativas, observacao, fechado, save } = useStudentAssessment(alunoId);
  const [local, setLocal] = useState<AssessmentMap>(data);
  const [localJust, setLocalJust] = useState<JustificativaMap>(justificativas);
  const [localObs, setLocalObs] = useState<string>(observacao);
  const [openKey, setOpenKey] = useState<string>("");
  const hydratedRef = useRef(false);

  // Flat sequential list of all habilidades (for "expand next" behavior).
  const flat = useMemo(
    () =>
      RUBRICA_INFANTIL.flatMap((c) =>
        c.habilidades.map((h) => ({
          comp: c.competencia,
          compSlug: c.slug,
          hab: h.habilidade,
          k: key(c.competencia, h.habilidade),
        })),
      ),
    [],
  );

  useEffect(() => {
    if (open) {
      setLocal(data);
      setLocalJust(justificativas);
      setLocalObs(observacao);
      // Abre automaticamente a primeira habilidade ainda sem resposta
      // para que o professor já possa começar.
      const firstUnanswered = flat.find((it) => !(it.k in data));
      setOpenKey(firstUnanswered?.k ?? "");
      hydratedRef.current = false;
      requestAnimationFrame(() => {
        hydratedRef.current = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-save contínuo: nada se perde se o professor fechar a aba
  // ou sair do site no meio do preenchimento.
  useEffect(() => {
    if (!open || fechado || !hydratedRef.current) return;
    save(local, localJust, localObs);
  }, [local, localJust, localObs, open, fechado, save]);

  const total = RUBRICA_INFANTIL.reduce((acc, c) => acc + c.habilidades.length, 0);
  const preenchidos = Object.values(local).filter((v) => v !== "nao_aplica").length;
  const naAplica = Object.values(local).filter((v) => v === "nao_aplica").length;
  const allAnswered = preenchidos + naAplica >= total;

  function advanceFrom(currentKey: string) {
    const idx = flat.findIndex((x) => x.k === currentKey);
    // Próxima habilidade ainda sem resposta a partir do índice atual;
    // se não houver, vai para a próxima da lista; se for a última, fecha.
    for (let i = idx + 1; i < flat.length; i++) {
      if (!(flat[i].k in local)) {
        setOpenKey(flat[i].k);
        return;
      }
    }
    if (idx + 1 < flat.length) {
      setOpenKey(flat[idx + 1].k);
    } else {
      setOpenKey("");
      toast.success("Última habilidade respondida — revise e salve a avaliação.");
    }
  }

  function setNivel(comp: string, hab: string, nivel: NivelOuNA) {
    if (fechado) return;
    const k = key(comp, hab);
    setLocal((prev) => ({ ...prev, [k]: nivel }));
    // "Não se aplica" não exige justificativa — limpa qualquer texto residual.
    if (nivel === "nao_aplica") {
      setLocalJust((prev) => {
        if (!(k in prev)) return prev;
        const { [k]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setLocalJust((prev) => {
        if (!(k in prev)) return prev;
        const { [k]: _, ...rest } = prev;
        return rest;
      });
    }
    // Avança automaticamente para a próxima habilidade.
    advanceFrom(k);
  }

  function handleSave() {
    save(local, localJust, localObs);
    toast.success(`Avaliação salva (${preenchidos} avaliada(s) · ${naAplica} N/A)`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90dvh] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Avaliar {alunoNome}
            {fechado && (
              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                Avaliação fechada
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {fechado
              ? "Esta avaliação foi finalizada. Reabra no card do aluno para editar."
              : "Rubrica Educação Infantil (4-7 anos) · Suas alterações são salvas automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 text-sm flex-wrap">
          <Badge variant="secondary">{preenchidos}/{total} avaliadas</Badge>
          {naAplica > 0 && (
            <Badge variant="outline" className="border-dashed">{naAplica} N/A</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Cobertura: {preenchidos + naAplica}/{total}
          </span>
          {!fechado && (preenchidos > 0 || naAplica > 0 || localObs.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={() => {
                setLocal({});
                setLocalJust({});
                setLocalObs("");
              }}
            >
              <RotateCcw className="h-3 w-3" /> Limpar tudo
            </Button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-3 -mr-3">
          <div className="space-y-5">
            {RUBRICA_INFANTIL.map((c) => {
              const cor = corDaCompetencia(c.competencia);
              return (
              <div key={c.slug}>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className={`h-3 w-3 rounded ${cor.swatch}`} />
                  <span className={cor.text}>{c.competencia}</span>
                </div>
                <Accordion
                  type="single"
                  collapsible
                  className="space-y-2"
                  value={openKey}
                  onValueChange={(v) => setOpenKey(v)}
                >
                  {c.habilidades.map((h, idx) => {
                    const k = key(c.competencia, h.habilidade);
                    const cur = local[k];
                    const dotOpacity = ["opacity-100", "opacity-80", "opacity-60", "opacity-40", "opacity-25"][idx % 5];
                    return (
                      <AccordionItem
                        key={h.habilidade}
                        value={k}
                        className={`rounded-md border bg-card data-[state=open]:shadow-sm ${cur ? "" : ""}`}
                      >
                        <div className="flex items-center gap-2 pl-3 pr-2 py-1">
                          <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${cor.swatch} ${dotOpacity}`}
                              />
                              <span className="text-sm font-medium">{h.habilidade}</span>
                              {cur && (
                                <Badge
                                  variant="outline"
                                  className={`ml-1 text-[10px] uppercase border-transparent ${
                                    cur === "nao_aplica" ? NA_CELL : NIVEL_CELL[cur as Nivel]
                                  }`}
                                >
                                  {NIVEL_OU_NA_LABEL[cur]}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                        </div>

                        <AccordionContent className="px-3 pb-3 space-y-3">
                          {/* Barra compacta com todas as opções no topo — sempre acima da dobra */}
                          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 -mx-3 px-3 pt-1 pb-2 border-b">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {NIVEIS.map((n) => {
                                const selected = cur === n;
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setNivel(c.competencia, h.habilidade, n)}
                                    className={`rounded-md border px-2 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:brightness-95 ${
                                      selected
                                        ? `${NIVEL_CELL[n]} border-transparent ring-2 ring-offset-1 ring-foreground/20`
                                        : "bg-card border-border"
                                    }`}
                                  >
                                    <span className="inline-flex items-center justify-center gap-1">
                                      {NIVEL_LABEL[n]}
                                      {selected && <Check className="h-3.5 w-3.5" />}
                                    </span>
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => setNivel(c.competencia, h.habilidade, "nao_aplica")}
                                className={`rounded-md border border-dashed px-2 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-muted/60 ${
                                  cur === "nao_aplica"
                                    ? "bg-muted ring-2 ring-offset-1 ring-foreground/20"
                                    : "bg-card text-muted-foreground"
                                }`}
                              >
                                <span className="inline-flex items-center justify-center gap-1">
                                  <MinusCircle className="h-3.5 w-3.5" />
                                  Não se aplica
                                  {cur === "nao_aplica" && <Check className="h-3.5 w-3.5" />}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Descritores de referência (clicáveis) */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {NIVEIS.map((n) => {
                              const selected = cur === n;
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setNivel(c.competencia, h.habilidade, n)}
                                  className={`text-left rounded-md border p-3 transition-colors hover:brightness-95 ${
                                    selected
                                      ? `${NIVEL_CELL[n]} border-transparent ring-2 ring-offset-1 ring-foreground/20`
                                      : "bg-card border-border"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-wide">
                                      {NIVEL_LABEL[n]}
                                    </span>
                                    {selected && <Check className="h-3.5 w-3.5" />}
                                  </div>
                                  <p className={`text-xs leading-relaxed ${selected ? "opacity-95" : "text-foreground/80"}`}>
                                    {h.descritores[n]}
                                  </p>
                                  {h.exemplos[n]?.length > 0 && (
                                    <ul className={`mt-2 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed ${selected ? "opacity-90" : "text-foreground/70"}`}>
                                      {h.exemplos[n].slice(0, 3).map((ex) => (
                                        <li key={ex}>{ex}</li>
                                      ))}
                                    </ul>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
              );
            })}

            <div className="pt-2">
              <label className="text-sm font-semibold text-foreground">
                Observações do professor sobre o aluno
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Este texto será incorporado ao relatório gerado por IA.
              </p>
              <Textarea
                value={localObs}
                onChange={(e) => setLocalObs(e.target.value)}
                placeholder="Registre observações gerais sobre o desenvolvimento, comportamento, evidências em sala e recomendações para este aluno."
                className="min-h-[140px] text-sm"
                maxLength={4000}
                readOnly={fechado}
              />
              <div className="text-[11px] text-muted-foreground mt-1 text-right">
                {localObs.length}/4000
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {fechado ? "Fechar" : "Cancelar"}
          </Button>
          {!fechado && (
            <Button
              onClick={handleSave}
              className={
                allAnswered
                  ? "ring-2 ring-offset-2 ring-primary animate-pulse"
                  : ""
              }
            >
              {allAnswered ? "Finalizar avaliação" : "Salvar avaliação"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Relatório ----------------

const ISP_NAVY: [number, number, number] = [30, 58, 95];

function downloadPDF({
  texto,
  alunoNome,
  professorNome,
  segmentoLabel,
  fontes,
}: {
  texto: string;
  alunoNome: string;
  professorNome: string;
  segmentoLabel: string;
  fontes?: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const marginTop = 56;
  const marginBottom = 60;

  // Cabeçalho — logo Aubrick | iSP centralizado preservando proporção
  const logoH = 42;
  try {
    const props = (doc as any).getImageProperties(ispLogo);
    const ratio = props.width / props.height;
    const logoW = logoH * ratio;
    const logoX = (pageW - logoW) / 2;
    doc.addImage(ispLogo, "PNG", logoX, marginTop - 10, logoW, logoH);
  } catch {
    // ignore se falhar
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ISP_NAVY);
  doc.text("Relatório de Desenvolvimento de Competências para a Vida", pageW / 2, marginTop + 48, { align: "center" });

  // Linha
  doc.setDrawColor(...ISP_NAVY);
  doc.setLineWidth(1);
  doc.line(marginX, marginTop + 60, pageW - marginX, marginTop + 60);

  // Bloco de identificação
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const idY = marginTop + 82;
  doc.setFont("helvetica", "bold");
  doc.text("Aluno:", marginX, idY);
  doc.setFont("helvetica", "normal");
  doc.text(alunoNome, marginX + 42, idY);

  doc.setFont("helvetica", "bold");
  doc.text("Professor(a):", marginX, idY + 16);
  doc.setFont("helvetica", "normal");
  doc.text(professorNome, marginX + 72, idY + 16);

  doc.setFont("helvetica", "bold");
  doc.text("Segmento:", marginX, idY + 32);
  doc.setFont("helvetica", "normal");
  doc.text(segmentoLabel, marginX + 64, idY + 32);

  doc.setFont("helvetica", "bold");
  doc.text("Emitido em:", marginX, idY + 48);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("pt-BR"), marginX + 70, idY + 48);

  // Corpo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const bodyStartY = idY + 78;
  const maxWidth = pageW - marginX * 2;
  const lineHeight = 15;

  const paragraphs = texto.split(/\n\s*\n/).map((p) => p.replace(/\s+\n/g, "\n").trim()).filter(Boolean);
  let y = bodyStartY;
  for (const p of paragraphs) {
    const lines = doc.splitTextToSize(p, maxWidth) as string[];
    for (const line of lines) {
      if (y > pageH - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    }
    y += lineHeight * 0.5;
  }

  if (fontes && fontes.trim()) {
    y += lineHeight;
    if (y > pageH - marginBottom - lineHeight * 3) {
      doc.addPage();
      y = marginTop;
    }
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginX, y - lineHeight * 0.6, pageW - marginX, y - lineHeight * 0.6);
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const fLines = doc.splitTextToSize(fontes, maxWidth) as string[];
    for (const line of fLines) {
      if (y > pageH - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginX, y);
      y += lineHeight * 0.85;
    }
  }

  // Rodapé numeração
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `iSP Life Competencies · Relatório de ${alunoNome}`,
      marginX,
      pageH - 28,
    );
    doc.text(`${i}/${pageCount}`, pageW - marginX, pageH - 28, { align: "right" });
  }

  doc.save(`relatorio-${alunoNome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

export function RelatorioDialog({
  open,
  onOpenChange,
  alunoId,
  alunoNome,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  alunoId: string;
  alunoNome: string;
}) {
  const { data, justificativas, observacao } = useStudentAssessment(alunoId);
  const { user } = useAuth();
  const professorNome =
    (user?.user_metadata as any)?.full_name || user?.email || "Professor(a)";
  const segmentoLabel = "Educação Infantil (4-7 anos)";

  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [analisadas, setAnalisadas] = useState<{ titulo: string; categoria: string; arquivo: string }[]>([]);
  const [naoAnalisadas, setNaoAnalisadas] = useState<{ titulo: string; arquivo: string; motivo: string }[]>([]);
  const [temObservacao, setTemObservacao] = useState(false);
  const [temBases, setTemBases] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gerar = useServerFn(gerarRelatorioAluno);

  const avaliacoes = Object.entries(data).map(([k, nivel]) => {
    const [competencia, habilidade] = k.split("::");
    const justificativa = nivel === "nao_aplica" ? justificativas[k] : undefined;
    return { competencia, habilidade, nivel, justificativa };
  });

  async function fetchBasesConhecimento(): Promise<{ titulo: string; conteudo: string }[]> {
    try {
      const sb = supabase as any;
      const { data: stu } = await sb.from("students").select("class_id").eq("id", alunoId).maybeSingle();
      const classId = stu?.class_id;
      if (!classId) return [];
      const { data: cls } = await sb.from("classes").select("school_year_id").eq("id", classId).maybeSingle();
      const yearId = cls?.school_year_id;
      if (!yearId) return [];
      const { data: links } = await sb
        .from("knowledge_base_years").select("knowledge_base_id").eq("school_year_id", yearId);
      const ids = (links ?? []).map((l: any) => l.knowledge_base_id);
      if (ids.length === 0) return [];
      const { data: bases } = await sb
        .from("knowledge_bases").select("titulo, conteudo, ativo").in("id", ids).eq("ativo", true);
      return (bases ?? []).slice(0, 20).map((b: any) => ({
        titulo: String(b.titulo),
        conteudo: String(b.conteudo).slice(0, 8000),
      }));
    } catch (e) {
      console.error("Falha ao buscar bases de conhecimento", e);
      return [];
    }
  }

  async function fetchEvidencias(): Promise<
    { titulo: string; categoria: string; descricao: string; arquivo: string; storagePath: string }[]
  > {
    try {
      const sb = supabase as any;
      const { data: evs } = await sb
        .from("student_evidences")
        .select("titulo, descricao, arquivo_url, requirement:evidence_requirements(nome)")
        .eq("student_id", alunoId)
        .order("created_at", { ascending: false })
        .limit(60);
      return ((evs ?? []) as any[]).map((e) => {
        const url: string = e.arquivo_url ?? "";
        const arquivo = url ? (url.split("/").pop() ?? "").split("?")[0] : "";
        return {
          titulo: String(e.titulo ?? "Evidência"),
          categoria: String(e.requirement?.nome ?? "Outra"),
          descricao: String(e.descricao ?? "").slice(0, 2000),
          arquivo,
          storagePath: url,
        };
      });
    } catch (e) {
      console.error("Falha ao buscar evidências do aluno", e);
      return [];
    }
  }

  async function handleGerarCompleto() {
    if (avaliacoes.length === 0) {
      toast.error("Nenhuma avaliação registrada para este aluno.");
      return;
    }
    setLoading(true);
    try {
      const [basesConhecimento, evidencias] = await Promise.all([
        fetchBasesConhecimento(),
        fetchEvidencias(),
      ]);
      const res = await gerar({
        data: {
          mode: "full",
          alunoNome,
          professorNome,
          segmentoLabel,
          observacaoProfessor: observacao,
          avaliacoes,
          basesConhecimento,
          evidencias: evidencias.map((e) => ({
            titulo: e.titulo,
            categoria: e.categoria,
            descricao: e.descricao,
            arquivo: e.arquivo,
            storagePath: e.storagePath,
          })),
        },
      });
      setTemObservacao(!!observacao.trim());
      setTemBases(basesConhecimento.length > 0);
      setAnalisadas((res as any).analisadas ?? []);
      setNaoAnalisadas((res as any).naoAnalisadas ?? []);
      if (res.error) toast.error(res.error);
      else setTexto(res.texto);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegerarSelecao() {
    const sel = selection;
    if (!sel || sel.start === sel.end) {
      // sem seleção: regera tudo
      await handleGerarCompleto();
      return;
    }
    const trecho = texto.slice(sel.start, sel.end).trim();
    if (!trecho) {
      await handleGerarCompleto();
      return;
    }
    setLoading(true);
    try {
      const res = await gerar({
        data: {
          mode: "rewrite",
          alunoNome,
          trecho,
          contexto: texto,
        },
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const novo = texto.slice(0, sel.start) + res.texto + texto.slice(sel.end);
      setTexto(novo);
      // ajustar seleção para cobrir o novo trecho
      const newEnd = sel.start + res.texto.length;
      setSelection({ start: sel.start, end: newEnd });
      requestAnimationFrame(() => {
        if (taRef.current) {
          taRef.current.focus();
          taRef.current.setSelectionRange(sel.start, newEnd);
        }
      });
      toast.success("Trecho regenerado.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao regenerar trecho.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!texto.trim()) {
      toast.error("Gere o relatório antes de baixar.");
      return;
    }
    downloadPDF({ texto, alunoNome, professorNome, segmentoLabel });
  }

  // Gera automaticamente ao abrir
  useEffect(() => {
    if (open) {
      setTexto("");
      setSelection(null);
      setEditing(false);
      handleGerarCompleto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alunoId]);

  function captureSelection() {
    const el = taRef.current;
    if (!el) return;
    setSelection({ start: el.selectionStart, end: el.selectionEnd });
  }

  const trechoLen = selection ? selection.end - selection.start : 0;

  const fontesTexto = useMemo(() => {
    const fontes: string[] = ["rubricas avaliadas"];
    if (temObservacao) fontes.push("observações dos professores");
    if (temBases) fontes.push("Bases de Conhecimento do ano");
    let base = `Gerado por IA com base nas ${fontes.join(", ")}`;
    if (analisadas.length > 0) {
      base += ` e nas seguintes evidências analisadas: ${analisadas.map((a) => a.titulo).join(", ")}`;
    }
    base += ".";
    if (naoAnalisadas.length > 0) {
      base +=
        " Evidências não consideradas nesta análise: " +
        naoAnalisadas.map((n) => `${n.titulo}${n.arquivo ? ` (${n.arquivo})` : ""} — ${n.motivo}`).join("; ") +
        ".";
    }
    return base;
  }, [analisadas, naoAnalisadas, temObservacao, temBases]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Relatório · {alunoNome}
          </DialogTitle>
          <DialogDescription>
            {texto ? fontesTexto : "Gerado por IA com base nas rubricas avaliadas, observações dos professores, Bases de Conhecimento do ano e nas evidências anexadas ao aluno. Selecione um trecho e clique em Regerar para reescrever apenas a seleção."}
          </DialogDescription>
        </DialogHeader>

        {loading && !texto ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Gerando relatório...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {trechoLen > 0
                  ? `${trechoLen} caractere(s) selecionados — "Regerar" reescreverá apenas a seleção.`
                  : "Nenhuma seleção — \"Regerar\" reescreverá o relatório inteiro."}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing((v) => !v)}
                className="gap-1.5 h-7"
              >
                {editing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Visualizar" : "Editar texto"}
              </Button>
            </div>
            <Textarea
              ref={taRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onSelect={captureSelection}
              onKeyUp={captureSelection}
              onMouseUp={captureSelection}
              readOnly={!editing}
              className="flex-1 min-h-[320px] font-sans text-[13px] leading-relaxed"
              placeholder="O relatório aparecerá aqui."
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            />
            {texto && (
              <div className="rounded-md border bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground space-y-1">
                <p>{fontesTexto}</p>
                {naoAnalisadas.length > 0 && (
                  <p className="text-amber-700 dark:text-amber-300">
                    ⚠ {naoAnalisadas.length} evidência(s) não analisada(s) — veja motivos acima.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleGerarCompleto}
              disabled={loading}
              className="gap-2"
            >
              {loading && !trechoLen ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Gerar relatório
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegerarSelecao}
              disabled={loading || !texto || trechoLen === 0}
              className="gap-2"
              title={trechoLen === 0 ? "Selecione um trecho do texto para regerar" : undefined}
            >
              {loading && trechoLen > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Regerar seleção
            </Button>
          </div>
          <Button size="sm" onClick={handleDownload} disabled={!texto} className="gap-2">
            <Download className="h-4 w-4" /> Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

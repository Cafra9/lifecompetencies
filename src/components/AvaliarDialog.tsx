import { useEffect, useRef, useState } from "react";
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
import { Sparkles, Download, Check, Loader2, RotateCcw, Pencil, Eye } from "lucide-react";
import {
  RUBRICA_INFANTIL,
  NIVEL_LABEL,
  type Nivel,
} from "@/lib/rubrica-infantil";
import { useStudentAssessment, type AssessmentMap } from "@/lib/assessments-store";
import { gerarRelatorioAluno } from "@/lib/report.functions";
import { useAuth } from "@/hooks/useAuth";
import ispLogo from "@/assets/isp-logo.png";

const NIVEIS: Nivel[] = ["iniciando", "desenvolvendo", "dominando"];

const NIVEL_BTN: Record<Nivel, string> = {
  iniciando:
    "data-[selected=true]:bg-amber-500 data-[selected=true]:text-white data-[selected=true]:border-amber-500",
  desenvolvendo:
    "data-[selected=true]:bg-blue-500 data-[selected=true]:text-white data-[selected=true]:border-blue-500",
  dominando:
    "data-[selected=true]:bg-emerald-500 data-[selected=true]:text-white data-[selected=true]:border-emerald-500",
};

const NIVEL_HEADER: Record<Nivel, string> = {
  iniciando: "border-amber-200 bg-amber-50/60",
  desenvolvendo: "border-blue-200 bg-blue-50/60",
  dominando: "border-emerald-200 bg-emerald-50/60",
};

const NIVEL_DOT: Record<Nivel, string> = {
  iniciando: "bg-amber-500",
  desenvolvendo: "bg-blue-500",
  dominando: "bg-emerald-500",
};

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
  const { data, observacao, save } = useStudentAssessment(alunoId);
  const [local, setLocal] = useState<AssessmentMap>(data);
  const [localObs, setLocalObs] = useState<string>(observacao);
  const [openItems, setOpenItems] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setLocal(data);
      setLocalObs(observacao);
      setOpenItems({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = RUBRICA_INFANTIL.reduce((acc, c) => acc + c.habilidades.length, 0);
  const preenchidos = Object.keys(local).length;

  function setNivel(comp: string, hab: string, nivel: Nivel, slug: string) {
    setLocal((prev) => {
      const k = key(comp, hab);
      if (prev[k] === nivel) {
        const { [k]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [k]: nivel };
    });
    // recolhe a habilidade ao escolher um nível
    setOpenItems((prev) => ({
      ...prev,
      [slug]: (prev[slug] ?? []).filter((v) => v !== key(comp, hab)),
    }));
  }

  function handleSave() {
    save(local, localObs);
    toast.success(`Avaliação salva (${Object.keys(local).length}/${total} habilidades)`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90dvh] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Avaliar {alunoNome}</DialogTitle>
          <DialogDescription>
            Rubrica Educação Infantil (4-7 anos) · Expanda cada habilidade para ver a rubrica completa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 text-sm">
          <Badge variant="secondary">{preenchidos}/{total} habilidades</Badge>
          {(preenchidos > 0 || localObs.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={() => {
                setLocal({});
                setLocalObs("");
              }}
            >
              <RotateCcw className="h-3 w-3" /> Limpar tudo
            </Button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-3 -mr-3">
          <div className="space-y-5">
            {RUBRICA_INFANTIL.map((c) => (
              <div key={c.slug}>
                <div className="text-sm font-semibold text-foreground mb-2">{c.competencia}</div>
                <Accordion
                  type="multiple"
                  className="space-y-2"
                  value={openItems[c.slug] ?? []}
                  onValueChange={(v) => setOpenItems((prev) => ({ ...prev, [c.slug]: v }))}
                >
                  {c.habilidades.map((h) => {
                    const k = key(c.competencia, h.habilidade);
                    const cur = local[k];
                    return (
                      <AccordionItem
                        key={h.habilidade}
                        value={k}
                        className="rounded-md border bg-card data-[state=open]:shadow-sm"
                      >
                        <div className="flex items-center gap-2 pl-3 pr-2 py-1">
                          <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              <span
                                className={`h-2 w-2 rounded-full ${cur ? NIVEL_DOT[cur] : "bg-muted-foreground/30"}`}
                              />
                              <span className="text-sm font-medium">{h.habilidade}</span>
                              {cur && (
                                <Badge variant="outline" className="ml-1 text-[10px] uppercase">
                                  {NIVEL_LABEL[cur]}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                        </div>

                        <AccordionContent className="px-3 pb-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {NIVEIS.map((n) => {
                              const selected = cur === n;
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  data-selected={selected}
                                  onClick={() => setNivel(c.competencia, h.habilidade, n, c.slug)}
                                  className={`text-left rounded-md border p-3 transition-colors ${NIVEL_HEADER[n]} hover:brightness-95 ${NIVEL_BTN[n]} ${selected ? "ring-2 ring-offset-1 ring-foreground/20" : ""}`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-wide">
                                      {NIVEL_LABEL[n]}
                                    </span>
                                    {selected && <Check className="h-3.5 w-3.5" />}
                                  </div>
                                  <p className="text-xs leading-relaxed text-foreground/80">
                                    {h.descritores[n]}
                                  </p>
                                  {h.exemplos[n]?.length > 0 && (
                                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-foreground/70">
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
            ))}

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
              />
              <div className="text-[11px] text-muted-foreground mt-1 text-right">
                {localObs.length}/4000
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar avaliação</Button>
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
}: {
  texto: string;
  alunoNome: string;
  professorNome: string;
  segmentoLabel: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const marginTop = 56;
  const marginBottom = 60;

  // Cabeçalho
  try {
    doc.addImage(ispLogo, "PNG", marginX, marginTop - 8, 48, 48);
  } catch {
    // ignore se falhar
  }

  doc.setFont("helvetica", "bold"); // Arial-equivalente no jsPDF
  doc.setFontSize(16);
  doc.setTextColor(...ISP_NAVY);
  doc.text("Relatório Pedagógico", marginX + 60, marginTop + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("iSP Life Competencies", marginX + 60, marginTop + 24);

  // Linha
  doc.setDrawColor(...ISP_NAVY);
  doc.setLineWidth(1);
  doc.line(marginX, marginTop + 48, pageW - marginX, marginTop + 48);

  // Bloco de identificação
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const idY = marginTop + 70;
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
  const { data, observacao } = useStudentAssessment(alunoId);
  const { user } = useAuth();
  const professorNome =
    (user?.user_metadata as any)?.full_name || user?.email || "Professor(a)";
  const segmentoLabel = "Educação Infantil (4-7 anos)";

  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gerar = useServerFn(gerarRelatorioAluno);

  const avaliacoes = Object.entries(data).map(([k, nivel]) => {
    const [competencia, habilidade] = k.split("::");
    return { competencia, habilidade, nivel };
  });

  async function handleGerarCompleto() {
    if (avaliacoes.length === 0) {
      toast.error("Nenhuma avaliação registrada para este aluno.");
      return;
    }
    setLoading(true);
    try {
      const res = await gerar({
        data: {
          mode: "full",
          alunoNome,
          professorNome,
          segmentoLabel,
          observacaoProfessor: observacao,
          avaliacoes,
        },
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Relatório · {alunoNome}
          </DialogTitle>
          <DialogDescription>
            Gerado por IA com base nas avaliações e nas observações do(a) professor(a). Selecione um trecho e clique em <strong>Regerar</strong> para reescrever apenas a seleção.
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
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegerarSelecao}
            disabled={loading || !texto}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {trechoLen > 0 ? "Regerar seleção" : "Regerar"}
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={!texto} className="gap-2">
            <Download className="h-4 w-4" /> Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

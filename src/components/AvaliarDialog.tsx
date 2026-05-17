import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import { Sparkles, Copy, Download, Check, Loader2, RotateCcw } from "lucide-react";
import {
  RUBRICA_INFANTIL,
  NIVEL_LABEL,
  type Nivel,
} from "@/lib/rubrica-infantil";
import {
  useStudentAssessment,
  type AssessmentMap,
  type NotesMap,
} from "@/lib/assessments-store";
import { gerarRelatorioAluno } from "@/lib/report.functions";

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
  const { data, notes, save } = useStudentAssessment(alunoId);
  const [local, setLocal] = useState<AssessmentMap>(data);
  const [localNotes, setLocalNotes] = useState<NotesMap>(notes);

  useEffect(() => {
    if (open) {
      setLocal(data);
      setLocalNotes(notes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = RUBRICA_INFANTIL.reduce((acc, c) => acc + c.habilidades.length, 0);
  const preenchidos = Object.keys(local).length;

  function setNivel(comp: string, hab: string, nivel: Nivel) {
    setLocal((prev) => {
      const k = key(comp, hab);
      if (prev[k] === nivel) {
        const { [k]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [k]: nivel };
    });
  }

  function setNota(comp: string, hab: string, value: string) {
    setLocalNotes((prev) => {
      const k = key(comp, hab);
      if (!value.trim()) {
        const { [k]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [k]: value };
    });
  }

  function handleSave() {
    save(local, localNotes);
    toast.success(`Avaliação salva (${Object.keys(local).length}/${total} habilidades)`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90dvh] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Avaliar {alunoNome}</DialogTitle>
          <DialogDescription>
            Rubrica Educação Infantil (4-7 anos) · Expanda cada habilidade para ver a rubrica completa e registrar observações.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 text-sm">
          <Badge variant="secondary">{preenchidos}/{total} habilidades</Badge>
          {(preenchidos > 0 || Object.keys(localNotes).length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={() => {
                setLocal({});
                setLocalNotes({});
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
                <Accordion type="multiple" className="space-y-2">
                  {c.habilidades.map((h) => {
                    const k = key(c.competencia, h.habilidade);
                    const cur = local[k];
                    const nota = localNotes[k] ?? "";
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
                              {nota.trim() && (
                                <Badge variant="secondary" className="text-[10px]">
                                  obs
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
                                  onClick={() => setNivel(c.competencia, h.habilidade, n)}
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

                          <div className="mt-3">
                            <label className="text-xs font-medium text-muted-foreground">
                              Observação do professor (opcional)
                            </label>
                            <Textarea
                              value={nota}
                              onChange={(e) => setNota(c.competencia, h.habilidade, e.target.value)}
                              placeholder="Anote evidências, contexto ou recomendações específicas para esta habilidade."
                              className="mt-1 min-h-[60px] text-sm"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ))}
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
  const { data, notes } = useStudentAssessment(alunoId);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const gerar = useServerFn(gerarRelatorioAluno);

  async function handleGerar() {
    const avaliacoes = Object.entries(data).map(([k, nivel]) => {
      const [competencia, habilidade] = k.split("::");
      const observacao = notes[k]?.trim();
      return observacao
        ? { competencia, habilidade, nivel, observacao }
        : { competencia, habilidade, nivel };
    });

    if (avaliacoes.length === 0) {
      toast.error("Nenhuma avaliação registrada para este aluno.");
      return;
    }

    setLoading(true);
    setTexto("");
    try {
      const res = await gerar({
        data: {
          alunoNome,
          segmentoLabel: "Educação Infantil (4-7 anos)",
          avaliacoes,
        },
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        setTexto(res.texto);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${alunoNome.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Gera automaticamente ao abrir
  useEffect(() => {
    if (open) {
      setTexto("");
      handleGerar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alunoId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Relatório · {alunoNome}
          </DialogTitle>
          <DialogDescription>
            Gerado por IA com base nas avaliações e observações registradas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Gerando relatório...</span>
          </div>
        ) : (
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="flex-1 min-h-[300px] font-serif text-sm leading-relaxed"
            placeholder="O relatório aparecerá aqui."
          />
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleGerar} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" /> Regerar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!texto} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={!texto} className="gap-2">
              <Download className="h-4 w-4" /> Baixar .txt
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

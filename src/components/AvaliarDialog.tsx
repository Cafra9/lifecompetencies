import { useMemo, useState } from "react";
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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
} from "@/lib/assessments-store";
import { gerarRelatorioAluno } from "@/lib/report.functions";

const NIVEIS: Nivel[] = ["iniciando", "desenvolvendo", "dominando"];

const NIVEL_BTN: Record<Nivel, string> = {
  iniciando: "data-[selected=true]:bg-amber-500 data-[selected=true]:text-white data-[selected=true]:border-amber-500",
  desenvolvendo: "data-[selected=true]:bg-blue-500 data-[selected=true]:text-white data-[selected=true]:border-blue-500",
  dominando: "data-[selected=true]:bg-emerald-500 data-[selected=true]:text-white data-[selected=true]:border-emerald-500",
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
  const { data, save } = useStudentAssessment(alunoId);
  const [local, setLocal] = useState<AssessmentMap>(data);

  // Reset local state quando abre
  useMemo(() => {
    if (open) setLocal(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = RUBRICA_INFANTIL.reduce((acc, c) => acc + c.habilidades.length, 0);
  const preenchidos = Object.keys(local).length;

  function set(comp: string, hab: string, nivel: Nivel) {
    setLocal((prev) => {
      const k = key(comp, hab);
      // Toggle: clicar no mesmo nível remove
      if (prev[k] === nivel) {
        const { [k]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [k]: nivel };
    });
  }

  function handleSave() {
    save(local);
    toast.success(`Avaliação salva (${Object.keys(local).length}/${total} habilidades)`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90dvh] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Avaliar {alunoNome}</DialogTitle>
          <DialogDescription>
            Rubrica Educação Infantil (4-7 anos) · Toque no nível para cada habilidade. Toque de novo para limpar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 text-sm">
          <Badge variant="secondary">{preenchidos}/{total} habilidades</Badge>
          {preenchidos > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setLocal({})}>
              <RotateCcw className="h-3 w-3" /> Limpar tudo
            </Button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-3 -mr-3">
          <div className="space-y-5">
            {RUBRICA_INFANTIL.map((c) => (
              <div key={c.slug}>
                <div className="text-sm font-semibold text-foreground mb-2">{c.competencia}</div>
                <div className="space-y-2">
                  {c.habilidades.map((h) => {
                    const k = key(c.competencia, h.habilidade);
                    const cur = local[k];
                    return (
                      <div
                        key={h.habilidade}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2 rounded-md border p-2.5"
                      >
                        <div className="text-sm font-medium">{h.habilidade}</div>
                        <div className="flex gap-1">
                          {NIVEIS.map((n) => (
                            <HoverCard key={n} openDelay={120} closeDelay={80}>
                              <HoverCardTrigger asChild>
                                <button
                                  type="button"
                                  data-selected={cur === n}
                                  onClick={() => set(c.competencia, h.habilidade, n)}
                                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-muted ${NIVEL_BTN[n]}`}
                                >
                                  {NIVEL_LABEL[n]}
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent side="top" align="end" className="w-80 space-y-3 text-sm">
                                <div>
                                  <div className="text-xs font-semibold uppercase text-muted-foreground">{c.competencia} · {h.habilidade}</div>
                                  <div className="mt-1 font-semibold text-foreground">{NIVEL_LABEL[n]}</div>
                                </div>
                                <p className="leading-relaxed text-muted-foreground">{h.descritores[n]}</p>
                                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                                  {h.exemplos[n].map((exemplo) => (
                                    <li key={exemplo}>{exemplo}</li>
                                  ))}
                                </ul>
                              </HoverCardContent>
                            </HoverCard>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
  const { data } = useStudentAssessment(alunoId);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const gerar = useServerFn(gerarRelatorioAluno);

  async function handleGerar() {
    const avaliacoes = Object.entries(data).map(([k, nivel]) => {
      const [competencia, habilidade] = k.split("::");
      return { competencia, habilidade, nivel };
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
  useMemo(() => {
    if (open && !texto && !loading) handleGerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Relatório · {alunoNome}
          </DialogTitle>
          <DialogDescription>
            Gerado por IA com base nas avaliações registradas.
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

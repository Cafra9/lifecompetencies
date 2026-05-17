import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RUBRICA_INFANTIL, NIVEL_LABEL, type Nivel } from "@/lib/rubrica-infantil";
import { useStudentAssessment } from "@/lib/assessments-store";

// Heatmap em tons de vermelho — quanto mais quente, mais atenção a habilidade precisa.
const HEAT_CELL: Record<Nivel | "vazio", string> = {
  iniciando: "bg-red-600 text-white",
  desenvolvendo: "bg-red-400 text-white",
  dominando: "bg-red-200 text-red-900",
  vazio: "bg-muted text-muted-foreground",
};

const LEGEND: { nivel: Nivel | "vazio"; label: string }[] = [
  { nivel: "iniciando", label: NIVEL_LABEL.iniciando },
  { nivel: "desenvolvendo", label: NIVEL_LABEL.desenvolvendo },
  { nivel: "dominando", label: NIVEL_LABEL.dominando },
  { nivel: "vazio", label: "Não avaliado" },
];

export function HeatmapDialog({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Heatmap · {alunoNome}</DialogTitle>
          <DialogDescription>
            Visão de calor das habilidades — tons mais intensos indicam habilidades que ainda
            precisam de mais apoio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 text-xs">
          {LEGEND.map((l) => (
            <div key={l.nivel} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded ${HEAT_CELL[l.nivel]}`} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {RUBRICA_INFANTIL.map((c) => (
            <div key={c.slug}>
              <div className="text-sm font-semibold mb-2">{c.competencia}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {c.habilidades.map((h) => {
                  const nivel = data[`${c.competencia}::${h.habilidade}`] as Nivel | undefined;
                  const cls = HEAT_CELL[nivel ?? "vazio"];
                  return (
                    <div
                      key={h.habilidade}
                      className={`rounded-md p-3 text-xs leading-snug ${cls}`}
                      title={nivel ? NIVEL_LABEL[nivel] : "Não avaliado"}
                    >
                      <div className="font-medium">{h.habilidade}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide opacity-90">
                        {nivel ? NIVEL_LABEL[nivel] : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

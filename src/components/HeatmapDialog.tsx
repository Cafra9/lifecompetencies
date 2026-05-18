import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RUBRICA_INFANTIL, NIVEL_LABEL, type Nivel } from "@/lib/rubrica-infantil";
import { useStudentAssessment } from "@/lib/assessments-store";
import { COMPETENCIA_CORES, corDaCompetencia, VAZIO_CELL } from "@/lib/competencia-cores";

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
            Visão de calor por competência — cada cor segue o framework ISP; tons mais intensos
            indicam maior domínio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(COMPETENCIA_CORES).map(([nome, cor]) => (
            <div key={nome} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded ${cor.swatch}`} />
              <span>{nome}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${VAZIO_CELL}`} />
            <span>Não avaliado</span>
          </div>
        </div>

        <div className="space-y-5">
          {RUBRICA_INFANTIL.map((c) => {
            const cor = corDaCompetencia(c.competencia);
            return (
              <div key={c.slug}>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className={`h-3 w-3 rounded ${cor.swatch}`} />
                  <span className={cor.text}>{c.competencia}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {c.habilidades.map((h) => {
                    const nivel = data[`${c.competencia}::${h.habilidade}`] as Nivel | undefined;
                    const cls = nivel ? cor.cell[nivel] : VAZIO_CELL;
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
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

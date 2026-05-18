import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RUBRICA_INFANTIL, NIVEL_LABEL, type Nivel } from "@/lib/rubrica-infantil";
import { useAllAssessments } from "@/lib/assessments-store";

const HEAT_CELL: Record<Nivel | "vazio", string> = {
  iniciando: "bg-green-200 text-green-900",
  desenvolvendo: "bg-green-500 text-white",
  dominando: "bg-green-700 text-white",
  vazio: "bg-muted text-muted-foreground",
};

const LEGEND: { nivel: Nivel | "vazio"; label: string }[] = [
  { nivel: "iniciando", label: NIVEL_LABEL.iniciando },
  { nivel: "desenvolvendo", label: NIVEL_LABEL.desenvolvendo },
  { nivel: "dominando", label: NIVEL_LABEL.dominando },
  { nivel: "vazio", label: "Não avaliado" },
];

export function ClassHeatmapDialog({
  open,
  onOpenChange,
  alunos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  alunos: { id: string; nome: string }[];
}) {
  const all = useAllAssessments();

  const colunas = RUBRICA_INFANTIL.flatMap((c) =>
    c.habilidades.map((h) => ({
      competencia: c.competencia,
      habilidade: h.habilidade,
      key: `${c.competencia}::${h.habilidade}`,
    })),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Heatmap da turma</DialogTitle>
          <DialogDescription>
            Compilado das avaliações por aluno · cores mais intensas indicam maior domínio.
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

        <div className="overflow-auto border rounded-md">
          <table className="text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr>
                <th
                  className="sticky left-0 z-20 bg-background border-b border-r px-3 py-2 text-left font-semibold min-w-[160px]"
                  rowSpan={2}
                >
                  Aluno
                </th>
                {RUBRICA_INFANTIL.map((c) => (
                  <th
                    key={c.slug}
                    colSpan={c.habilidades.length}
                    className="border-b border-r px-2 py-1 text-center font-semibold bg-muted/50"
                  >
                    {c.competencia}
                  </th>
                ))}
              </tr>
              <tr>
                {colunas.map((col) => (
                  <th
                    key={col.key}
                    className="border-b border-r px-1 py-1 font-normal align-bottom bg-background"
                    style={{ minWidth: 32, maxWidth: 32 }}
                  >
                    <div
                      className="text-[10px] text-left leading-tight whitespace-nowrap"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        height: 110,
                      }}
                      title={col.habilidade}
                    >
                      {col.habilidade}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map((a) => {
                const av = all[a.id]?.avaliacoes ?? {};
                return (
                  <tr key={a.id}>
                    <td className="sticky left-0 z-10 bg-background border-b border-r px-3 py-1.5 font-medium whitespace-nowrap">
                      {a.nome}
                    </td>
                    {colunas.map((col) => {
                      const nivel = av[col.key] as Nivel | undefined;
                      const cls = HEAT_CELL[nivel ?? "vazio"];
                      return (
                        <td
                          key={col.key}
                          className={`border-b border-r text-center ${cls}`}
                          style={{ minWidth: 32, maxWidth: 32, height: 28 }}
                          title={`${a.nome} · ${col.habilidade}${nivel ? " · " + NIVEL_LABEL[nivel] : " · não avaliado"}`}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

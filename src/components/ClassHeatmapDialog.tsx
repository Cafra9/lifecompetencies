import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RUBRICA_INFANTIL, NIVEL_LABEL, type Nivel } from "@/lib/rubrica-infantil";
import { useAllAssessments } from "@/lib/assessments-store";
import { COMPETENCIA_CORES, corDaCompetencia, VAZIO_CELL } from "@/lib/competencia-cores";

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

  // achata todas as habilidades em ordem, mantendo agrupamento por competência
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
                {RUBRICA_INFANTIL.map((c) => {
                  const cor = corDaCompetencia(c.competencia);
                  return (
                    <th
                      key={c.slug}
                      colSpan={c.habilidades.length}
                      className={`border-b border-r px-2 py-1 text-center font-semibold ${cor.swatch} text-white`}
                    >
                      {c.competencia}
                    </th>
                  );
                })}
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
                      const cor = corDaCompetencia(col.competencia);
                      const cls = nivel ? cor.cell[nivel] : VAZIO_CELL;
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

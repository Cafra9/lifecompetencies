import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { competencyColor } from "@/lib/competencies";

export const Route = createFileRoute("/relatorios/")({
  component: () => (
    <AppLayout>
      <Relatorios />
    </AppLayout>
  ),
});

const competencias = [
  { slug: "interpessoal", nome: "Interpessoal" },
  { slug: "cognitiva", nome: "Cognitiva" },
  { slug: "global", nome: "Global" },
  { slug: "digital", nome: "Digital" },
  { slug: "autolideranca", nome: "Autoliderança" },
];

function Relatorios() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Relatórios</p>
        <h1 className="text-3xl font-bold mt-1">Visão consolidada</h1>
        <p className="text-muted-foreground">Acompanhe o desenvolvimento por competência, turma e período — com exportação em PDF.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {competencias.map((c) => {
          const col = competencyColor(c.slug);
          return (
            <Card key={c.slug}>
              <div className={`h-1 ${col.bg}`} />
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">{c.nome}</div>
                <div className="text-2xl font-bold">—</div>
                <div className="text-xs text-muted-foreground">Sem avaliações</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Gráficos por competência</CardTitle></CardHeader>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Os gráficos serão gerados a partir das avaliações registradas.
        </CardContent>
      </Card>
    </div>
  );
}

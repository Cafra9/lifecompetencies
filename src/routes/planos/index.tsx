import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANO_EXEMPLO, MODELO_PLANO } from "@/lib/iSP-content";
import { ClipboardList, Users, FileText } from "lucide-react";

export const Route = createFileRoute("/planos/")({
  component: () => (
    <AppLayout>
      <Planos />
    </AppLayout>
  ),
});

function Planos() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Planos de Aula</p>
        <h1 className="text-3xl font-bold mt-1">Repositório colaborativo</h1>
        <p className="text-muted-foreground">Planos alinhados ao framework ISP Big 5, com KSU explícito e Life Competencies integradas.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClipboardList className="h-4 w-4" /> Plano exemplo
          </div>
          <CardTitle>{PLANO_EXEMPLO.titulo}</CardTitle>
          <CardDescription>{PLANO_EXEMPLO.descricao}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="font-semibold mb-2">Objetivos de aprendizagem</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
              {PLANO_EXEMPLO.objetivos.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Momentos da aula</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {PLANO_EXEMPLO.momentos.map((m) => (
                <div key={m.titulo} className="rounded-lg border p-3">
                  <div className="font-medium text-sm">{m.titulo}</div>
                  <div className="text-sm text-muted-foreground mt-1">{m.texto}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Life Competencies trabalhadas</h3>
            <div className="space-y-2">
              {PLANO_EXEMPLO.lcs.map((l) => (
                <div key={l.comp} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge variant="secondary" className="w-fit">{l.comp}</Badge>
                  <span className="text-sm text-muted-foreground">{l.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

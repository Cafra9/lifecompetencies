import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/avaliacoes/")({
  component: () => (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Avaliações</p>
          <h1 className="text-3xl font-bold mt-1">Avaliar habilidades dos alunos</h1>
          <p className="text-muted-foreground">Registre evidências de desenvolvimento por habilidade, usando a escala da rubrica ISP.</p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Escala da rubrica</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-4">
            {[
              { n: 1, label: "Inicial", desc: "Começa a demonstrar" },
              { n: 2, label: "Em desenvolvimento", desc: "Demonstra com apoio" },
              { n: 3, label: "Proficiente", desc: "Demonstra com autonomia" },
              { n: 4, label: "Avançado", desc: "Aplica em novos contextos" },
            ].map((s) => (
              <div key={s.n} className="rounded-lg border p-3">
                <Badge variant="secondary">Nível {s.n}</Badge>
                <div className="font-medium mt-2">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Selecione uma turma e um aluno para iniciar uma avaliação — disponível após o login.
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  ),
});

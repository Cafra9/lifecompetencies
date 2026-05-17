import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESCALA_DESENVOLVIMENTO, INDICADORES_OBSERVAVEIS } from "@/lib/iSP-content";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/avaliacoes/")({
  component: () => (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Avaliações</p>
          <h1 className="text-3xl font-bold mt-1">Avaliar habilidades dos alunos</h1>
          <p className="text-muted-foreground">Registre evidências de desenvolvimento por habilidade, com base em observação qualitativa.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Escala de desenvolvimento</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-4">
            {ESCALA_DESENVOLVIMENTO.map((s) => (
              <div key={s.n} className="rounded-lg border p-3">
                <Badge variant="secondary">Nível {s.n}</Badge>
                <div className="font-medium mt-2">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /><CardTitle className="text-base">Indicadores observáveis</CardTitle></div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal pl-5 text-sm">
              {INDICADORES_OBSERVAVEIS.map((i) => <li key={i} className="text-muted-foreground"><span className="text-foreground">{i}</span></li>)}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Modelo de observação qualitativa</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground italic">
            "O estudante demonstra progresso consistente na habilidade avaliada, participando ativamente das atividades e aplicando estratégias com autonomia crescente."
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

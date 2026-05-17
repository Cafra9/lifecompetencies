import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { competencyColor } from "@/lib/competencies";
import { BIG5_STATEMENTS, ESTRATEGIAS_PEDAGOGICAS, LEARNING_FIRST_DESIGN, ESTRUTURA_TRILHA } from "@/lib/iSP-content";
import { Lightbulb, Workflow, ListChecks } from "lucide-react";

export const Route = createFileRoute("/formacao/")({
  component: () => (
    <AppLayout>
      <Formacao />
    </AppLayout>
  ),
});

const trilhas = [
  { slug: "interpessoal", nome: "Interpessoal", sub: "Socioemocional · Comunicação · Colaboração" },
  { slug: "cognitiva", nome: "Cognitiva", sub: "Pensamento Crítico · Criatividade · Curiosidade" },
  { slug: "global", nome: "Global", sub: "Cidadania · Ação · Compreensão Intercultural" },
  { slug: "digital", nome: "Digital", sub: "Letramento · Responsabilidade · Inovação" },
  { slug: "autolideranca", nome: "Autoliderança", sub: "Bem-estar · Aprender a Aprender · Confiança" },
];

function Formacao() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Formação Docente</p>
        <h1 className="text-3xl font-bold mt-1">Trilhas ISP Big 5</h1>
        <p className="text-muted-foreground">Explore cada competência, suas declarações-chave e estratégias de integração ao planejamento.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Trilhas por competência</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {trilhas.map((t) => {
            const col = competencyColor(t.slug);
            return (
              <Card key={t.slug} className="overflow-hidden">
                <div className={`h-2 ${col.bg}`} />
                <CardHeader>
                  <CardTitle>{t.nome}</CardTitle>
                  <CardDescription>{t.sub}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm italic text-muted-foreground">"{BIG5_STATEMENTS[t.slug]}"</CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Learning.First.Design</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Ciclo de planejamento orientado por evidências, do objetivo à adaptação.</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {LEARNING_FIRST_DESIGN.map((p) => (
            <Card key={p.passo}>
              <CardHeader>
                <Badge variant="secondary" className="w-fit">Passo {p.passo}</Badge>
                <CardTitle className="text-base mt-1">{p.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{p.descricao}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Estratégias pedagógicas</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {ESTRATEGIAS_PEDAGOGICAS.map((e) => (
            <Card key={e.titulo}>
              <CardHeader><CardTitle className="text-base">{e.titulo}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{e.descricao}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Estrutura de cada trilha formativa</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ol className="grid gap-2 sm:grid-cols-2 list-decimal pl-5 text-sm">
              {ESTRUTURA_TRILHA.map((m) => (
                <li key={m} className="text-muted-foreground"><span className="text-foreground">{m}</span></li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OBJETIVOS_SEMESTRE, BIG5_STATEMENTS, HOME_WELCOME, DESAFIOS_MENSAIS } from "@/lib/iSP-content";
import { competencyColor } from "@/lib/competencies";
import { Target, BookOpen, ClipboardCheck, GraduationCap, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => (
    <AppLayout>
      <Dashboard />
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

function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Aubrick · ISP Life Competencies</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">{HOME_WELCOME.titulo}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">{HOME_WELCOME.texto}</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Objetivos do 1º Semestre</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {OBJETIVOS_SEMESTRE.map((o) => (
            <Card key={o.n}>
              <CardHeader>
                <div className="text-3xl font-bold text-primary">{o.n}</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{o.texto}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">ISP Big 5 — Competências para a Vida</h2>
            <p className="text-sm text-muted-foreground">Cinco competências, quinze habilidades.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/formacao">Ver trilhas</Link></Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {competencias.map((c) => {
            const col = competencyColor(c.slug);
            return (
              <Card key={c.slug} className="overflow-hidden h-full">
                <div className={`h-1.5 ${col.bg}`} />
                <CardHeader>
                  <CardTitle className="text-base">{c.nome}</CardTitle>
                  <CardDescription className="text-xs italic">"{BIG5_STATEMENTS[c.slug]}"</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <QuickCard icon={GraduationCap} title="Formação" desc="Trilhas e estratégias pedagógicas" to="/formacao" />
        <QuickCard icon={BookOpen} title="Biblioteca" desc="Framework, rubricas e recursos" to="/biblioteca" />
        <QuickCard icon={ClipboardCheck} title="Planos de Aula" desc="Repositório colaborativo" to="/planos" />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /><CardTitle className="text-base">Desafios pedagógicos do semestre</CardTitle></div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DESAFIOS_MENSAIS.map((d) => (
              <div key={d.mes} className="rounded-lg border p-3">
                <div className="text-xs text-primary font-medium uppercase">{d.mes}</div>
                <div className="font-medium mt-1">{d.titulo}</div>
                <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, to }: { icon: any; title: string; desc: string; to: string }) {
  return (
    <Link to={to}>
      <Card className="h-full transition hover:shadow-md hover:border-primary/40">
        <CardContent className="pt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

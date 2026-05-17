import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FRAMEWORK_SKILLS, TIPOS_RECURSO, FILTROS_BIBLIOTECA } from "@/lib/iSP-content";
import { competencyColor } from "@/lib/competencies";
import { BookOpen, FileText, LayoutGrid, Filter } from "lucide-react";

export const Route = createFileRoute("/biblioteca/")({
  component: () => (
    <AppLayout>
      <Biblioteca />
    </AppLayout>
  ),
});

const ordem = ["interpessoal", "cognitiva", "global", "digital", "autolideranca"] as const;
const labels: Record<string, string> = {
  interpessoal: "Interpessoal",
  cognitiva: "Cognitiva",
  global: "Global",
  digital: "Digital",
  autolideranca: "Autoliderança",
};

function Biblioteca() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Biblioteca Pedagógica</p>
        <h1 className="text-3xl font-bold mt-1">Quadro Referencial ISP</h1>
        <p className="text-muted-foreground">Framework completo das Life Competencies, rubricas e templates de planejamento.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <RecursoCard icon={LayoutGrid} title="Framework ISP" desc="Cinco competências e habilidades detalhadas" />
        <RecursoCard icon={FileText} title="Rubricas por estágio" desc="Stage 1 (4–7) · Stage 2 (8–11) · Stage 3 (12–14) · Stage 4 (15–18)" />
        <RecursoCard icon={BookOpen} title="Templates KSU" desc="Conhecimento · Habilidade · Compreensão alinhados ao Big 5" />
      </div>

      <Card>
        <CardHeader><CardTitle>Framework das competências</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="interpessoal">
            <TabsList className="flex-wrap h-auto">
              {ordem.map((k) => <TabsTrigger key={k} value={k}>{labels[k]}</TabsTrigger>)}
            </TabsList>
            {ordem.map((k) => {
              const col = competencyColor(k);
              const subs = FRAMEWORK_SKILLS[k];
              return (
                <TabsContent key={k} value={k} className="mt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(subs).map(([sub, skills]) => (
                      <div key={sub} className={`${col.soft} rounded-lg p-4`}>
                        <h3 className="font-semibold mb-2">{sub}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s) => <Badge key={s} variant="secondary" className="font-normal text-xs">{s}</Badge>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Quadro Referencial — Objetivos da Aula</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-px bg-border rounded-md overflow-hidden text-sm">
            <div className="bg-muted/50 p-3 font-medium">Subject Outcomes (KSU)</div>
            <div className="bg-muted/50 p-3 font-medium">Life Competencies Outcomes</div>
            {["Knowledge", "Skill", "Understanding"].map((k, i) => (
              <div key={k} className="contents">
                <div className="bg-background p-3">• {k}</div>
                <div className="bg-background p-3">• LC {i + 1}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecursoCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </CardContent>
    </Card>
  );
}

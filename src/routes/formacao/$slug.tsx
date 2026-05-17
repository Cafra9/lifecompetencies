import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { competencyColor } from "@/lib/competencies";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/formacao/$slug")({
  component: () => <AppLayout><Trilha /></AppLayout>,
});

function Trilha() {
  const { slug } = Route.useParams();
  const col = competencyColor(slug);

  const { data: c } = useQuery({
    queryKey: ["comp", slug],
    queryFn: async () => (await supabase.from("competencies").select("*, skills(*)").eq("slug", slug).maybeSingle()).data,
  });

  if (!c) return <div>Carregando…</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/formacao"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
      <div className={`${col.soft} rounded-xl p-6`}>
        <h1 className="text-3xl font-bold">{c.nome}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">{c.descricao}</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Habilidades</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {c.skills?.sort((a: any, b: any) => a.ordem - b.ordem).map((s: any) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-base">{s.nome}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{s.descricao}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>Estratégias práticas</CardTitle></CardHeader>
        <CardContent className="prose prose-sm max-w-none text-sm text-muted-foreground space-y-2">
          <p>O administrador pode publicar módulos, estudos de caso, rubricas e recursos para esta trilha através do painel administrativo.</p>
          <p>Em breve: quizzes de autoavaliação e emissão de certificado interno.</p>
        </CardContent>
      </Card>
    </div>
  );
}

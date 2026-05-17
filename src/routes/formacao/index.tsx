import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { competencyColor } from "@/lib/competencies";

export const Route = createFileRoute("/formacao/")({ component: () => <AppLayout><Formacao /></AppLayout> });

function Formacao() {
  const { data } = useQuery({
    queryKey: ["competencies-with-skills"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competencies")
        .select("*, skills(*)")
        .order("ordem");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Formação Docente</h1>
        <p className="text-muted-foreground">Trilhas organizadas pelas cinco competências institucionais.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((c: any) => {
          const col = competencyColor(c.slug);
          return (
            <Link key={c.id} to="/formacao/$slug" params={{ slug: c.slug }}>
              <Card className="overflow-hidden h-full transition hover:shadow-md">
                <div className={`h-2 ${col.bg}`} />
                <CardHeader>
                  <CardTitle>{c.nome}</CardTitle>
                  <CardDescription>{c.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">{c.skills?.length || 0} habilidades</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

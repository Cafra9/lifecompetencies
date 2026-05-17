import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { competencyColor, LEVEL_VALUE } from "@/lib/competencies";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/relatorios/")({ component: () => <AppLayout><Relatorios /></AppLayout> });

function Relatorios() {
  const { user } = useAuth();
  const { data: comps } = useQuery({
    queryKey: ["competencies-with-skills"],
    queryFn: async () => (await supabase.from("competencies").select("*, skills(id)").order("ordem")).data ?? [],
  });
  const { data: avals } = useQuery({
    queryKey: ["all-assessments", user?.id],
    queryFn: async () => (await supabase.from("assessments").select("nivel, skill_id")).data ?? [],
    enabled: !!user,
  });

  const data = useMemo(() => {
    if (!comps || !avals) return [];
    return comps.map((c: any) => {
      const ids = c.skills?.map((s: any) => s.id) ?? [];
      const items = avals.filter((a: any) => ids.includes(a.skill_id));
      const avg = items.length ? items.reduce((s: number, a: any) => s + (LEVEL_VALUE[a.nivel] || 0), 0) / items.length : 0;
      return { competencia: c.nome.replace("Competência ", ""), media: Number(avg.toFixed(2)), avaliacoes: items.length, slug: c.slug };
    });
  }, [comps, avals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Visão consolidada das avaliações que você registrou.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Média por competência</CardTitle><CardDescription>Escala 1 (Inicial) a 4 (Avançado)</CardDescription></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competencia" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Bar dataKey="media" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quantidade de avaliações</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competencia" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="avaliacoes" fill="var(--color-accent-foreground)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {data.map((d) => {
          const col = competencyColor(d.slug);
          return (
            <Card key={d.slug}>
              <div className={`h-1 ${col.bg}`} />
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">{d.competencia}</div>
                <div className="text-2xl font-bold">{d.media.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{d.avaliacoes} avaliação(ões)</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { competencyColor } from "@/lib/competencies";
import { GraduationCap, ClipboardCheck, BookOpen, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({ component: () => <AppLayout><Dashboard /></AppLayout> });

function Dashboard() {
  const { user } = useAuth();

  const { data: comps } = useQuery({
    queryKey: ["competencies"],
    queryFn: async () => (await supabase.from("competencies").select("*").order("ordem")).data ?? [],
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () =>
      user ? (await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle()).data : null,
    enabled: !!user,
  });

  const { data: counts } = useQuery({
    queryKey: ["dash-counts", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [classes, assessments, plans] = await Promise.all([
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("professor_id", user.id),
        supabase.from("assessments").select("id", { count: "exact", head: true }).eq("created_by", user.id),
        supabase.from("lesson_plans").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      ]);
      return { turmas: classes.count ?? 0, avals: assessments.count ?? 0, planos: plans.count ?? 0 };
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {profile?.nome?.split(" ")[0] || "Professor(a)"}!</h1>
        <p className="text-muted-foreground">Bem-vindo(a) à sua plataforma de formação e avaliação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Turmas" value={counts?.turmas ?? "—"} />
        <StatCard icon={<ClipboardCheck className="h-5 w-5" />} label="Avaliações registradas" value={counts?.avals ?? "—"} />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Meus planos de aula" value={counts?.planos ?? "—"} />
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">Trilhas de Formação</h2>
            <p className="text-sm text-muted-foreground">Cinco competências, quinze habilidades.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/formacao">Ver todas</Link></Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comps?.map((c) => {
            const col = competencyColor(c.slug);
            return (
              <Link key={c.id} to="/formacao" className="group">
                <Card className="overflow-hidden h-full transition hover:shadow-md">
                  <div className={`h-2 ${col.bg}`} />
                  <CardHeader>
                    <CardTitle className="text-base">{c.nome}</CardTitle>
                    <CardDescription className="line-clamp-2">{c.descricao}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /><CardTitle className="text-base">Desafio do mês</CardTitle></div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhum desafio publicado no momento. O administrador pode adicionar novos desafios pedagógicos.
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

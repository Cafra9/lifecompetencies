import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliações de todos os professores · Admin" },
      { name: "description", content: "Visão consolidada das avaliações registradas por todos os professores." },
      { property: "og:title", content: "Avaliações de todos os professores" },
      { property: "og:description", content: "Visão consolidada das avaliações por professor e aluno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppLayout>
      <AdminAvaliacoes />
    </AppLayout>
  ),
});

type Row = { user_id: string; aluno_id: string; competencia: string; habilidade: string; nivel: string; updated_at: string };

const NIVEL: Record<string, string> = {
  iniciando: "Iniciando", desenvolvendo: "Desenvolvendo", dominando: "Dominando", nao_aplica: "Não se aplica",
};

function AdminAvaliacoes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<Record<string, { nome: string; turma: string }>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: p }, { data: s }] = await Promise.all([
        supabase.from("student_assessments").select("user_id, aluno_id, competencia, habilidade, nivel, updated_at").order("updated_at", { ascending: false }),
        supabase.from("profiles").select("id, nome, email"),
        supabase.from("students").select("id, nome, classes(nome)"),
      ]);
      setRows((a ?? []) as Row[]);
      setProfiles(Object.fromEntries((p ?? []).map((x: any) => [x.id, x.nome || x.email])));
      setStudents(Object.fromEntries((s ?? []).map((x: any) => [x.id, { nome: x.nome, turma: x.classes?.nome ?? "" }])));
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => {
    const m = new Map<string, { prof: string; aluno: string; turma: string; items: Row[]; last: string }>();
    for (const r of rows) {
      const k = `${r.user_id}|${r.aluno_id}`;
      const st = students[r.aluno_id];
      if (!m.has(k)) m.set(k, { prof: profiles[r.user_id] ?? "—", aluno: st?.nome ?? r.aluno_id, turma: st?.turma ?? "", items: [], last: r.updated_at });
      m.get(k)!.items.push(r);
    }
    const term = q.toLowerCase();
    return [...m.values()].filter((g) => !term || `${g.prof} ${g.aluno} ${g.turma}`.toLowerCase().includes(term));
  }, [rows, profiles, students, q]);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin" className="text-sm text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Admin</Link>
        <h1 className="text-3xl font-bold mt-1">Avaliações de todos os professores</h1>
        <p className="text-muted-foreground">{rows.length} avaliações registradas em {groups.length} combinações professor/aluno.</p>
      </div>
      <Input placeholder="Buscar por professor, aluno ou turma" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {loading ? <p className="text-muted-foreground">Carregando…</p> : groups.length === 0 ? <p className="text-muted-foreground">Nenhuma avaliação encontrada.</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g) => {
            const count: Record<string, number> = {};
            g.items.forEach((i) => { count[i.nivel] = (count[i.nivel] ?? 0) + 1; });
            return (
              <Card key={g.prof + g.aluno}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{g.aluno} {g.turma && <span className="text-muted-foreground font-normal">· {g.turma}</span>}</CardTitle>
                  <p className="text-sm text-muted-foreground">Professor(a): {g.prof} · atualizado em {new Date(g.last).toLocaleDateString("pt-BR")}</p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>{g.items.length} habilidades</Badge>
                  {Object.entries(count).map(([n, c]) => <Badge key={n} variant="outline">{NIVEL[n] ?? n}: {c}</Badge>)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

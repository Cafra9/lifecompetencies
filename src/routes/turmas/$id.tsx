import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { SEGMENT_LABEL } from "@/lib/competencies";
import { Plus, ArrowLeft, Trash2, ClipboardCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/turmas/$id")({ component: () => <AppLayout><TurmaDetalhe /></AppLayout> });

function TurmaDetalhe() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const sb = supabase as any;
  const { data: turma } = useQuery({
    queryKey: ["class", id],
    queryFn: async () => (await supabase.from("classes").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: alunos } = useQuery({
    queryKey: ["students", id],
    queryFn: async () => (await supabase.from("students").select("*").eq("class_id", id).order("nome")).data ?? [],
  });
  const { data: year } = useQuery({
    queryKey: ["class-year", (turma as any)?.school_year_id],
    enabled: !!(turma as any)?.school_year_id,
    queryFn: async () =>
      (await sb.from("school_years").select("*").eq("id", (turma as any).school_year_id).maybeSingle()).data,
  });
  const { data: cts } = useQuery({
    queryKey: ["class-teachers", id],
    queryFn: async () => (await sb.from("class_teachers").select("*").eq("class_id", id)).data ?? [],
  });
  const teacherIds = useMemo(() => {
    const ids = new Set<string>();
    const t: any = turma;
    if (t?.professor_regente_id) ids.add(t.professor_regente_id);
    if (t?.professor_id) ids.add(t.professor_id);
    (cts ?? []).forEach((c: any) => ids.add(c.user_id));
    return [...ids];
  }, [turma, cts]);
  const { data: profs } = useQuery({
    queryKey: ["profs", teacherIds.join(",")],
    enabled: teacherIds.length > 0,
    queryFn: async () => (await supabase.from("profiles").select("id, nome").in("id", teacherIds)).data ?? [],
  });
  const profById = useMemo(() => Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.nome])), [profs]);

  async function addAluno(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const nomes = String(f.get("nome")).split("\n").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("students").insert(nomes.map((n) => ({ nome: n, class_id: id })));
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`${nomes.length} aluno(s) adicionado(s)`); setOpen(false); qc.invalidateQueries({ queryKey: ["students", id] }); }
  }

  async function delAluno(sid: string) {
    if (!confirm("Excluir aluno?")) return;
    const { error } = await supabase.from("students").delete().eq("id", sid);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["students", id] });
  }

  if (!turma) return <div>Carregando…</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/turmas"><ArrowLeft className="h-4 w-4 mr-1" /> Turmas</Link></Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{turma.nome}</h1>
          <p className="text-muted-foreground">{SEGMENT_LABEL[turma.segmento]}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Adicionar alunos</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar alunos</DialogTitle></DialogHeader>
              <form onSubmit={addAluno} className="space-y-3">
                <div>
                  <Label>Nome(s) — um por linha</Label>
                  <textarea name="nome" required rows={6} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Adicionar"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {alunos?.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum aluno nesta turma.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {alunos?.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><UserIcon className="h-4 w-4" /></div>
                  <span className="font-medium">{a.nome}</span>
                </div>
                <div className="flex gap-1">
                  <Button asChild variant="ghost" size="sm"><Link to="/alunos/$id" params={{ id: a.id }}><ClipboardCheck className="h-4 w-4 mr-1" /> Avaliar</Link></Button>
                  <Button size="icon" variant="ghost" onClick={() => delAluno(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

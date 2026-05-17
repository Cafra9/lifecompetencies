import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { competencyColor } from "@/lib/competencies";
import { Plus, Heart, MessageCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/planos/")({ component: () => <AppLayout><Planos /></AppLayout> });

function Planos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: comps } = useQuery({
    queryKey: ["competencies"],
    queryFn: async () => (await supabase.from("competencies").select("*").order("ordem")).data ?? [],
  });
  const { data: planos } = useQuery({
    queryKey: ["lesson_plans"],
    queryFn: async () => (await supabase.from("lesson_plans").select("*, competencies(slug, nome), profiles!lesson_plans_author_id_fkey(nome)").eq("publicado", true).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: favs } = useQuery({
    queryKey: ["favs", user?.id],
    queryFn: async () => user ? (await supabase.from("lesson_plan_favorites").select("lesson_plan_id").eq("user_id", user.id)).data?.map((r) => r.lesson_plan_id) ?? [] : [],
    enabled: !!user,
  });

  async function createPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("lesson_plans").insert({
      author_id: user.id,
      titulo: String(f.get("titulo")),
      descricao: String(f.get("descricao")) || null,
      objetivos: String(f.get("objetivos")) || null,
      competency_id: (f.get("competency_id") as string) || null,
      serie: String(f.get("serie")) || null,
      disciplina: String(f.get("disciplina")) || null,
      materiais: String(f.get("materiais")) || null,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Plano publicado"); setOpen(false); qc.invalidateQueries({ queryKey: ["lesson_plans"] }); }
  }

  async function toggleFav(id: string) {
    if (!user) return;
    const isFav = favs?.includes(id);
    if (isFav) await supabase.from("lesson_plan_favorites").delete().eq("user_id", user.id).eq("lesson_plan_id", id);
    else await supabase.from("lesson_plan_favorites").insert({ user_id: user.id, lesson_plan_id: id });
    qc.invalidateQueries({ queryKey: ["favs", user.id] });
  }

  async function delPlan(id: string) {
    if (!confirm("Excluir plano?")) return;
    const { error } = await supabase.from("lesson_plans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["lesson_plans"] });
  }

  const filtered = planos?.filter((p: any) => !search || p.titulo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Planos de Aula</h1>
          <p className="text-muted-foreground">Banco colaborativo de planos e atividades.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo plano</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Novo plano de aula</DialogTitle></DialogHeader>
            <form onSubmit={createPlan} className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div><Label>Título</Label><Input name="titulo" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Série</Label><Input name="serie" placeholder="Ex: 5º ano" /></div>
                <div><Label>Disciplina</Label><Input name="disciplina" /></div>
              </div>
              <div>
                <Label>Competência</Label>
                <Select name="competency_id">
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{comps?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Objetivos</Label><Textarea name="objetivos" rows={2} /></div>
              <div><Label>Descrição da atividade</Label><Textarea name="descricao" rows={4} /></div>
              <div><Label>Materiais</Label><Textarea name="materiais" rows={2} /></div>
              <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Publicar"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar planos..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {filtered?.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum plano ainda.</CardContent></Card> :
          filtered?.map((p: any) => {
            const col = competencyColor(p.competencies?.slug);
            const isFav = favs?.includes(p.id);
            const isMine = p.author_id === user?.id;
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className={`h-1 ${col.bg}`} />
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{p.titulo}</CardTitle>
                      <CardDescription>
                        Por {p.profiles?.nome || "—"}
                        {p.serie && ` · ${p.serie}`}
                        {p.disciplina && ` · ${p.disciplina}`}
                        {p.competencies && ` · ${p.competencies.nome}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleFav(p.id)}>
                        <Heart className={`h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                      </Button>
                      {isMine && <Button size="icon" variant="ghost" onClick={() => delPlan(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {p.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.descricao}</p>}
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    {expanded === p.id ? "Recolher" : "Ver detalhes"}
                  </Button>
                  {expanded === p.id && (
                    <div className="mt-3 space-y-2 text-sm">
                      {p.objetivos && <div><Badge variant="outline" className="mb-1">Objetivos</Badge><p>{p.objetivos}</p></div>}
                      {p.descricao && <div><Badge variant="outline" className="mb-1">Atividade</Badge><p>{p.descricao}</p></div>}
                      {p.materiais && <div><Badge variant="outline" className="mb-1">Materiais</Badge><p>{p.materiais}</p></div>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

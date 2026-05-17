import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { SEGMENT_LABEL } from "@/lib/competencies";
import { Plus, Users, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/turmas/")({ component: () => <AppLayout><Turmas /></AppLayout> });

function Turmas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: turmas } = useQuery({
    queryKey: ["classes", user?.id],
    queryFn: async () => (await supabase.from("classes").select("*, students(count)").order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  async function createClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("classes").insert({
      nome: String(f.get("nome")),
      segmento: f.get("segmento") as any,
      professor_id: user.id,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Turma criada"); setOpen(false); qc.invalidateQueries({ queryKey: ["classes"] }); }
  }

  async function delClass(id: string) {
    if (!confirm("Excluir turma e todos os alunos?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Turma excluída"); qc.invalidateQueries({ queryKey: ["classes"] }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Turmas</h1>
          <p className="text-muted-foreground">Crie e gerencie suas turmas e alunos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova turma</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova turma</DialogTitle></DialogHeader>
            <form onSubmit={createClass} className="space-y-3">
              <div><Label>Nome</Label><Input name="nome" required placeholder="Ex.: 5º Ano A" /></div>
              <div>
                <Label>Segmento</Label>
                <Select name="segmento" defaultValue="fundamental_1">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEGMENT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {turmas?.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Users className="mx-auto h-10 w-10 mb-2 opacity-50" /> Nenhuma turma ainda. Crie sua primeira turma para começar.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {turmas?.map((t: any) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{t.nome}</CardTitle>
                    <CardDescription>{SEGMENT_LABEL[t.segmento]}</CardDescription>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => delClass(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{t.students?.[0]?.count ?? 0} alunos</div>
                <Button asChild variant="ghost" size="sm"><Link to="/turmas/$id" params={{ id: t.id }}>Abrir <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

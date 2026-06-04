import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { SEGMENT_LABEL } from "@/lib/competencies";
import { toast } from "sonner";

export const Route = createFileRoute("/turmas/")({ component: () => <AppLayout><TurmasPage /></AppLayout> });

const sb = supabase as any;

type SchoolYear = { id: string; codigo: string; nome: string; segmento: string; ordem: number; ativo: boolean };
type Turma = { id: string; nome: string; segmento: string; professor_id: string; school_year_id: string | null };

function TurmasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Turma> | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: turmas } = useQuery({
    queryKey: ["turmas", user?.id],
    queryFn: async () =>
      ((await supabase.from("classes").select("*").order("nome")).data as Turma[]) ?? [],
    enabled: !!user,
  });
  const { data: years } = useQuery({
    queryKey: ["school_years"],
    queryFn: async () =>
      ((await sb.from("school_years").select("*").eq("ativo", true).order("ordem")).data as SchoolYear[]) ?? [],
  });

  const yearsBySeg = useMemo(() => {
    const m: Record<string, SchoolYear[]> = {};
    (years ?? []).forEach((y) => { (m[y.segmento] ||= []).push(y); });
    return m;
  }, [years]);

  function startNew() { setEditing({ nome: "", segmento: "infantil", school_year_id: null }); setOpen(true); }
  function startEdit(t: Turma) { setEditing(t); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editing) return;
    setBusy(true);
    const payload = {
      nome: editing.nome?.trim(),
      segmento: editing.segmento,
      school_year_id: editing.school_year_id || null,
      professor_id: user.id,
    };
    if (!payload.nome || !payload.segmento) { setBusy(false); return toast.error("Nome e segmento são obrigatórios"); }
    const { error } = editing.id
      ? await supabase.from("classes").update(payload).eq("id", editing.id)
      : await supabase.from("classes").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Turma atualizada" : "Turma criada");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["turmas"] });
  }

  async function remove(t: Turma) {
    if (!confirm(`Excluir a turma "${t.nome}"? Alunos vinculados também serão removidos.`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Turma excluída");
    qc.invalidateQueries({ queryKey: ["turmas"] });
  }

  const yearById = Object.fromEntries((years ?? []).map((y) => [y.id, y]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Minhas Turmas</p>
          <h1 className="text-3xl font-bold mt-1">Turmas e alunos</h1>
          <p className="text-muted-foreground">Crie suas turmas, vincule ao ano escolar (K1–K5, 1º ao 9º, EM) e cadastre seus alunos.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" /> Nova turma</Button>
      </div>

      {(turmas ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhuma turma cadastrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {turmas!.map((t) => {
            const y = t.school_year_id ? yearById[t.school_year_id] : null;
            return (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link to="/turmas/$id" params={{ id: t.id }} className="hover:underline">{t.nome}</Link>
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {SEGMENT_LABEL[t.segmento]} {y ? `· ${y.nome}` : <span className="text-amber-700">· sem ano escolar</span>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar turma" : "Nova turma"}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} required />
              </div>
              <div>
                <Label>Segmento</Label>
                <Select
                  value={editing.segmento ?? "infantil"}
                  onValueChange={(v) => setEditing({ ...editing, segmento: v, school_year_id: null })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["infantil", "fundamental_1", "fundamental_2", "medio"] as const).map((s) => (
                      <SelectItem key={s} value={s}>{SEGMENT_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano escolar</Label>
                <Select
                  value={editing.school_year_id ?? ""}
                  onValueChange={(v) => setEditing({ ...editing, school_year_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o ano" /></SelectTrigger>
                  <SelectContent>
                    {(yearsBySeg[editing.segmento ?? "infantil"] ?? []).map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.nome}</SelectItem>
                    ))}
                    {(yearsBySeg[editing.segmento ?? "infantil"] ?? []).length === 0 && (
                      <div className="px-2 py-2 text-xs text-muted-foreground">Nenhum ano cadastrado para este segmento — adicione em Configurações.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

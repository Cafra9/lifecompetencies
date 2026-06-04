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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Pencil, Trash2, Archive, ArchiveRestore, X, UserCheck } from "lucide-react";
import { SEGMENT_LABEL } from "@/lib/competencies";
import { toast } from "sonner";

export const Route = createFileRoute("/turmas/")({ component: () => <AppLayout><TurmasPage /></AppLayout> });

const sb = supabase as any;

type SchoolYear = { id: string; codigo: string; nome: string; segmento: string; ordem: number; ativo: boolean };
type Turma = {
  id: string; nome: string; segmento: string; professor_id: string;
  professor_regente_id: string | null; school_year_id: string | null;
  letra: string | null; arquivada: boolean;
};
type Profile = { id: string; nome: string; email: string; cargo: string | null };
type ClassTeacher = { id: string; class_id: string; user_id: string; papel: string | null };

function TurmasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Turma> | null>(null);
  const [editTeachers, setEditTeachers] = useState<{ user_id: string; papel: string }[]>([]);
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
  const { data: profiles } = useQuery({
    queryKey: ["profiles-lite"],
    queryFn: async () =>
      ((await supabase.from("profiles").select("id, nome, email, cargo").order("nome")).data as Profile[]) ?? [],
  });
  const { data: classTeachers } = useQuery({
    queryKey: ["class-teachers"],
    queryFn: async () => ((await sb.from("class_teachers").select("*")).data as ClassTeacher[]) ?? [],
  });
  const { data: studentCounts } = useQuery({
    queryKey: ["student-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("class_id");
      const m: Record<string, number> = {};
      (data ?? []).forEach((s: any) => { m[s.class_id] = (m[s.class_id] || 0) + 1; });
      return m;
    },
  });

  const profileById = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p])),
    [profiles]
  );
  const teachersByClass = useMemo(() => {
    const m: Record<string, ClassTeacher[]> = {};
    (classTeachers ?? []).forEach((ct) => { (m[ct.class_id] ||= []).push(ct); });
    return m;
  }, [classTeachers]);
  const yearById = useMemo(() => Object.fromEntries((years ?? []).map((y) => [y.id, y])), [years]);

  function startNew() {
    setEditing({ nome: "", letra: "", school_year_id: null, professor_regente_id: user?.id ?? null, arquivada: false });
    setEditTeachers([]);
    setOpen(true);
  }
  function startEdit(t: Turma) {
    setEditing(t);
    setEditTeachers((teachersByClass[t.id] ?? []).map((ct) => ({ user_id: ct.user_id, papel: ct.papel ?? "" })));
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editing) return;
    const year = editing.school_year_id ? yearById[editing.school_year_id] : null;
    if (!year) return toast.error("Selecione o ano escolar");
    const letra = (editing.letra ?? "").trim().toUpperCase();
    const nome = (editing.nome?.trim()) || `${year.codigo}${letra}`;
    if (!nome) return toast.error("Informe o nome da turma");
    setBusy(true);
    const payload = {
      nome,
      letra: letra || null,
      segmento: year.segmento as Turma["segmento"],
      school_year_id: year.id,
      professor_id: user.id,
      professor_regente_id: editing.professor_regente_id || user.id,
      arquivada: !!editing.arquivada,
    };
    let classId = editing.id;
    if (editing.id) {
      const { error } = await supabase.from("classes").update(payload as any).eq("id", editing.id);
      if (error) { setBusy(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("classes").insert(payload as any).select("id").single();
      if (error || !data) { setBusy(false); return toast.error(error?.message || "Erro ao criar"); }
      classId = (data as any).id;
    }
    // Sincroniza co-professores
    if (classId) {
      await sb.from("class_teachers").delete().eq("class_id", classId);
      const rows = editTeachers
        .filter((t) => t.user_id && t.user_id !== payload.professor_regente_id)
        .map((t) => ({ class_id: classId, user_id: t.user_id, papel: t.papel || null }));
      if (rows.length) {
        const { error: ctErr } = await sb.from("class_teachers").insert(rows);
        if (ctErr) toast.error(`Co-professores: ${ctErr.message}`);
      }
    }
    setBusy(false);
    toast.success(editing.id ? "Turma atualizada" : "Turma criada");
    setOpen(false); setEditing(null); setEditTeachers([]);
    qc.invalidateQueries({ queryKey: ["turmas"] });
    qc.invalidateQueries({ queryKey: ["class-teachers"] });
  }

  async function toggleArchive(t: Turma) {
    const { error } = await supabase.from("classes").update({ arquivada: !t.arquivada } as any).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success(t.arquivada ? "Turma reativada" : "Turma arquivada");
    qc.invalidateQueries({ queryKey: ["turmas"] });
  }

  async function remove(t: Turma) {
    if (!confirm(`Excluir definitivamente "${t.nome}"? Alunos vinculados também serão removidos.`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Turma excluída");
    qc.invalidateQueries({ queryKey: ["turmas"] });
  }

  function addTeacherRow() { setEditTeachers((rows) => [...rows, { user_id: "", papel: "" }]); }
  function removeTeacherRow(i: number) { setEditTeachers((rows) => rows.filter((_, idx) => idx !== i)); }
  function updateTeacherRow(i: number, patch: Partial<{ user_id: string; papel: string }>) {
    setEditTeachers((rows) => rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  const ativas = (turmas ?? []).filter((t) => !t.arquivada);
  const arquivadas = (turmas ?? []).filter((t) => t.arquivada);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Estrutura escolar</p>
          <h1 className="text-3xl font-bold mt-1">Turmas e alunos</h1>
          <p className="text-muted-foreground">Early Years (K1–K5) e Elementary School (Y1–Y9). Vincule regente e co-professores a cada turma.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" /> Nova turma</Button>
      </div>

      <Tabs defaultValue="ativas">
        <TabsList>
          <TabsTrigger value="ativas">Ativas ({ativas.length})</TabsTrigger>
          <TabsTrigger value="arquivadas">Arquivadas ({arquivadas.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="ativas" className="mt-4">
          <TurmasGrid list={ativas} {...{ yearById, profileById, teachersByClass, studentCounts, startEdit, toggleArchive, remove }} />
        </TabsContent>
        <TabsContent value="arquivadas" className="mt-4">
          <TurmasGrid list={arquivadas} {...{ yearById, profileById, teachersByClass, studentCounts, startEdit, toggleArchive, remove }} />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setEditTeachers([]); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar turma" : "Nova turma"}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ano escolar</Label>
                  <Select
                    value={editing.school_year_id ?? ""}
                    onValueChange={(v) => {
                      const y = yearById[v];
                      const letra = (editing.letra ?? "").trim().toUpperCase();
                      setEditing({ ...editing, school_year_id: v, nome: y ? `${y.codigo}${letra}` : editing.nome });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Early Years (Kindergarten)</div>
                      {(years ?? []).filter((y) => y.segmento === "infantil").map((y) => (
                        <SelectItem key={y.id} value={y.id}>{y.nome}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">Elementary School</div>
                      {(years ?? []).filter((y) => y.segmento === "fundamental_1" || y.segmento === "fundamental_2").map((y) => (
                        <SelectItem key={y.id} value={y.id}>{y.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Letra / identificador</Label>
                  <Input
                    value={editing.letra ?? ""}
                    maxLength={3}
                    onChange={(e) => {
                      const letra = e.target.value.toUpperCase();
                      const y = editing.school_year_id ? yearById[editing.school_year_id] : null;
                      setEditing({ ...editing, letra, nome: y ? `${y.codigo}${letra}` : editing.nome });
                    }}
                    placeholder="A"
                  />
                </div>
              </div>
              <div>
                <Label>Nome da turma</Label>
                <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex.: K1A, Y3C" required />
              </div>
              <div>
                <Label>Professor regente (Homeroom)</Label>
                <Select
                  value={editing.professor_regente_id ?? user?.id ?? ""}
                  onValueChange={(v) => setEditing({ ...editing, professor_regente_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(profiles ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}{p.cargo ? ` · ${p.cargo}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Co-professores</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTeacherRow}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {editTeachers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum — apenas o regente atua nesta turma.</p>
                ) : (
                  <div className="space-y-2">
                    {editTeachers.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Select value={row.user_id} onValueChange={(v) => updateTeacherRow(i, { user_id: v })}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Professor" /></SelectTrigger>
                          <SelectContent>
                            {(profiles ?? [])
                              .filter((p) => p.id !== editing.professor_regente_id)
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Papel (ex.: English)"
                          className="flex-1"
                          value={row.papel}
                          onChange={(e) => updateTeacherRow(i, { papel: e.target.value })}
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeTeacherRow(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TurmasGrid({ list, yearById, profileById, teachersByClass, studentCounts, startEdit, toggleArchive, remove }: any) {
  if (!list.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Nenhuma turma nesta lista.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {list.map((t: Turma) => {
        const y = t.school_year_id ? yearById[t.school_year_id] : null;
        const regente = t.professor_regente_id ? profileById[t.professor_regente_id] : null;
        const cts = teachersByClass[t.id] ?? [];
        const qtd = studentCounts?.[t.id] ?? 0;
        return (
          <Card key={t.id} className={t.arquivada ? "opacity-70" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  <Link to="/turmas/$id" params={{ id: t.id }} className="hover:underline">{t.nome}</Link>
                  {t.arquivada && <Badge variant="outline" className="ml-2">Arquivada</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(t)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleArchive(t)} title={t.arquivada ? "Reativar" : "Arquivar"}>
                    {t.arquivada ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm space-y-1">
              <div className="text-muted-foreground">
                {y ? `${y.nome} · ${SEGMENT_LABEL[t.segmento]}` : <span className="text-amber-700">Sem ano escolar</span>}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{qtd} aluno{qtd === 1 ? "" : "s"}</span>
              </div>
              {regente && (
                <div className="flex items-center gap-1 text-xs">
                  <UserCheck className="h-3 w-3 text-primary" />
                  <span>{regente.nome} <span className="text-muted-foreground">· Regente</span></span>
                </div>
              )}
              {cts.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {cts.map((ct: ClassTeacher) => {
                    const p = profileById[ct.user_id];
                    return <Badge key={ct.id} variant="secondary" className="text-xs">{p?.nome ?? "Professor"}{ct.papel ? ` · ${ct.papel}` : ""}</Badge>;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

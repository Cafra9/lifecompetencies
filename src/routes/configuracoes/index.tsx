import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Mail, Pencil, Plus, Trash2, UserPlus, ShieldCheck, GraduationCap, Library, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin, useIsDiretora, useIsCoordenador } from "@/hooks/useAuth";
import { ROLE_LABELS, SEGMENT_LABELS, SEGMENTS, type AppRole, type SchoolSegment } from "@/lib/school-config";

export const Route = createFileRoute("/configuracoes/")({ component: ConfiguracoesPage });

const sb = supabase as any;

// ------------------- Tipos compartilhados -------------------
type SchoolYear = {
  id: string;
  codigo: string;
  nome: string;
  segmento: SchoolSegment;
  ordem: number;
  ativo: boolean;
};
type EvidenceReq = { id: string; slug: string; nome: string; descricao: string | null; ativo: boolean };
type YearReq = { id: string; school_year_id: string; requirement_id: string; obrigatorio: boolean; orientacao: string | null };
type TeacherYear = { id: string; user_id: string; segmento: SchoolSegment; school_year_id: string | null };
type CoordSeg = { id: string; user_id: string; segmento: SchoolSegment };
type Invitation = {
  id: string; email: string; role: AppRole;
  segmento: SchoolSegment | null; anos: string[] | null;
  token: string; expires_at: string; accepted_at: string | null; created_at: string;
};
type ProfileLite = { id: string; nome: string; email: string; cargo: string | null; ativo: boolean };
type Turma = {
  id: string; nome: string; segmento: SchoolSegment; school_year_id: string | null;
  professor_id: string; professor_regente_id: string | null;
  letra: string | null; arquivada: boolean;
};
type ClassTeacherRow = { id: string; class_id: string; user_id: string; papel: string | null };

// ============================================================
function ConfiguracoesPage() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const isDiretora = useIsDiretora();
  const isCoord = useIsCoordenador();
  const canManage = isAdmin || isDiretora;

  if (loading) return null;
  if (!user) {
    return (
      <AppLayout>
        <Card>
          <CardHeader><CardTitle>Acesso restrito</CardTitle><CardDescription>Faça login.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link to="/login">Entrar</Link></Button></CardContent>
        </Card>
      </AppLayout>
    );
  }

  const defaultTab = canManage ? "anos" : isCoord ? "year-reqs" : "team";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Configurações</p>
          <h1 className="text-3xl font-bold mt-1">Gestão da escola</h1>
          <p className="text-muted-foreground">
            Cadastre anos escolares, exigências, professores e equipe. Tudo é dinâmico e usado no relatório final.
          </p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex-wrap h-auto">
            {canManage && <TabsTrigger value="anos">Anos escolares</TabsTrigger>}
            {canManage && <TabsTrigger value="turmas">Turmas</TabsTrigger>}
            {canManage && <TabsTrigger value="requirements">Exigências</TabsTrigger>}
            {(canManage || isCoord) && <TabsTrigger value="year-reqs">Exigências por ano</TabsTrigger>}
            {canManage && <TabsTrigger value="teachers">Professores</TabsTrigger>}
            {canManage && <TabsTrigger value="team">Equipe</TabsTrigger>}
          </TabsList>

          {canManage && <TabsContent value="anos" className="mt-6"><AnosTab /></TabsContent>}
          {canManage && <TabsContent value="turmas" className="mt-6"><ClassesTab /></TabsContent>}
          {canManage && <TabsContent value="requirements" className="mt-6"><RequirementsTab /></TabsContent>}
          {(canManage || isCoord) && <TabsContent value="year-reqs" className="mt-6"><YearRequirementsTab /></TabsContent>}
          {canManage && <TabsContent value="teachers" className="mt-6"><TeachersTab /></TabsContent>}
          {canManage && <TabsContent value="team" className="mt-6"><TeamTab /></TabsContent>}
        </Tabs>
      </div>
    </AppLayout>
  );
}

/* ===========================================================
   1. ANOS ESCOLARES — CRUD
   =========================================================== */
function AnosTab() {
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SchoolYear> | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data } = await sb.from("school_years").select("*").order("ordem", { ascending: true });
    setYears((data ?? []) as SchoolYear[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.codigo?.trim() || !editing.nome?.trim() || !editing.segmento) {
      return toast.error("Preencha código, nome e segmento.");
    }
    const payload = {
      codigo: editing.codigo.trim().toUpperCase(),
      nome: editing.nome.trim(),
      segmento: editing.segmento,
      ordem: editing.ordem ?? 0,
      ativo: editing.ativo ?? true,
    };
    const res = editing.id
      ? await sb.from("school_years").update(payload).eq("id", editing.id)
      : await sb.from("school_years").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo");
    setEditing(null);
    refresh();
  };

  const remove = async (y: SchoolYear) => {
    if (!confirm(`Excluir o ano "${y.nome}"? Isso remove todas as exigências e vínculos de professores deste ano.`)) return;
    const { error } = await sb.from("school_years").delete().eq("id", y.id);
    if (error) return toast.error(error.message);
    toast.success("Ano excluído");
    refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Anos escolares</CardTitle>
          <CardDescription>Cadastre os anos disponíveis na escola (K1…K5, anos do fundamental, médio…).</CardDescription>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ ativo: true, ordem: years.length + 1, segmento: "infantil" })}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </DialogTrigger>
          <YearDialog editing={editing} setEditing={setEditing} onSave={save} />
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Segmento</TableHead>
              <TableHead>Ordem</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {years.map((y) => (
                <TableRow key={y.id}>
                  <TableCell className="font-mono text-xs">{y.codigo}</TableCell>
                  <TableCell className="font-medium">{y.nome}</TableCell>
                  <TableCell>{SEGMENT_LABELS[y.segmento]}</TableCell>
                  <TableCell>{y.ordem}</TableCell>
                  <TableCell>{y.ativo ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(y)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(y)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function YearDialog({ editing, setEditing, onSave }: {
  editing: Partial<SchoolYear> | null;
  setEditing: (v: Partial<SchoolYear> | null) => void;
  onSave: () => void;
}) {
  if (!editing) return null;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing.id ? "Editar ano" : "Novo ano escolar"}</DialogTitle>
        <DialogDescription>Defina código (ex. K1), nome de exibição e segmento.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>Código</Label><Input value={editing.codigo ?? ""} onChange={(e) => setEditing({ ...editing, codigo: e.target.value })} placeholder="K1" /></div>
        <div><Label>Nome</Label><Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="K1" /></div>
        <div>
          <Label>Segmento</Label>
          <Select value={editing.segmento ?? ""} onValueChange={(v) => setEditing({ ...editing, segmento: v as SchoolSegment })}>
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{SEGMENT_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Ordem</Label><Input type="number" value={editing.ordem ?? 0} onChange={(e) => setEditing({ ...editing, ordem: Number(e.target.value) })} /></div>
        <div className="flex items-center gap-2"><Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} /><Label>Ativo</Label></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
        <Button onClick={onSave}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ===========================================================
   2. EXIGÊNCIAS — catálogo CRUD
   =========================================================== */
function RequirementsTab() {
  const [items, setItems] = useState<EvidenceReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EvidenceReq> | null>(null);

  const refresh = async () => {
    setLoading(true);
    // Rubrica é obrigatória para todos os anos e não é gerenciada aqui (sempre ativa).
    const { data } = await sb.from("evidence_requirements").select("*").neq("slug", "rubrica").order("nome");
    setItems((data ?? []) as EvidenceReq[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.nome?.trim() || !editing.slug?.trim()) return toast.error("Preencha nome e slug.");
    const payload = {
      nome: editing.nome.trim(),
      slug: editing.slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      descricao: editing.descricao ?? null,
      ativo: editing.ativo ?? true,
    };
    const res = editing.id
      ? await sb.from("evidence_requirements").update(payload).eq("id", editing.id)
      : await sb.from("evidence_requirements").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo");
    setEditing(null);
    refresh();
  };

  const remove = async (r: EvidenceReq) => {
    if (!confirm(`Excluir a exigência "${r.nome}"?`)) return;
    const { error } = await sb.from("evidence_requirements").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Catálogo de exigências complementares</CardTitle>
          <CardDescription>
            Evidências complementares que podem ser exigidas em cada ano (Portfólio, Fotos, Vídeos, Produções, etc.).
            A Rubrica é obrigatória para todos os anos e não aparece aqui.
          </CardDescription>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ ativo: true })}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar exigência" : "Nova exigência"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="Portfólio" /></div>
                <div><Label>Slug</Label><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="portfolio" /></div>
                <div><Label>Descrição</Label><Textarea value={editing.descricao ?? ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} /><Label>Ativo</Label></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Slug</TableHead><TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md">{r.descricao}</TableCell>
                  <TableCell>{r.ativo ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(r)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ===========================================================
   3. EXIGÊNCIAS POR ANO
   =========================================================== */
function YearRequirementsTab() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const isDiretora = useIsDiretora();
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [reqs, setReqs] = useState<EvidenceReq[]>([]);
  const [yearReqs, setYearReqs] = useState<YearReq[]>([]);
  const [coordSegs, setCoordSegs] = useState<CoordSeg[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [sy, er, yr, cs] = await Promise.all([
      sb.from("school_years").select("*").eq("ativo", true).order("ordem"),
      sb.from("evidence_requirements").select("*").eq("ativo", true).neq("slug", "rubrica").order("nome"),
      sb.from("year_requirements").select("*"),
      sb.from("coordinator_segments").select("*"),
    ]);
    setYears((sy.data ?? []) as SchoolYear[]);
    setReqs((er.data ?? []) as EvidenceReq[]);
    setYearReqs((yr.data ?? []) as YearReq[]);
    setCoordSegs((cs.data ?? []) as CoordSeg[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const visibleYears = useMemo(() => {
    if (isAdmin || isDiretora) return years;
    const mySegs = new Set(coordSegs.filter((c) => c.user_id === user?.id).map((c) => c.segmento));
    return years.filter((y) => mySegs.has(y.segmento));
  }, [years, coordSegs, user, isAdmin, isDiretora]);

  useEffect(() => {
    if (!selectedYear && visibleYears.length) setSelectedYear(visibleYears[0].id);
  }, [visibleYears, selectedYear]);

  const toggle = async (req: EvidenceReq, on: boolean) => {
    if (!selectedYear) return;
    const existing = yearReqs.find((r) => r.school_year_id === selectedYear && r.requirement_id === req.id);
    if (on) {
      if (existing) return;
      const { error } = await sb.from("year_requirements").insert({
        school_year_id: selectedYear, requirement_id: req.id, obrigatorio: true, created_by: user!.id,
      });
      if (error) return toast.error(error.message);
    } else {
      if (!existing) return;
      const { error } = await sb.from("year_requirements").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
    }
    refresh();
  };

  const setOrientacao = async (yr: YearReq, val: string) => {
    const { error } = await sb.from("year_requirements").update({ orientacao: val }).eq("id", yr.id);
    if (error) toast.error(error.message);
  };

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (visibleYears.length === 0) return <p className="text-muted-foreground">Nenhum ano disponível. Cadastre anos primeiro.</p>;

  const current = visibleYears.find((y) => y.id === selectedYear);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exigências complementares por ano</CardTitle>
        <CardDescription>
          Selecione um ano e marque as evidências complementares exigidas.
          A Rubrica é obrigatória para todos os anos e sempre será considerada na geração do relatório — não precisa ser configurada aqui.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {visibleYears.map((y) => (
              <SelectItem key={y.id} value={y.id}>{y.nome} · {SEGMENT_LABELS[y.segmento]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {current && (
          <div className="space-y-3">
            {reqs.map((r) => {
              const yr = yearReqs.find((x) => x.school_year_id === current.id && x.requirement_id === r.id);
              const on = !!yr;
              return (
                <div key={r.id} className="flex gap-3 items-start border rounded-lg p-3">
                  <Checkbox checked={on} onCheckedChange={(c) => toggle(r, !!c)} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{r.nome}</div>
                    {r.descricao && <div className="text-xs text-muted-foreground">{r.descricao}</div>}
                    {on && yr && (
                      <Textarea
                        className="mt-2"
                        placeholder="Orientação ao professor (opcional)"
                        defaultValue={yr.orientacao ?? ""}
                        onBlur={(e) => setOrientacao(yr, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ===========================================================
   4. PROFESSORES — CRUD
   =========================================================== */
function TeachersTab() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole[]>>({});
  const [classTeachers, setClassTeachers] = useState<ClassTeacherRow[]>([]);
  const [classes, setClasses] = useState<Turma[]>([]);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [editing, setEditing] = useState<ProfileLite | null>(null);
  const [editClasses, setEditClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteClasses, setInviteClasses] = useState<string[]>([]);

  const refresh = async () => {
    setLoading(true);
    const [pr, ur, ct, cl, sy] = await Promise.all([
      sb.from("profiles").select("id, nome, email, cargo, ativo"),
      sb.from("user_roles").select("user_id, role"),
      sb.from("class_teachers").select("*"),
      sb.from("classes").select("*").eq("arquivada", false).order("nome"),
      sb.from("school_years").select("*").order("ordem"),
    ]);
    setProfiles((pr.data ?? []) as ProfileLite[]);
    const m: Record<string, AppRole[]> = {};
    for (const r of (ur.data ?? []) as Array<{ user_id: string; role: AppRole }>) (m[r.user_id] ||= []).push(r.role);
    setRoles(m);
    setClassTeachers((ct.data ?? []) as ClassTeacherRow[]);
    setClasses((cl.data ?? []) as Turma[]);
    setYears((sy.data ?? []) as SchoolYear[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const teachers = profiles.filter((p) => (roles[p.id] ?? []).includes("professor"));
  const yearsById = useMemo(() => Object.fromEntries(years.map((y) => [y.id, y])), [years]);
  const classesById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);

  // Turmas atendidas por professor = união de regente + class_teachers
  const turmasDoProfessor = (uid: string) => {
    const ids = new Set<string>();
    classes.forEach((c) => { if (c.professor_regente_id === uid || c.professor_id === uid) ids.add(c.id); });
    classTeachers.forEach((ct) => { if (ct.user_id === uid) ids.add(ct.class_id); });
    return Array.from(ids).map((id) => classesById[id]).filter(Boolean);
  };

  const openInvite = () => { setEmail(""); setInviteClasses([]); setInviteOpen(true); };

  const sendInvite = async () => {
    if (!email.trim()) return toast.error("Informe o e-mail");
    // Guardamos as turmas pré-selecionadas em `anos` (text[]) como ids — usado após aceite.
    const { data, error } = await sb.from("invitations").insert({
      email: email.trim().toLowerCase(),
      role: "professor",
      segmento: null,
      anos: inviteClasses.length ? inviteClasses : null,
      invited_by: user!.id,
    }).select().single();
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/login?invite=${data.token}`;
    await navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Convite criado", { description: "Link copiado. Vincule as turmas após o aceite." });
    setInviteOpen(false);
    refresh();
  };

  const openEdit = (p: ProfileLite) => {
    setEditing(p);
    setEditClasses(turmasDoProfessor(p.id).map((c) => c.id));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const updates: any = { cargo: editing.cargo, ativo: editing.ativo, nome: editing.nome };
    const { error: e1 } = await sb.from("profiles").update(updates).eq("id", editing.id);
    if (e1) return toast.error(e1.message);

    // Sincroniza class_teachers (não toca turmas onde é regente — manter integridade)
    const currentCt = classTeachers.filter((t) => t.user_id === editing.id);
    const regenteClasses = new Set(classes.filter((c) => c.professor_regente_id === editing.id || c.professor_id === editing.id).map((c) => c.id));
    const desired = editClasses.filter((id) => !regenteClasses.has(id));
    const toRemove = currentCt.filter((t) => !desired.includes(t.class_id));
    const toAdd = desired.filter((id) => !currentCt.some((t) => t.class_id === id));
    for (const t of toRemove) await sb.from("class_teachers").delete().eq("id", t.id);
    for (const id of toAdd) {
      const { error } = await sb.from("class_teachers").insert({ class_id: id, user_id: editing.id, papel: null });
      if (error) toast.error(`Turma ${classesById[id]?.nome}: ${error.message}`);
    }
    toast.success("Professor atualizado");
    setEditing(null);
    refresh();
  };

  const removeTeacher = async (p: ProfileLite) => {
    if (!confirm(`Remover o papel de professor de "${p.nome}"? Vínculos de turma serão removidos.`)) return;
    await sb.from("class_teachers").delete().eq("user_id", p.id);
    await sb.from("user_roles").delete().eq("user_id", p.id).eq("role", "professor");
    toast.success("Vínculo removido");
    refresh();
  };

  const classLabel = (c: Turma) => {
    const y = c.school_year_id ? yearsById[c.school_year_id] : null;
    return y ? `${c.nome} · ${y.nome}` : c.nome;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Professores</CardTitle>
          <CardDescription>Convide professores e vincule-os às turmas que atendem.</CardDescription>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button onClick={openInvite}><UserPlus className="h-4 w-4 mr-2" /> Convidar professor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Convidar professor</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div>
                <Label className="mb-2 block">Turmas atendidas (opcional)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2">
                  {classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={inviteClasses.includes(c.id)} onCheckedChange={(v) =>
                        setInviteClasses((prev) => v ? [...prev, c.id] : prev.filter((x) => x !== c.id))} />
                      {classLabel(c)}
                    </label>
                  ))}
                  {classes.length === 0 && <p className="text-xs text-muted-foreground col-span-2">Nenhuma turma cadastrada.</p>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Você poderá vincular ou alterar as turmas depois.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
              <Button onClick={sendInvite}><Mail className="h-4 w-4 mr-2" /> Gerar convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : teachers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum professor cadastrado ainda. Use "Convidar professor".</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Cargo</TableHead>
              <TableHead>Turmas atendidas</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {teachers.map((p) => {
                const ts = turmasDoProfessor(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-sm">{p.email}</TableCell>
                    <TableCell className="text-sm">{p.cargo ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {ts.length ? (
                        <div className="flex flex-wrap gap-1">
                          {ts.map((c) => <Badge key={c.id} variant="secondary" className="text-xs">{c.nome}</Badge>)}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{p.ativo ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeTeacher(p)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Edit dialog */}
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar professor</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                <div><Label>Cargo / Função</Label><Input value={editing.cargo ?? ""} onChange={(e) => setEditing({ ...editing, cargo: e.target.value })} placeholder="Professor regente, Auxiliar…" /></div>
                <div>
                  <Label className="mb-2 block">Turmas atendidas</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-auto border rounded p-2">
                    {classes.map((c) => {
                      const isRegente = c.professor_regente_id === editing.id || c.professor_id === editing.id;
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={editClasses.includes(c.id) || isRegente}
                            disabled={isRegente}
                            onCheckedChange={(v) =>
                              setEditClasses((prev) => v ? [...prev, c.id] : prev.filter((x) => x !== c.id))} />
                          {classLabel(c)} {isRegente && <span className="text-xs text-primary">· Regente</span>}
                        </label>
                      );
                    })}
                    {classes.length === 0 && <p className="text-xs text-muted-foreground col-span-2">Nenhuma turma cadastrada.</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={editing.ativo} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} /><Label>Ativo</Label></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/* ===========================================================
   4b. TURMAS — CRUD em Configurações
   =========================================================== */
function ClassesTab() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Turma[]>([]);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherRow[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Partial<Turma> | null>(null);
  const [editAssoc, setEditAssoc] = useState<string[]>([]);
  const [bulkStudentNames, setBulkStudentNames] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [cl, sy, pr, ct, st] = await Promise.all([
      sb.from("classes").select("*").order("nome"),
      sb.from("school_years").select("*").eq("ativo", true).order("ordem"),
      sb.from("profiles").select("id, nome, email, cargo, ativo").order("nome"),
      sb.from("class_teachers").select("*"),
      supabase.from("students").select("class_id"),
    ]);
    setClasses((cl.data ?? []) as Turma[]);
    setYears((sy.data ?? []) as SchoolYear[]);
    setProfiles((pr.data ?? []) as ProfileLite[]);
    setClassTeachers((ct.data ?? []) as ClassTeacherRow[]);
    const counts: Record<string, number> = {};
    ((st.data ?? []) as any[]).forEach((s) => { counts[s.class_id] = (counts[s.class_id] || 0) + 1; });
    setStudentCounts(counts);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const yearsById = useMemo(() => Object.fromEntries(years.map((y) => [y.id, y])), [years]);
  const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);

  const openNew = () => {
    setEditing({ nome: "", letra: "", school_year_id: null, professor_regente_id: user?.id ?? null, arquivada: false });
    setEditAssoc([]);
    setBulkStudentNames("");
  };
  const openEdit = (c: Turma) => {
    setEditing(c);
    setEditAssoc(classTeachers.filter((t) => t.class_id === c.id).map((t) => t.user_id));
    setBulkStudentNames("");
  };
  const closeEditor = () => {
    setEditing(null);
    setEditAssoc([]);
    setBulkStudentNames("");
  };

  function parseStudentNames(value: string) {
    const seen = new Set<string>();
    return value
      .split(/\r?\n|;/)
      .map((name) => name.trim().replace(/\s+/g, " "))
      .filter((name) => {
        const key = name.toLocaleLowerCase("pt-BR");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  const save = async () => {
    if (!user || !editing) return;
    const y = editing.school_year_id ? yearsById[editing.school_year_id] : null;
    if (!y) return toast.error("Selecione o ano escolar");
    const letra = (editing.letra ?? "").trim().toUpperCase();
    const nome = (editing.nome?.trim()) || `${y.codigo}${letra}`;
    if (!nome) return toast.error("Informe o nome da turma");

    const payload: any = {
      nome,
      letra: letra || null,
      segmento: y.segmento,
      school_year_id: y.id,
      professor_id: user.id,
      professor_regente_id: editing.professor_regente_id || user.id,
      arquivada: !!editing.arquivada,
    };
    let classId = editing.id;
    if (editing.id) {
      const { error } = await sb.from("classes").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await sb.from("classes").insert(payload).select("id").single();
      if (error || !data) return toast.error(error?.message || "Erro");
      classId = data.id;
    }
    if (classId) {
      await sb.from("class_teachers").delete().eq("class_id", classId);
      const rows = editAssoc
        .filter((uid) => uid && uid !== payload.professor_regente_id)
        .map((uid) => ({ class_id: classId, user_id: uid, papel: null }));
      if (rows.length) {
        const { error } = await sb.from("class_teachers").insert(rows);
        if (error) toast.error(`Professores associados: ${error.message}`);
      }
    }
    let addedStudents = 0;
    const studentNames = parseStudentNames(bulkStudentNames);
    if (classId && studentNames.length > 0) {
      const { data: existing, error: existingErr } = await supabase
        .from("students")
        .select("nome")
        .eq("class_id", classId);
      if (existingErr) return toast.error(existingErr.message);

      const existingNames = new Set(
        ((existing ?? []) as Array<{ nome: string }>)
          .map((student) => student.nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR")),
      );
      const newStudents = studentNames
        .filter((name) => !existingNames.has(name.toLocaleLowerCase("pt-BR")))
        .map((nome) => ({ nome, class_id: classId }));

      if (newStudents.length > 0) {
        const { error: studentsErr } = await supabase.from("students").insert(newStudents);
        if (studentsErr) return toast.error(studentsErr.message);
        addedStudents = newStudents.length;
      }
    }
    toast.success(editing.id ? "Turma atualizada" : "Turma criada", {
      description: addedStudents > 0 ? `${addedStudents} aluno(s) adicionado(s).` : undefined,
    });
    closeEditor();
    refresh();
  };

  const toggleArchive = async (c: Turma) => {
    const { error } = await sb.from("classes").update({ arquivada: !c.arquivada }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.arquivada ? "Turma reativada" : "Turma arquivada");
    refresh();
  };
  const remove = async (c: Turma) => {
    if (!confirm(`Excluir definitivamente "${c.nome}"? Alunos vinculados também serão removidos.`)) return;
    const { error } = await sb.from("classes").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Turma excluída");
    refresh();
  };

  const list = classes.filter((c) => showArchived ? c.arquivada : !c.arquivada);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestão de turmas</CardTitle>
          <CardDescription>Cadastre, edite, arquive ou exclua turmas. Cada turma pertence a um ano escolar.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            <Label>Arquivadas</Label>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova turma</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : list.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma turma {showArchived ? "arquivada" : "ativa"}.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Ano</TableHead><TableHead>Regente</TableHead>
              <TableHead>Professores</TableHead><TableHead>Alunos</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.map((c) => {
                const y = c.school_year_id ? yearsById[c.school_year_id] : null;
                const regente = c.professor_regente_id ? profileById[c.professor_regente_id] : null;
                const cts = classTeachers.filter((t) => t.class_id === c.id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-sm">{y ? y.nome : <span className="text-amber-700">—</span>}</TableCell>
                    <TableCell className="text-sm">{regente?.nome ?? "—"}</TableCell>
                    <TableCell className="text-sm">{cts.length ? cts.map((t) => profileById[t.user_id]?.nome).filter(Boolean).join(", ") : "—"}</TableCell>
                    <TableCell className="text-sm">{studentCounts[c.id] ?? 0}</TableCell>
                    <TableCell>{c.arquivada ? <Badge variant="outline">Arquivada</Badge> : <Badge variant="secondary">Ativa</Badge>}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleArchive(c)}>{c.arquivada ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(c)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && closeEditor()}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "Editar turma" : "Nova turma"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ano escolar</Label>
                    <Select value={editing.school_year_id ?? ""} onValueChange={(v) => {
                      const y = yearsById[v];
                      const letra = (editing.letra ?? "").trim().toUpperCase();
                      setEditing({ ...editing, school_year_id: v, nome: y ? `${y.codigo}${letra}` : editing.nome });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.nome} · {SEGMENT_LABELS[y.segmento]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Letra</Label>
                    <Input value={editing.letra ?? ""} maxLength={3} onChange={(e) => {
                      const letra = e.target.value.toUpperCase();
                      const y = editing.school_year_id ? yearsById[editing.school_year_id] : null;
                      setEditing({ ...editing, letra, nome: y ? `${y.codigo}${letra}` : editing.nome });
                    }} placeholder="A" />
                  </div>
                </div>
                <div>
                  <Label>Nome da turma</Label>
                  <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="K4B, Y3C…" />
                </div>
                <div>
                  <Label>Professor regente</Label>
                  <Select value={editing.professor_regente_id ?? user?.id ?? ""} onValueChange={(v) => setEditing({ ...editing, professor_regente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{p.cargo ? ` · ${p.cargo}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Professores associados</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-auto border rounded p-2">
                    {profiles.filter((p) => p.id !== editing.professor_regente_id).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={editAssoc.includes(p.id)} onCheckedChange={(v) =>
                          setEditAssoc((prev) => v ? [...prev, p.id] : prev.filter((x) => x !== p.id))} />
                        {p.nome}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Alunos</Label>
                  <textarea
                    value={bulkStudentNames}
                    onChange={(e) => setBulkStudentNames(e.target.value)}
                    rows={7}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={"Cole a lista de alunos aqui, um nome por linha.\nExemplo:\nAna Silva\nBruno Santos\nCarla Oliveira"}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ao salvar, apenas nomes novos serão adicionados à turma.
                  </p>
                </div>
                <div className="flex items-center gap-2"><Switch checked={!!editing.arquivada} onCheckedChange={(v) => setEditing({ ...editing, arquivada: v })} /><Label>Arquivada</Label></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeEditor}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/* ===========================================================
   5. EQUIPE — convites de gestão (diretoras / coordenadoras)
   =========================================================== */
function TeamTab() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [coordSegs, setCoordSegs] = useState<CoordSeg[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("coordenador");
  const [segmento, setSegmento] = useState<SchoolSegment | "">("");

  const refresh = async () => {
    setLoading(true);
    const [inv, prof, cs, ur] = await Promise.all([
      sb.from("invitations").select("*").in("role", ["diretora", "coordenador"]).order("created_at", { ascending: false }),
      sb.from("profiles").select("id, nome, email, cargo, ativo"),
      sb.from("coordinator_segments").select("*"),
      sb.from("user_roles").select("user_id, role"),
    ]);
    setInvites((inv.data ?? []) as Invitation[]);
    setProfiles((prof.data ?? []) as ProfileLite[]);
    setCoordSegs((cs.data ?? []) as CoordSeg[]);
    const m: Record<string, AppRole[]> = {};
    for (const r of (ur.data ?? []) as Array<{ user_id: string; role: AppRole }>) (m[r.user_id] ||= []).push(r.role);
    setRolesMap(m);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const send = async () => {
    if (!email.trim()) return toast.error("Informe o e-mail");
    if (role === "coordenador" && !segmento) return toast.error("Selecione o segmento");
    const { data, error } = await sb.from("invitations").insert({
      email: email.trim().toLowerCase(),
      role,
      segmento: role === "coordenador" ? segmento : null,
      anos: null,
      invited_by: user!.id,
    }).select().single();
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/login?invite=${data.token}`;
    await navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Convite criado", { description: "Link copiado." });
    setEmail(""); setSegmento("");
    refresh();
  };

  const copyLink = (t: string) => {
    const url = `${window.location.origin}/login?invite=${t}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Link copiado");
  };

  const usersByRole = (r: AppRole) => profiles.filter((p) => (rolesMap[p.id] ?? []).includes(r));

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Convidar gestão</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div>
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diretora">Diretor(a)</SelectItem>
                <SelectItem value="coordenador">Coordenador(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "coordenador" && (
            <div>
              <Label>Segmento</Label>
              <Select value={segmento} onValueChange={(v) => setSegmento(v as SchoolSegment)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{SEGMENT_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={send} className="w-full"><Mail className="h-4 w-4 mr-2" /> Gerar convite</Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Convites pendentes</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>E-mail</TableHead><TableHead>Papel</TableHead><TableHead>Segmento</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {invites.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.email}</TableCell>
                      <TableCell><Badge variant="outline">{ROLE_LABELS[i.role]}</Badge></TableCell>
                      <TableCell className="text-sm">{i.segmento ? SEGMENT_LABELS[i.segmento] : "—"}</TableCell>
                      <TableCell>
                        {i.accepted_at ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Aceito</Badge>
                          : new Date(i.expires_at) < new Date() ? <Badge variant="destructive">Expirado</Badge>
                          : <Badge variant="secondary">Pendente</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!i.accepted_at && <Button variant="outline" size="sm" onClick={() => copyLink(i.token)}><Copy className="h-3 w-3" /></Button>}
                        <Button variant="ghost" size="sm" onClick={async () => { await sb.from("invitations").delete().eq("id", i.id); refresh(); }}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Equipe atual</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <RoleSection icon={<ShieldCheck className="h-4 w-4" />} title="Diretoras" users={usersByRole("diretora")} />
            <RoleSection
              icon={<Library className="h-4 w-4" />}
              title="Coordenadoras"
              users={usersByRole("coordenador")}
              extras={(u) => {
                const segs = coordSegs.filter((c) => c.user_id === u.id).map((c) => SEGMENT_LABELS[c.segmento]);
                return segs.length ? segs.join(", ") : "sem segmento";
              }}
            />
            <RoleSection icon={<GraduationCap className="h-4 w-4" />} title="Professores" users={usersByRole("professor")} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleSection({ icon, title, users, extras }: {
  icon: React.ReactNode; title: string; users: ProfileLite[]; extras?: (u: ProfileLite) => string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        {icon} {title} <span className="text-muted-foreground">({users.length})</span>
      </div>
      {users.length === 0 ? <p className="text-xs text-muted-foreground">Ninguém ainda.</p> : (
        <ul className="text-sm space-y-1">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between border-b py-1.5">
              <span><span className="font-medium">{u.nome}</span> <span className="text-muted-foreground">· {u.email}</span></span>
              {extras && <span className="text-xs text-muted-foreground">{extras(u)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Mail, Trash2, UserPlus, ShieldCheck, GraduationCap, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin, useIsDiretora, useIsCoordenador } from "@/hooks/useAuth";
import {
  ALL_EVIDENCE_TYPES,
  EVIDENCE_DESCRIPTIONS,
  EVIDENCE_LABELS,
  ROLE_LABELS,
  SEGMENT_LABELS,
  YEAR_LABELS,
  YEARS_BY_SEGMENT,
  type AppRole,
  type EvidenceType,
  type SchoolSegment,
  type SchoolYear,
} from "@/lib/school-config";

export const Route = createFileRoute("/configuracoes/")({ component: ConfiguracoesPage });

type Invitation = {
  id: string;
  email: string;
  role: AppRole;
  segmento: SchoolSegment | null;
  anos: SchoolYear[] | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type CoordSeg = { id: string; user_id: string; segmento: SchoolSegment };
type TeacherYear = { id: string; user_id: string; segmento: SchoolSegment; ano: SchoolYear };
type Requirement = {
  id: string;
  segmento: SchoolSegment;
  ano: SchoolYear;
  evidence_type: EvidenceType;
  obrigatorio: boolean;
  descricao: string | null;
};
type ProfileLite = { id: string; nome: string; email: string };

function ConfiguracoesPage() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const isDiretora = useIsDiretora();
  const isCoord = useIsCoordenador();
  const canManageTeam = isAdmin || isDiretora;

  if (loading) return null;
  if (!user) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>Faça login para acessar as configurações.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">Entrar</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const defaultTab = canManageTeam ? "equipe" : isCoord ? "exigencias" : "meus-anos";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Configurações</p>
          <h1 className="text-3xl font-bold mt-1">Gestão da escola</h1>
          <p className="text-muted-foreground">
            Convide a equipe, associe coordenadoras a segmentos, professores a anos e configure as evidências exigidas.
          </p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex-wrap h-auto">
            {canManageTeam && <TabsTrigger value="equipe">Equipe</TabsTrigger>}
            {(canManageTeam || isCoord) && <TabsTrigger value="segmento">Meu segmento</TabsTrigger>}
            {(canManageTeam || isCoord) && <TabsTrigger value="exigencias">Exigências por ano</TabsTrigger>}
            <TabsTrigger value="meus-anos">Meus anos</TabsTrigger>
          </TabsList>

          {canManageTeam && (
            <TabsContent value="equipe" className="mt-6">
              <EquipeTab />
            </TabsContent>
          )}
          {(canManageTeam || isCoord) && (
            <TabsContent value="segmento" className="mt-6">
              <SegmentoTab />
            </TabsContent>
          )}
          {(canManageTeam || isCoord) && (
            <TabsContent value="exigencias" className="mt-6">
              <ExigenciasTab />
            </TabsContent>
          )}
          <TabsContent value="meus-anos" className="mt-6">
            <MeusAnosTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

/* ============== EQUIPE ============== */
function EquipeTab() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [coordSegs, setCoordSegs] = useState<CoordSeg[]>([]);
  const [teacherYears, setTeacherYears] = useState<TeacherYear[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);

  // Invite form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("professor");
  const [segmento, setSegmento] = useState<SchoolSegment | "">("");
  const [anos, setAnos] = useState<SchoolYear[]>([]);
  const [sending, setSending] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [inv, prof, cs, ty, ur] = await Promise.all([
      (supabase.from("invitations" as any).select("*").order("created_at", { ascending: false })),
      supabase.from("profiles").select("id, nome, email"),
      (supabase.from("coordinator_segments" as any).select("*")),
      (supabase.from("teacher_years" as any).select("*")),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setInvites(((inv as any).data ?? []) as Invitation[]);
    setProfiles((prof.data ?? []) as ProfileLite[]);
    setCoordSegs(((cs as any).data ?? []) as CoordSeg[]);
    setTeacherYears(((ty as any).data ?? []) as TeacherYear[]);
    const map: Record<string, AppRole[]> = {};
    for (const r of (ur.data ?? []) as Array<{ user_id: string; role: AppRole }>) {
      (map[r.user_id] ||= []).push(r.role);
    }
    setRoles(map);
    setLoading(false);
  };
  useEffect(() => {
    refresh();
  }, []);

  const sendInvite = async () => {
    if (!email.trim()) return toast.error("Informe o e-mail");
    if (role === "coordenador" && !segmento) return toast.error("Selecione o segmento");
    if (role === "professor" && (!segmento || anos.length === 0))
      return toast.error("Selecione segmento e ao menos um ano");
    setSending(true);
    const { data, error } = await (supabase.from("invitations" as any).insert({
      email: email.trim().toLowerCase(),
      role,
      segmento: segmento || null,
      anos: role === "professor" ? anos : null,
      invited_by: user!.id,
    }).select().single());
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Convite criado");
    setEmail("");
    setSegmento("");
    setAnos([]);
    setRole("professor");
    await refresh();
    const inviteUrl = inviteLink((data as any).token);
    await navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    toast.message("Link copiado para a área de transferência", { description: inviteUrl });
  };

  const deleteInvite = async (id: string) => {
    const { error } = await (supabase.from("invitations" as any).delete().eq("id", id));
    if (error) return toast.error(error.message);
    toast.success("Convite removido");
    refresh();
  };

  const copyLink = (token: string) => {
    const url = inviteLink(token);
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Link copiado", { description: url });
  };

  const usersByRole = (r: AppRole) =>
    profiles.filter((p) => (roles[p.id] ?? []).includes(r));

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Convidar pessoa</CardTitle>
          <CardDescription>Diretoras e coordenadoras se cadastram pelo link de convite.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@escola.com.br" />
          </div>
          <div>
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diretora">Diretor(a)</SelectItem>
                <SelectItem value="coordenador">Coordenador(a)</SelectItem>
                <SelectItem value="professor">Professor(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(role === "coordenador" || role === "professor") && (
            <div>
              <Label>Segmento</Label>
              <Select value={segmento} onValueChange={(v) => { setSegmento(v as SchoolSegment); setAnos([]); }}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEGMENT_LABELS) as SchoolSegment[]).map((s) => (
                    <SelectItem key={s} value={s}>{SEGMENT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {role === "professor" && segmento && (
            <div>
              <Label className="mb-2 block">Anos atribuídos</Label>
              <div className="grid grid-cols-2 gap-2">
                {YEARS_BY_SEGMENT[segmento as SchoolSegment].map((y) => (
                  <label key={y} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={anos.includes(y)}
                      onCheckedChange={(c) =>
                        setAnos((prev) => (c ? [...prev, y] : prev.filter((x) => x !== y)))
                      }
                    />
                    {YEAR_LABELS[y]}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button onClick={sendInvite} disabled={sending} className="w-full">
            <Mail className="h-4 w-4 mr-2" /> {sending ? "Criando…" : "Gerar convite"}
          </Button>
          <p className="text-xs text-muted-foreground">
            O link é copiado automaticamente. Envie por e-mail para a pessoa concluir o cadastro.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Segmento / Anos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.email}</TableCell>
                      <TableCell><Badge variant="outline">{ROLE_LABELS[i.role]}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {i.segmento ? SEGMENT_LABELS[i.segmento] : "—"}
                        {i.anos?.length ? <span className="text-muted-foreground"> · {i.anos.map((a) => YEAR_LABELS[a]).join(", ")}</span> : null}
                      </TableCell>
                      <TableCell>
                        {i.accepted_at ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Aceito</Badge>
                        ) : new Date(i.expires_at) < new Date() ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!i.accepted_at && (
                          <Button variant="outline" size="sm" onClick={() => copyLink(i.token)}>
                            <Copy className="h-3 w-3 mr-1" /> Link
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteInvite(i.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipe atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RoleSection
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Diretoras"
              users={usersByRole("diretora")}
            />
            <RoleSection
              icon={<Library className="h-4 w-4" />}
              title="Coordenadoras"
              users={usersByRole("coordenador")}
              extras={(u) => {
                const segs = coordSegs.filter((c) => c.user_id === u.id).map((c) => SEGMENT_LABELS[c.segmento]);
                return segs.length ? segs.join(", ") : "sem segmento";
              }}
            />
            <RoleSection
              icon={<GraduationCap className="h-4 w-4" />}
              title="Professoras"
              users={usersByRole("professor")}
              extras={(u) => {
                const ys = teacherYears.filter((t) => t.user_id === u.id);
                return ys.length ? ys.map((y) => YEAR_LABELS[y.ano]).join(", ") : "sem ano";
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleSection({
  icon, title, users, extras,
}: { icon: React.ReactNode; title: string; users: ProfileLite[]; extras?: (u: ProfileLite) => string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        {icon} {title} <span className="text-muted-foreground">({users.length})</span>
      </div>
      {users.length === 0 ? (
        <p className="text-xs text-muted-foreground">Ninguém ainda.</p>
      ) : (
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

function inviteLink(token: string) {
  return `${window.location.origin}/login?invite=${token}`;
}

/* ============== SEGMENTO (coordenador) ============== */
function SegmentoTab() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const isDiretora = useIsDiretora();
  const [coordSegs, setCoordSegs] = useState<CoordSeg[]>([]);
  const [teacherYears, setTeacherYears] = useState<TeacherYear[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [cs, ty, pr] = await Promise.all([
      (supabase.from("coordinator_segments" as any).select("*")),
      (supabase.from("teacher_years" as any).select("*")),
      supabase.from("profiles").select("id, nome, email"),
    ]);
    setCoordSegs(((cs as any).data ?? []) as CoordSeg[]);
    setTeacherYears(((ty as any).data ?? []) as TeacherYear[]);
    setProfiles((pr.data ?? []) as ProfileLite[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const mySegments: SchoolSegment[] = isAdmin || isDiretora
    ? (Object.keys(SEGMENT_LABELS) as SchoolSegment[])
    : coordSegs.filter((c) => c.user_id === user?.id).map((c) => c.segmento);

  const profilesById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (mySegments.length === 0) {
    return <p className="text-muted-foreground">Você ainda não está vinculada a nenhum segmento.</p>;
  }

  return (
    <div className="space-y-6">
      {mySegments.map((seg) => {
        const years = YEARS_BY_SEGMENT[seg];
        return (
          <Card key={seg}>
            <CardHeader>
              <CardTitle>{SEGMENT_LABELS[seg]}</CardTitle>
              <CardDescription>Professores atribuídos por ano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {years.map((y) => {
                const teachers = teacherYears.filter((t) => t.ano === y);
                return (
                  <div key={y} className="border rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">{YEAR_LABELS[y]}</div>
                    {teachers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem professor atribuído.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {teachers.map((t) => (
                          <Badge key={t.id} variant="outline" className="gap-1">
                            {profilesById[t.user_id]?.nome ?? t.user_id.slice(0, 6)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ============== EXIGÊNCIAS ============== */
function ExigenciasTab() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const isDiretora = useIsDiretora();
  const [coordSegs, setCoordSegs] = useState<CoordSeg[]>([]);
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [cs, rq] = await Promise.all([
      (supabase.from("coordinator_segments" as any).select("*")),
      (supabase.from("year_evidence_requirements" as any).select("*")),
    ]);
    setCoordSegs(((cs as any).data ?? []) as CoordSeg[]);
    setReqs(((rq as any).data ?? []) as Requirement[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const mySegments: SchoolSegment[] = isAdmin || isDiretora
    ? (Object.keys(SEGMENT_LABELS) as SchoolSegment[])
    : coordSegs.filter((c) => c.user_id === user?.id).map((c) => c.segmento);

  const toggle = async (seg: SchoolSegment, ano: SchoolYear, type: EvidenceType, on: boolean) => {
    const existing = reqs.find((r) => r.segmento === seg && r.ano === ano && r.evidence_type === type);
    if (on) {
      if (existing) return;
      const { error } = await (supabase.from("year_evidence_requirements" as any).insert({
        segmento: seg, ano, evidence_type: type, obrigatorio: true, created_by: user!.id,
      }));
      if (error) return toast.error(error.message);
    } else {
      if (!existing) return;
      const { error } = await (supabase.from("year_evidence_requirements" as any).delete().eq("id", existing.id));
      if (error) return toast.error(error.message);
    }
    refresh();
  };

  const setDescricao = async (req: Requirement, val: string) => {
    const { error } = await (supabase.from("year_evidence_requirements" as any).update({ descricao: val }).eq("id", req.id));
    if (error) toast.error(error.message);
  };

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (mySegments.length === 0) return <p className="text-muted-foreground">Sem segmento atribuído.</p>;

  return (
    <div className="space-y-6">
      {mySegments.map((seg) => (
        <Card key={seg}>
          <CardHeader>
            <CardTitle>{SEGMENT_LABELS[seg]}</CardTitle>
            <CardDescription>Para cada ano, marque os tipos de evidência exigidos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {YEARS_BY_SEGMENT[seg].map((y) => (
              <div key={y} className="border rounded-lg p-4">
                <div className="font-semibold mb-3">{YEAR_LABELS[y]}</div>
                <div className="space-y-3">
                  {ALL_EVIDENCE_TYPES.map((t) => {
                    const r = reqs.find((x) => x.segmento === seg && x.ano === y && x.evidence_type === t);
                    const on = !!r;
                    return (
                      <div key={t} className="flex gap-3 items-start">
                        <Checkbox checked={on} onCheckedChange={(c) => toggle(seg, y, t, !!c)} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{EVIDENCE_LABELS[t]}</div>
                          <div className="text-xs text-muted-foreground">{EVIDENCE_DESCRIPTIONS[t]}</div>
                          {on && (
                            <Textarea
                              className="mt-2"
                              placeholder="Orientação ao professor (opcional)"
                              defaultValue={r?.descricao ?? ""}
                              onBlur={(e) => r && setDescricao(r, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============== MEUS ANOS (professor) ============== */
function MeusAnosTab() {
  const { user } = useAuth();
  const [years, setYears] = useState<TeacherYear[]>([]);
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ty, rq] = await Promise.all([
        (supabase.from("teacher_years" as any).select("*").eq("user_id", user!.id)),
        (supabase.from("year_evidence_requirements" as any).select("*")),
      ]);
      setYears(((ty as any).data ?? []) as TeacherYear[]);
      setReqs(((rq as any).data ?? []) as Requirement[]);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (years.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem anos atribuídos</CardTitle>
          <CardDescription>Peça à coordenadora do seu segmento para te vincular a um ano.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {years.map((y) => {
        const yr = reqs.filter((r) => r.segmento === y.segmento && r.ano === y.ano);
        return (
          <Card key={y.id}>
            <CardHeader>
              <CardTitle className="text-base">{YEAR_LABELS[y.ano]}</CardTitle>
              <CardDescription>{SEGMENT_LABELS[y.segmento]}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-medium text-muted-foreground mb-2">Evidências exigidas</div>
              {yr.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma exigência cadastrada para esse ano ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {yr.map((r) => (
                    <li key={r.id} className="text-sm">
                      <div className="font-medium">{EVIDENCE_LABELS[r.evidence_type]}</div>
                      {r.descricao && <div className="text-xs text-muted-foreground">{r.descricao}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

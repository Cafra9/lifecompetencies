import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { competencyColor, LEVEL_LABEL, LEVEL_VALUE } from "@/lib/competencies";
import { ArrowLeft, Upload, Download, Eye, Trash2, Plus, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { exportStudentReport } from "@/lib/pdf";
import { EvidenceUploadDialog } from "@/components/EvidenceUploadDialog";
import { analisarEvidenciaAluno } from "@/lib/evidence-analysis.functions";

export const Route = createFileRoute("/alunos/$id")({ component: () => <AppLayout><AlunoDetalhe /></AppLayout> });

function AlunoDetalhe() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [skillId, setSkillId] = useState<string>("");
  const [nivel, setNivel] = useState<string>("proficiente");
  const [obs, setObs] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);



  const sb = supabase as any;
  const { data: aluno } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => (await supabase.from("students").select("*, classes(nome, segmento, school_year_id)").eq("id", id).maybeSingle()).data,
  });
  const schoolYearId = (aluno as any)?.classes?.school_year_id ?? null;
  const { data: comps } = useQuery({
    queryKey: ["competencies-with-skills"],
    queryFn: async () => (await supabase.from("competencies").select("*, skills(*)").order("ordem")).data ?? [],
  });
  const { data: avals } = useQuery({
    queryKey: ["assessments", id],
    queryFn: async () => (await supabase.from("assessments").select("*, skills(nome, competency_id, competencies(slug, nome))").eq("student_id", id).order("data", { ascending: false })).data ?? [],
  });
  const { data: yearReqs } = useQuery({
    queryKey: ["year-reqs", schoolYearId],
    enabled: !!schoolYearId,
    queryFn: async () =>
      (await sb.from("year_requirements")
        .select("id, obrigatorio, orientacao, requirement:evidence_requirements(id, slug, nome, descricao, ativo)")
        .eq("school_year_id", schoolYearId)).data ?? [],
  });
  const { data: studentEvidences } = useQuery({
    queryKey: ["student-evidences", id],
    queryFn: async () =>
      (await sb
        .from("student_evidences")
        .select("*, requirement:evidence_requirements(nome, slug)")
        .eq("student_id", id)
        .order("created_at", { ascending: false })).data ?? [],
  });

  const radar = useMemo(() => {
    if (!comps || !avals) return [];
    return comps.map((c: any) => {
      const skillIds = c.skills?.map((s: any) => s.id) ?? [];
      const items = avals.filter((a: any) => skillIds.includes(a.skill_id));
      const avg = items.length ? items.reduce((s: number, a: any) => s + (LEVEL_VALUE[a.nivel] || 0), 0) / items.length : 0;
      return { competencia: c.nome.replace("Competência ", ""), valor: Number(avg.toFixed(2)) };
    });
  }, [comps, avals]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !skillId) return;
    setBusy(true);
    let evidence_url: string | null = null;
    if (file) {
      const path = `${user.id}/${id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("assessment-evidences").upload(path, file);
      if (upErr) { toast.error(upErr.message); setBusy(false); return; }
      evidence_url = path;
    }
    const { error } = await supabase.from("assessments").insert({
      student_id: id, skill_id: skillId, nivel: nivel as any, observacao: obs || null, evidence_url, created_by: user.id,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Avaliação registrada"); setSkillId(""); setObs(""); setFile(null); qc.invalidateQueries({ queryKey: ["assessments", id] }); }
  }




  function gerarPDF() {
    if (!aluno || !avals) return;
    exportStudentReport({
      aluno: aluno.nome,
      turma: aluno.classes?.nome || "",
      radar,
      avals: avals.map((a: any) => ({
        habilidade: a.skills?.nome || "",
        competencia: a.skills?.competencies?.nome || "",
        nivel: LEVEL_LABEL[a.nivel],
        data: a.data,
        observacao: a.observacao || "",
      })),
    });
  }

  if (!aluno) return <div>Carregando…</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/turmas">  <ArrowLeft className="h-4 w-4 mr-1" /> Turmas</Link></Button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{aluno.nome}</h1>
          <p className="text-muted-foreground">{aluno.classes?.nome}</p>
        </div>
        <Button onClick={gerarPDF} variant="outline"><Download className="h-4 w-4 mr-2" /> Relatório PDF</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Radar de Competências</CardTitle><CardDescription>Média de níveis por competência (1–4)</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
                <Radar dataKey="valor" stroke="hsl(var(--color-primary))" fill="var(--color-primary)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Nova avaliação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={salvar} className="space-y-3">
              <div>
                <Label>Habilidade</Label>
                <Select value={skillId} onValueChange={setSkillId}>
                  <SelectTrigger><SelectValue placeholder="Escolha uma habilidade" /></SelectTrigger>
                  <SelectContent>
                    {comps?.map((c: any) => (
                      <div key={c.id}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{c.nome}</div>
                        {c.skills?.sort((a: any, b: any) => a.ordem - b.ordem).map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível</Label>
                <Select value={nivel} onValueChange={setNivel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEVEL_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observação</Label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Evidência (opcional)</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={busy || !skillId} className="w-full">
                {busy ? "Salvando..." : <><Upload className="h-4 w-4 mr-2" /> Registrar avaliação</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <StudentEvidencesCard
        studentId={id}
        yearReqs={(yearReqs as any[] | undefined) ?? []}
        evidences={(studentEvidences as any[] | undefined) ?? []}
      />



      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {avals?.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma avaliação registrada ainda.</div>
          ) : (
            <div className="space-y-2">
              {avals?.map((a: any) => {
                const col = competencyColor(a.skills?.competencies?.slug);
                return (
                  <div key={a.id} className="flex items-start gap-3 border rounded-lg p-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${col.bg}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{a.skills?.nome}</div>
                        <div className="text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{a.skills?.competencies?.nome} · {LEVEL_LABEL[a.nivel]}</div>
                      {a.observacao && <p className="text-sm mt-1">{a.observacao}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const ANALYSIS_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "border-slate-300 text-slate-700 bg-slate-50 dark:text-slate-300 dark:bg-slate-900/40",
  },
  analyzing: {
    label: "Analisando",
    className: "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40",
  },
  analyzed: {
    label: "Analisada",
    className: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40",
  },
  error: {
    label: "Erro",
    className: "border-red-300 text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40",
  },
  skipped: {
    label: "Ignorada",
    className: "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40",
  },
};

function analysisMeta(status: string | null | undefined) {
  return ANALYSIS_STATUS_META[status || "pending"] ?? ANALYSIS_STATUS_META.pending;
}

function StudentEvidencesCard({
  studentId,
  yearReqs,
  evidences,
}: {
  studentId: string;
  yearReqs: any[];
  evidences: any[];
}) {
  const qc = useQueryClient();
  const sb = supabase as any;
  const { user, session, roles } = useAuth();
  const analisar = useServerFn(analisarEvidenciaAluno);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  const creatorIds = useMemo(() => [...new Set(evidences.map((e) => e.created_by).filter(Boolean))], [evidences]);
  const { data: profs } = useQuery({
    queryKey: ["evidence-profs", creatorIds.join(",")],
    enabled: creatorIds.length > 0,
    queryFn: async () => (await supabase.from("profiles").select("id, nome").in("id", creatorIds)).data ?? [],
  });
  const profById = useMemo(
    () => Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.nome])),
    [profs],
  );

  const fulfilledReqIds = useMemo(
    () => new Set(evidences.map((e) => e.requirement_id).filter(Boolean)),
    [evidences],
  );

  async function openFile(path: string, download = false) {
    const { data, error } = await supabase.storage
      .from("student-evidences")
      .createSignedUrl(path, 60 * 10, download ? { download: true } : undefined);
    if (error || !data?.signedUrl) return toast.error("Não foi possível abrir o arquivo");
    window.open(data.signedUrl, "_blank");
  }

  async function deleteEvidence(ev: any) {
    if (!confirm(`Excluir "${ev.titulo}"?`)) return;
    if (ev.arquivo_url) {
      await supabase.storage.from("student-evidences").remove([ev.arquivo_url]);
    }
    const { error } = await sb.from("student_evidences").delete().eq("id", ev.id);
    if (error) return toast.error(error.message);
    toast.success("Evidência removida");
    qc.invalidateQueries({ queryKey: ["student-evidences", studentId] });
    qc.invalidateQueries({ queryKey: ["class-evidences"] });
  }

  async function reanalyzeEvidence(ev: any) {
    if (!user || !session) return;
    setReanalyzingId(ev.id);
    try {
      const res = await analisar({ data: { evidenceId: ev.id, accessToken: session.access_token } });
      if (res.status === "analyzed") toast.success("Evidência reanalisada.");
      else if (res.error) toast.warning(res.error);
      else toast.info("Reanálise concluída.");
      qc.invalidateQueries({ queryKey: ["student-evidences", studentId] });
      qc.invalidateQueries({ queryKey: ["class-evidences"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao reanalisar evidência");
    } finally {
      setReanalyzingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Evidências do Aluno</CardTitle>
          <CardDescription>Arquivos disponíveis para o relatório de Competências para a Vida</CardDescription>
        </div>
        <EvidenceUploadDialog
          studentId={studentId}
          trigger={<Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Evidência</Button>}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {yearReqs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {yearReqs.map((yr) => {
              const r = yr.requirement;
              if (!r) return null;
              const ok = fulfilledReqIds.has(r.id);
              const obrig = yr.obrigatorio;
              return (
                <span
                  key={yr.id}
                  className={`text-xs px-2 py-1 rounded border ${
                    ok
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
                      : obrig
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
                        : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {ok ? "✓" : obrig ? "⚠" : "○"} {r.nome}{obrig ? " *" : ""}
                </span>
              );
            })}
          </div>
        )}

        {evidences.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma evidência enviada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {evidences.map((e) => {
              const meta = analysisMeta(e.analysis_status);
              const canReanalyze =
                e.created_by === user?.id ||
                roles.some((r) => r === "admin" || r === "diretora" || r === "coordenador");
              const canDelete =
                e.created_by === user?.id ||
                roles.some((r) => r === "admin" || r === "diretora");
              const category = e.requirement?.nome ?? String(e.evidence_type).replace(/_/g, " ");
              return (
              <div key={e.id} className="border rounded-lg p-3 text-sm flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium">{e.titulo}</div>
                    <Badge variant="outline" className={`text-[10px] ${meta.className}`}>
                      IA: {meta.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                    <span className="capitalize">{category}</span>
                    <span>· {new Date(e.created_at).toLocaleDateString("pt-BR")}</span>
                    {profById[e.created_by] && <span>· {profById[e.created_by]}</span>}
                    {e.periodo && <span>· {e.periodo}</span>}
                  </div>
                  {e.descricao && <div className="text-xs text-muted-foreground mt-1">{e.descricao}</div>}
                  {e.analysis_summary && (
                    <div className="text-xs mt-2 rounded-md bg-muted/50 p-2 text-muted-foreground line-clamp-3">
                      {e.analysis_summary}
                    </div>
                  )}
                  {e.analysis_error && (
                    <div className="text-xs mt-2 text-amber-700 dark:text-amber-300">
                      {e.analysis_error}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canReanalyze && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => reanalyzeEvidence(e)}
                      title="Reanalisar"
                      disabled={reanalyzingId === e.id}
                    >
                      {reanalyzingId === e.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {e.arquivo_url && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => openFile(e.arquivo_url)} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openFile(e.arquivo_url, true)} title="Baixar">
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button size="icon" variant="ghost" onClick={() => deleteEvidence(e)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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

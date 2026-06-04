import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { competencyColor, LEVEL_LABEL, LEVEL_VALUE } from "@/lib/competencies";
import { ArrowLeft, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { exportStudentReport } from "@/lib/pdf";

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
  // Evidência (vinculada a year_requirements)
  const [evReqId, setEvReqId] = useState<string>("");
  const [evTitulo, setEvTitulo] = useState("");
  const [evDescricao, setEvDescricao] = useState("");
  const [evNota, setEvNota] = useState("");
  const [evPeriodo, setEvPeriodo] = useState("");
  const [evFile, setEvFile] = useState<File | null>(null);
  const [evBusy, setEvBusy] = useState(false);

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
    queryFn: async () => (await sb.from("student_evidences").select("*").eq("student_id", id).order("created_at", { ascending: false })).data ?? [],
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

  // Mapear slug → enum evidence_type aceito no banco
  function slugToEvidenceType(slug: string): "rubrica" | "portfolio" | "notas" | "observacao_comportamento" {
    if (slug === "rubrica" || slug === "portfolio" || slug === "notas") return slug;
    return "observacao_comportamento";
  }

  async function salvarEvidencia(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !evReqId || !evTitulo.trim()) return;
    const req = (yearReqs as any[] | undefined)?.find((r) => r.id === evReqId || r.requirement?.id === evReqId);
    const requirement = req?.requirement ?? req;
    if (!requirement?.id) return toast.error("Exigência inválida");
    setEvBusy(true);
    let arquivo_url: string | null = null;
    if (evFile) {
      const path = `${user.id}/${id}/${Date.now()}_${evFile.name}`;
      const { error: upErr } = await supabase.storage.from("student-evidences").upload(path, evFile);
      if (upErr) { toast.error(upErr.message); setEvBusy(false); return; }
      arquivo_url = path;
    }
    const { error } = await sb.from("student_evidences").insert({
      student_id: id,
      created_by: user.id,
      requirement_id: requirement.id,
      evidence_type: slugToEvidenceType(requirement.slug),
      titulo: evTitulo.trim(),
      descricao: evDescricao || null,
      nota: evNota ? Number(evNota) : null,
      periodo: evPeriodo || null,
      arquivo_url,
    });
    setEvBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Evidência registrada");
    setEvReqId(""); setEvTitulo(""); setEvDescricao(""); setEvNota(""); setEvPeriodo(""); setEvFile(null);
    qc.invalidateQueries({ queryKey: ["student-evidences", id] });
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

      <Card>
        <CardHeader>
          <CardTitle>Evidências por exigência</CardTitle>
          <CardDescription>
            {schoolYearId
              ? `Apenas exigências cadastradas para o ano da turma deste aluno.`
              : `Vincule um ano escolar à turma em /turmas para liberar a captura.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!schoolYearId ? (
            <p className="text-sm text-muted-foreground">Turma sem ano escolar definido.</p>
          ) : (yearReqs as any[] | undefined)?.length ? (
            <form onSubmit={salvarEvidencia} className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Exigência</Label>
                <Select value={evReqId} onValueChange={setEvReqId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a exigência" /></SelectTrigger>
                  <SelectContent>
                    {(yearReqs as any[]).map((yr) => {
                      const r = yr.requirement;
                      if (!r?.ativo) return null;
                      return (
                        <SelectItem key={r.id} value={r.id}>
                          {r.nome}{yr.obrigatorio ? " *" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {evReqId && (() => {
                  const yr = (yearReqs as any[]).find((y) => y.requirement?.id === evReqId);
                  return yr?.orientacao ? <p className="text-xs text-muted-foreground mt-1">{yr.orientacao}</p> : null;
                })()}
              </div>
              <div className="md:col-span-2">
                <Label>Título</Label>
                <Input value={evTitulo} onChange={(e) => setEvTitulo(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea value={evDescricao} onChange={(e) => setEvDescricao(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Período (opcional)</Label>
                <Input value={evPeriodo} onChange={(e) => setEvPeriodo(e.target.value)} placeholder="ex.: 1º trimestre" />
              </div>
              <div>
                <Label>Nota (opcional)</Label>
                <Input type="number" step="0.1" value={evNota} onChange={(e) => setEvNota(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Arquivo (opcional)</Label>
                <Input type="file" onChange={(e) => setEvFile(e.target.files?.[0] || null)} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={evBusy || !evReqId || !evTitulo.trim()}>
                  {evBusy ? "Salvando..." : <><Upload className="h-4 w-4 mr-2" /> Registrar evidência</>}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma exigência cadastrada para este ano em Configurações.</p>
          )}

          {(studentEvidences as any[] | undefined)?.length ? (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registradas</p>
              {(studentEvidences as any[]).map((e) => (
                <div key={e.id} className="border rounded-lg p-3 text-sm flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{e.titulo}</div>
                    {e.descricao && <div className="text-xs text-muted-foreground">{e.descricao}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    {e.periodo && <div>{e.periodo}</div>}
                    {e.nota != null && <div>Nota: {e.nota}</div>}
                    <div>{new Date(e.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>



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

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COMPETENCIA_CORES, corDaCompetencia } from "@/lib/competencia-cores";

export const Route = createFileRoute("/relatorios/aluno/$id")({ component: RelatorioAlunoPage });

const sb = supabase as any;

type Student = { id: string; nome: string; class_id: string };
type ClassRow = { id: string; nome: string; segmento: string; professor_id: string; school_year_id: string | null };
type SchoolYear = { id: string; codigo: string; nome: string; segmento: string };
type Requirement = { id: string; slug: string; nome: string; descricao: string | null };
type YearReq = { id: string; school_year_id: string; requirement_id: string; obrigatorio: boolean; orientacao: string | null };
type Evidence = {
  id: string; student_id: string; created_by: string;
  requirement_id: string | null; evidence_type: string | null;
  competency_id: string | null; skill_id: string | null;
  titulo: string; descricao: string | null; arquivo_url: string | null;
  nota: number | null; periodo: string | null; created_at: string;
};
type StudentAssessment = { id: string; aluno_id: string; competencia: string; habilidade: string; nivel: string; user_id: string; created_at: string };
type ProfileLite = { id: string; nome: string };

function RelatorioAlunoPage() {
  const { id } = useParams({ from: "/relatorios/aluno/$id" });
  const [student, setStudent] = useState<Student | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [year, setYear] = useState<SchoolYear | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [yearReqs, setYearReqs] = useState<YearReq[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [rubrics, setRubrics] = useState<StudentAssessment[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.from("students").select("*").eq("id", id).single();
      setStudent((s as Student) ?? null);
      let yr: SchoolYear | null = null;
      let k: ClassRow | null = null;
      if (s) {
        const { data: c } = await supabase.from("classes").select("*").eq("id", (s as any).class_id).single();
        k = (c as ClassRow) ?? null;
        setKlass(k);
        if (k?.school_year_id) {
          const { data: y } = await sb.from("school_years").select("*").eq("id", k.school_year_id).single();
          yr = (y as SchoolYear) ?? null;
          setYear(yr);
        }
      }
      const [ev, ra, prof, reqs, yReqs] = await Promise.all([
        sb.from("student_evidences").select("*").eq("student_id", id).order("created_at", { ascending: false }),
        supabase.from("student_assessments").select("*").eq("aluno_id", id),
        supabase.from("profiles").select("id, nome"),
        sb.from("evidence_requirements").select("*"),
        yr ? sb.from("year_requirements").select("*").eq("school_year_id", yr.id) : Promise.resolve({ data: [] }),
      ]);
      setEvidences((ev.data ?? []) as Evidence[]);
      setRubrics((ra.data ?? []) as StudentAssessment[]);
      setProfiles((prof.data ?? []) as ProfileLite[]);
      setRequirements((reqs.data ?? []) as Requirement[]);
      setYearReqs((yReqs.data ?? []) as YearReq[]);
      setLoading(false);
    })();
  }, [id]);

  const profById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p.nome])), [profiles]);
  const reqById = useMemo(() => Object.fromEntries(requirements.map((r) => [r.id, r])), [requirements]);
  const reqBySlug = useMemo(() => Object.fromEntries(requirements.map((r) => [r.slug, r])), [requirements]);

  // Exigências ativas para o ano deste aluno
  const activeRequirements: Requirement[] = useMemo(() => {
    if (!year) return [];
    return yearReqs
      .map((yr) => reqById[yr.requirement_id])
      .filter(Boolean) as Requirement[];
  }, [yearReqs, reqById, year]);

  const teacherIds = useMemo(() => {
    const s = new Set<string>();
    rubrics.forEach((r) => s.add(r.user_id));
    evidences.forEach((e) => s.add(e.created_by));
    return [...s];
  }, [rubrics, evidences]);

  if (loading) return <AppLayout><p className="text-muted-foreground">Carregando…</p></AppLayout>;
  if (!student) return <AppLayout><p>Aluno não encontrado.</p></AppLayout>;

  // Evidências por exigência (filtra por requirement_id quando disponível, ou pelo slug em evidence_type legado)
  const evidencesByReq = (req: Requirement) =>
    evidences.filter((e) =>
      e.requirement_id === req.id || (e.requirement_id == null && e.evidence_type === req.slug)
    );

  const includesRubric = activeRequirements.some((r) => r.slug === "rubrica");
  const competencias = Object.keys(COMPETENCIA_CORES);

  // Validação: quais exigências obrigatórias estão sem registros?
  const missingRequired = activeRequirements
    .map((r) => {
      const yr = yearReqs.find((y) => y.requirement_id === r.id);
      if (!yr?.obrigatorio) return null;
      const has = r.slug === "rubrica" ? rubrics.length > 0 : evidencesByReq(r).length > 0;
      return has ? null : r;
    })
    .filter(Boolean) as Requirement[];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
              <Link to="/relatorios"><ArrowLeft className="h-4 w-4 mr-1" /> Relatórios</Link>
            </Button>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Relatório consolidado</p>
            <h1 className="text-3xl font-bold mt-1">{student.nome}</h1>
            <p className="text-muted-foreground">
              {klass ? klass.nome : "—"}{year ? ` · ${year.nome}` : ""} ·{" "}
              {teacherIds.length} {teacherIds.length === 1 ? "professor" : "professores"} envolvidos
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> Exportar / Imprimir
          </Button>
        </div>

        {!year && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Turma sem ano escolar vinculado</p>
                <p className="text-amber-800">Defina o ano em <Link to="/turmas" className="underline">Turmas</Link> para o relatório usar as exigências corretas.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {year && activeRequirements.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Nenhuma exigência cadastrada para {year.nome}</p>
                <p className="text-amber-800">Cadastre em <Link to="/configuracoes" className="underline">Configurações → Exigências por ano</Link>.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {teacherIds.map((tid) => <Badge key={tid} variant="outline">{profById[tid] ?? "Professor"}</Badge>)}
        </div>

        <Tabs defaultValue="por-exigencia">
          <TabsList>
            <TabsTrigger value="por-exigencia">Por exigência</TabsTrigger>
            {includesRubric && <TabsTrigger value="por-competencia">Por competência</TabsTrigger>}
            <TabsTrigger value="tudo">Todas as evidências ({evidences.length + rubrics.length})</TabsTrigger>
          </TabsList>

          {/* Por exigência (dinâmica) */}
          <TabsContent value="por-exigencia" className="mt-6 space-y-4">
            {activeRequirements.map((req) => {
              const items = evidencesByReq(req);
              const isRubric = req.slug === "rubrica";
              return (
                <Card key={req.id}>
                  <CardHeader>
                    <CardTitle>{req.nome}</CardTitle>
                    {req.descricao && <CardDescription>{req.descricao}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {isRubric ? (
                      rubrics.length === 0 ? <p className="text-sm text-muted-foreground">Sem rubrica registrada.</p> : (
                        <ul className="text-sm space-y-1">
                          {rubrics.map((r) => {
                            const cor = corDaCompetencia(r.competencia);
                            return (
                              <li key={r.id} className="flex justify-between border-b py-1.5">
                                <span>
                                  <span className={`font-medium ${cor.text}`}>{r.competencia}</span> · {r.habilidade}{" "}
                                  <Badge className={cor.cell[r.nivel as "iniciando" | "desenvolvendo" | "dominando"]}>{r.nivel}</Badge>
                                </span>
                                <span className="text-xs text-muted-foreground">{profById[r.user_id] ?? "—"} · {new Date(r.created_at).toLocaleDateString()}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )
                    ) : items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
                    ) : (
                      <ul className="space-y-3">
                        {items.map((e) => <EvidenceItem key={e.id} e={e} authorName={profById[e.created_by]} reqName={req.nome} />)}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Por competência — só faz sentido se rubrica está exigida */}
          {includesRubric && (
            <TabsContent value="por-competencia" className="mt-6 space-y-4">
              {competencias.map((c) => {
                const cor = corDaCompetencia(c);
                const rubricasComp = rubrics.filter((r) => r.competencia === c);
                return (
                  <Card key={c}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${cor.swatch}`} />
                        <CardTitle className={cor.text}>{c}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {rubricasComp.length === 0 ? <p className="text-sm text-muted-foreground">Sem rubrica registrada.</p> : (
                        <ul className="text-sm space-y-1">
                          {rubricasComp.map((r) => (
                            <li key={r.id} className="flex justify-between border-b py-1.5">
                              <span><span className="font-medium">{r.habilidade}</span>{" "}
                                <Badge className={cor.cell[r.nivel as "iniciando" | "desenvolvendo" | "dominando"]}>{r.nivel}</Badge>
                              </span>
                              <span className="text-xs text-muted-foreground">{profById[r.user_id] ?? "—"} · {new Date(r.created_at).toLocaleDateString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          )}

          <TabsContent value="tudo" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                {evidences.map((e) => {
                  const r = (e.requirement_id && reqById[e.requirement_id]) || (e.evidence_type && reqBySlug[e.evidence_type]) || null;
                  return <EvidenceItem key={e.id} e={e} authorName={profById[e.created_by]} reqName={r?.nome ?? "Evidência"} />;
                })}
                {rubrics.map((r) => (
                  <div key={r.id} className="border-b pb-2 text-sm">
                    <div className="font-medium">Rubrica · {r.competencia} / {r.habilidade}</div>
                    <div className="text-xs text-muted-foreground">Nível: {r.nivel} · {profById[r.user_id] ?? "—"} · {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {evidences.length + rubrics.length === 0 && <p className="text-muted-foreground text-sm">Nenhum registro.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EvidenceItem({ e, authorName, reqName }: { e: Evidence; authorName?: string; reqName: string }) {
  return (
    <li className="border-b pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{reqName}</Badge>
            <span className="font-medium text-sm">{e.titulo}</span>
            {e.periodo && <span className="text-xs text-muted-foreground">· {e.periodo}</span>}
            {e.nota != null && <Badge variant="outline">Nota: {e.nota}</Badge>}
          </div>
          {e.descricao && <p className="text-sm text-muted-foreground mt-1">{e.descricao}</p>}
        </div>
        <div className="text-right text-xs text-muted-foreground shrink-0">
          <div>{authorName ?? "—"}</div>
          <div>{new Date(e.created_at).toLocaleDateString()}</div>
          {e.arquivo_url && (
            <a href={e.arquivo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary mt-1">
              <FileText className="h-3 w-3" /> Anexo
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

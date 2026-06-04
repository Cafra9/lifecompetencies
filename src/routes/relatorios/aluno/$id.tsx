import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COMPETENCIA_CORES, corDaCompetencia } from "@/lib/competencia-cores";
import { EVIDENCE_LABELS, type EvidenceType } from "@/lib/school-config";

export const Route = createFileRoute("/relatorios/aluno/$id")({ component: RelatorioAlunoPage });

type Student = { id: string; nome: string; class_id: string };
type ClassRow = { id: string; nome: string; segmento: string; professor_id: string };
type Evidence = {
  id: string;
  student_id: string;
  created_by: string;
  evidence_type: EvidenceType;
  competency_id: string | null;
  skill_id: string | null;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  nota: number | null;
  periodo: string | null;
  created_at: string;
};
type StudentAssessment = {
  id: string;
  aluno_id: string;
  competencia: string;
  habilidade: string;
  nivel: string;
  user_id: string;
  created_at: string;
};
type ProfileLite = { id: string; nome: string };

function RelatorioAlunoPage() {
  const { id } = useParams({ from: "/relatorios/aluno/$id" });
  const [student, setStudent] = useState<Student | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [rubrics, setRubrics] = useState<StudentAssessment[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.from("students").select("*").eq("id", id).single();
      setStudent((s as Student) ?? null);
      if (s) {
        const { data: c } = await supabase.from("classes").select("*").eq("id", (s as Student).class_id).single();
        setKlass((c as ClassRow) ?? null);
      }
      const [ev, ra, prof] = await Promise.all([
        (supabase.from("student_evidences" as any).select("*").eq("student_id", id).order("created_at", { ascending: false })),
        supabase.from("student_assessments").select("*").eq("aluno_id", id),
        supabase.from("profiles").select("id, nome"),
      ]);
      setEvidences(((ev as any).data ?? []) as Evidence[]);
      setRubrics((ra.data ?? []) as any as StudentAssessment[]);
      setProfiles((prof.data ?? []) as ProfileLite[]);
      setLoading(false);
    })();
  }, [id]);

  const profById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p.nome])), [profiles]);

  const teacherIds = useMemo(() => {
    const s = new Set<string>();
    rubrics.forEach((r) => s.add(r.user_id));
    evidences.forEach((e) => s.add(e.created_by));
    return [...s];
  }, [rubrics, evidences]);

  if (loading) return <AppLayout><p className="text-muted-foreground">Carregando…</p></AppLayout>;
  if (!student) return <AppLayout><p>Aluno não encontrado.</p></AppLayout>;

  const competencias = Object.keys(COMPETENCIA_CORES);

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
              {klass ? `${klass.nome} · ${klass.segmento}` : "—"} ·{" "}
              {teacherIds.length} {teacherIds.length === 1 ? "professor" : "professores"} envolvidos
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> Exportar / Imprimir
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {teacherIds.map((tid) => (
            <Badge key={tid} variant="outline">{profById[tid] ?? "Professor"}</Badge>
          ))}
        </div>

        <Tabs defaultValue="por-competencia">
          <TabsList>
            <TabsTrigger value="por-competencia">Por competência</TabsTrigger>
            <TabsTrigger value="todas-evidencias">Todas as evidências ({evidences.length + rubrics.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="por-competencia" className="mt-6 space-y-4">
            {competencias.map((c) => {
              const cor = corDaCompetencia(c);
              const rubricasComp = rubrics.filter((r) => r.competencia === c);
              const evComp = evidences.filter((e) => {
                // Without competency_id mapping resolution, group "extras" under "Outras"
                return false;
              });
              return (
                <Card key={c}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${cor.swatch}`} />
                      <CardTitle className={cor.text}>{c}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Rubricas ({rubricasComp.length})</div>
                      {rubricasComp.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem rubrica registrada.</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {rubricasComp.map((r) => (
                            <li key={r.id} className="flex justify-between border-b py-1.5">
                              <span>
                                <span className="font-medium">{r.habilidade}</span>{" "}
                                <Badge className={cor.cell[r.nivel as "iniciando" | "desenvolvendo" | "dominando"]}>
                                  {r.nivel}
                                </Badge>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {profById[r.user_id] ?? "—"} · {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card>
              <CardHeader>
                <CardTitle>Portfólio, notas e observações</CardTitle>
                <CardDescription>Evidências enviadas pelos professores deste aluno.</CardDescription>
              </CardHeader>
              <CardContent>
                {evidences.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma evidência registrada ainda.</p>
                ) : (
                  <ul className="space-y-3">
                    {evidences.map((e) => (
                      <EvidenceItem key={e.id} e={e} authorName={profById[e.created_by]} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todas-evidencias" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                {evidences.map((e) => (
                  <EvidenceItem key={e.id} e={e} authorName={profById[e.created_by]} />
                ))}
                {rubrics.map((r) => (
                  <div key={r.id} className="border-b pb-2 text-sm">
                    <div className="font-medium">Rubrica · {r.competencia} / {r.habilidade}</div>
                    <div className="text-xs text-muted-foreground">
                      Nível: {r.nivel} · {profById[r.user_id] ?? "—"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {evidences.length + rubrics.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum registro.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EvidenceItem({ e, authorName }: { e: Evidence; authorName?: string }) {
  return (
    <li className="border-b pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{EVIDENCE_LABELS[e.evidence_type]}</Badge>
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

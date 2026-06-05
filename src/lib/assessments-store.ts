import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Nivel, NivelOuNA } from "@/lib/rubrica-infantil";

export type AssessmentMap = Record<string, NivelOuNA>; // `${competencia}::${habilidade}` -> nivel
export type JustificativaMap = Record<string, string>; // mesma chave -> justificativa (apenas para nao_aplica)
type DbNivel = Nivel | "not_applicable";

export interface StudentAssessment {
  alunoId: string;
  avaliacoes: AssessmentMap;
  justificativas: JustificativaMap;
  observacao: string;
  fechado: boolean;
  fechadoEm?: string | null;
  atualizadoEm?: string;
}

const EMPTY: StudentAssessment = {
  alunoId: "",
  avaliacoes: {},
  justificativas: {},
  observacao: "",
  fechado: false,
};

function fromDbNivel(nivel: string): NivelOuNA {
  if (nivel === "not_applicable" || nivel === "nao_aplica") return "nao_aplica";
  return nivel as NivelOuNA;
}

function toDbNivel(nivel: NivelOuNA): DbNivel {
  return nivel === "nao_aplica" ? "not_applicable" : nivel;
}

function rowsToMaps(
  rows: { competencia: string; habilidade: string; nivel: string; justificativa?: string | null }[],
): { av: AssessmentMap; just: JustificativaMap } {
  const av: AssessmentMap = {};
  const just: JustificativaMap = {};
  for (const r of rows) {
    const k = `${r.competencia}::${r.habilidade}`;
    av[k] = fromDbNivel(r.nivel);
    if (r.justificativa) just[k] = r.justificativa;
  }
  return { av, just };
}

async function fetchStudent(userId: string, alunoId: string): Promise<StudentAssessment> {
  const [{ data: aRows }, { data: meta }] = await Promise.all([
    supabase
      .from("student_assessments")
      .select("competencia, habilidade, nivel, justificativa")
      .eq("user_id", userId)
      .eq("aluno_id", alunoId),
    supabase
      .from("student_assessment_meta")
      .select("observacao, fechado, fechado_em, updated_at")
      .eq("user_id", userId)
      .eq("aluno_id", alunoId)
      .maybeSingle(),
  ]);

  const { av, just } = rowsToMaps((aRows ?? []) as any);

  return {
    alunoId,
    avaliacoes: av,
    justificativas: just,
    observacao: meta?.observacao ?? "",
    fechado: meta?.fechado ?? false,
    fechadoEm: meta?.fechado_em ?? null,
    atualizadoEm: meta?.updated_at ?? undefined,
  };
}

async function fetchAll(userId: string): Promise<Record<string, StudentAssessment>> {
  const [{ data: aRows }, { data: metas }] = await Promise.all([
    supabase
      .from("student_assessments")
      .select("aluno_id, competencia, habilidade, nivel, justificativa")
      .eq("user_id", userId),
    supabase
      .from("student_assessment_meta")
      .select("aluno_id, observacao, fechado, fechado_em, updated_at")
      .eq("user_id", userId),
  ]);

  const out: Record<string, StudentAssessment> = {};
  for (const r of (aRows ?? []) as any[]) {
    if (!out[r.aluno_id])
      out[r.aluno_id] = {
        alunoId: r.aluno_id,
        avaliacoes: {},
        justificativas: {},
        observacao: "",
        fechado: false,
      };
    const k = `${r.competencia}::${r.habilidade}`;
    out[r.aluno_id].avaliacoes[k] = fromDbNivel(r.nivel);
    if (r.justificativa) out[r.aluno_id].justificativas[k] = r.justificativa;
  }
  for (const m of (metas ?? []) as any[]) {
    if (!out[m.aluno_id])
      out[m.aluno_id] = {
        alunoId: m.aluno_id,
        avaliacoes: {},
        justificativas: {},
        observacao: "",
        fechado: false,
      };
    out[m.aluno_id].observacao = m.observacao ?? "";
    out[m.aluno_id].fechado = m.fechado ?? false;
    out[m.aluno_id].fechadoEm = m.fechado_em ?? null;
    out[m.aluno_id].atualizadoEm = m.updated_at ?? undefined;
  }
  return out;
}

async function persist(
  userId: string,
  alunoId: string,
  avaliacoes: AssessmentMap,
  justificativas: JustificativaMap,
  observacao: string,
) {
  // 1) meta
  await supabase
    .from("student_assessment_meta")
    .upsert(
      { user_id: userId, aluno_id: alunoId, observacao },
      { onConflict: "user_id,aluno_id" },
    );

  // 2) upsert current cells
  const entries = Object.entries(avaliacoes);
  if (entries.length) {
    const rows = entries.map(([k, nivel]) => {
      const [competencia, habilidade] = k.split("::");
      const justificativa =
        nivel === "nao_aplica" ? (justificativas[k] ?? "").trim() || null : null;
      return {
        user_id: userId,
        aluno_id: alunoId,
        competencia,
        habilidade,
        nivel: toDbNivel(nivel),
        justificativa,
      };
    });
    await supabase
      .from("student_assessments")
      .upsert(rows, { onConflict: "user_id,aluno_id,competencia,habilidade" });
  }

  // 3) delete cells the professor removed
  const { data: existing } = await supabase
    .from("student_assessments")
    .select("competencia, habilidade")
    .eq("user_id", userId)
    .eq("aluno_id", alunoId);
  const wanted = new Set(Object.keys(avaliacoes));
  const toDelete = (existing ?? []).filter(
    (r: any) => !wanted.has(`${r.competencia}::${r.habilidade}`),
  );
  for (const r of toDelete) {
    await supabase
      .from("student_assessments")
      .delete()
      .eq("user_id", userId)
      .eq("aluno_id", alunoId)
      .eq("competencia", (r as any).competencia)
      .eq("habilidade", (r as any).habilidade);
  }
}

export function useStudentAssessment(alunoId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const key = ["student-assessment", userId, alunoId] as const;
  const { data: q } = useQuery({
    queryKey: key,
    queryFn: () => fetchStudent(userId!, alunoId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const current = q ?? EMPTY;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{
    avaliacoes: AssessmentMap;
    justificativas: JustificativaMap;
    observacao: string;
  } | null>(null);

  // flush em curso ao desmontar
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      const p = pending.current;
      if (userId && p) {
        persist(userId, alunoId, p.avaliacoes, p.justificativas, p.observacao).catch(() => {});
      }
    };
  }, [userId, alunoId]);

  const save = useCallback(
    (avaliacoes: AssessmentMap, justificativas: JustificativaMap = {}, observacao = "") => {
      if (!userId) return;
      // optimistic
      qc.setQueryData(key, (old: StudentAssessment | undefined) => ({
        ...(old ?? EMPTY),
        alunoId,
        avaliacoes,
        justificativas,
        observacao,
      }));
      pending.current = { avaliacoes, justificativas, observacao };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const p = pending.current;
        pending.current = null;
        if (!p) return;
        try {
          await persist(userId, alunoId, p.avaliacoes, p.justificativas, p.observacao);
          qc.invalidateQueries({ queryKey: ["all-student-assessments", userId] });
        } catch (e) {
          console.error("Falha ao salvar avaliação", e);
        }
      }, 600);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, alunoId, qc],
  );

  const setFechadoStatus = useCallback(
    async (value: boolean) => {
      if (!userId) return;
      const fechado_em = value ? new Date().toISOString() : null;
      await supabase
        .from("student_assessment_meta")
        .upsert(
          { user_id: userId, aluno_id: alunoId, fechado: value, fechado_em },
          { onConflict: "user_id,aluno_id" },
        );
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["all-student-assessments", userId] });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, alunoId, qc],
  );

  return {
    data: current.avaliacoes,
    justificativas: current.justificativas,
    observacao: current.observacao,
    fechado: current.fechado,
    save,
    setFechadoStatus,
  };
}

export function useAllAssessments() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { data } = useQuery({
    queryKey: ["all-student-assessments", userId],
    queryFn: () => fetchAll(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
  return useMemo(() => data ?? {}, [data]);
}

export function countByLevel(av: AssessmentMap) {
  const c = { iniciando: 0, desenvolvendo: 0, dominando: 0, naoAplica: 0, total: 0, cobertas: 0 };
  for (const v of Object.values(av)) {
    if (v === "nao_aplica") {
      c.naoAplica++;
    } else if (v === "iniciando" || v === "desenvolvendo" || v === "dominando") {
      c[v]++;
      c.total++;
    }
    c.cobertas++;
  }
  return c;
}

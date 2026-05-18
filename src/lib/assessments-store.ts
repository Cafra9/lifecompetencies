import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Nivel } from "@/lib/rubrica-infantil";

export type AssessmentMap = Record<string, Nivel>; // `${competencia}::${habilidade}` -> nivel

export interface StudentAssessment {
  alunoId: string;
  avaliacoes: AssessmentMap;
  observacao: string;
  fechado: boolean;
  fechadoEm?: string | null;
  atualizadoEm?: string;
}

const EMPTY: StudentAssessment = {
  alunoId: "",
  avaliacoes: {},
  observacao: "",
  fechado: false,
};

function rowsToMap(rows: { competencia: string; habilidade: string; nivel: Nivel }[]): AssessmentMap {
  const out: AssessmentMap = {};
  for (const r of rows) out[`${r.competencia}::${r.habilidade}`] = r.nivel;
  return out;
}

async function fetchStudent(userId: string, alunoId: string): Promise<StudentAssessment> {
  const [{ data: aRows }, { data: meta }] = await Promise.all([
    supabase
      .from("student_assessments")
      .select("competencia, habilidade, nivel")
      .eq("user_id", userId)
      .eq("aluno_id", alunoId),
    supabase
      .from("student_assessment_meta")
      .select("observacao, fechado, fechado_em, updated_at")
      .eq("user_id", userId)
      .eq("aluno_id", alunoId)
      .maybeSingle(),
  ]);

  return {
    alunoId,
    avaliacoes: rowsToMap((aRows ?? []) as any),
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
      .select("aluno_id, competencia, habilidade, nivel")
      .eq("user_id", userId),
    supabase
      .from("student_assessment_meta")
      .select("aluno_id, observacao, fechado, fechado_em, updated_at")
      .eq("user_id", userId),
  ]);

  const out: Record<string, StudentAssessment> = {};
  for (const r of (aRows ?? []) as any[]) {
    if (!out[r.aluno_id])
      out[r.aluno_id] = { alunoId: r.aluno_id, avaliacoes: {}, observacao: "", fechado: false };
    out[r.aluno_id].avaliacoes[`${r.competencia}::${r.habilidade}`] = r.nivel;
  }
  for (const m of (metas ?? []) as any[]) {
    if (!out[m.aluno_id])
      out[m.aluno_id] = { alunoId: m.aluno_id, avaliacoes: {}, observacao: "", fechado: false };
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
      return { user_id: userId, aluno_id: alunoId, competencia, habilidade, nivel };
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
  const pending = useRef<{ avaliacoes: AssessmentMap; observacao: string } | null>(null);

  // flush em curso ao desmontar
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      const p = pending.current;
      if (userId && p) {
        persist(userId, alunoId, p.avaliacoes, p.observacao).catch(() => {});
      }
    };
  }, [userId, alunoId]);

  const save = useCallback(
    (avaliacoes: AssessmentMap, observacao = "") => {
      if (!userId) return;
      // optimistic
      qc.setQueryData(key, (old: StudentAssessment | undefined) => ({
        ...(old ?? EMPTY),
        alunoId,
        avaliacoes,
        observacao,
      }));
      pending.current = { avaliacoes, observacao };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const p = pending.current;
        pending.current = null;
        if (!p) return;
        try {
          await persist(userId, alunoId, p.avaliacoes, p.observacao);
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
  const c = { iniciando: 0, desenvolvendo: 0, dominando: 0, total: 0 };
  for (const v of Object.values(av)) {
    c[v]++;
    c.total++;
  }
  return c;
}

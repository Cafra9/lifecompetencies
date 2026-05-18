import { useEffect, useState, useCallback } from "react";
import type { Nivel } from "@/lib/rubrica-infantil";

// Avaliação local (sem backend) — chave por aluno + competência + habilidade
export type AssessmentMap = Record<string, Nivel>; // `${competencia}::${habilidade}` -> nivel

export interface StudentAssessment {
  alunoId: string;
  avaliacoes: AssessmentMap;
  observacao: string; // observação geral do professor sobre o aluno
  fechado?: boolean; // quando true, a avaliação está finalizada e não pode ser editada
  fechadoEm?: string;
  atualizadoEm: string;
}

const KEY = "isp-assessments-v1";

function readAll(): Record<string, StudentAssessment> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StudentAssessment>) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("isp-assessments-updated"));
}

export function useStudentAssessment(alunoId: string) {
  const [data, setData] = useState<AssessmentMap>({});
  const [observacao, setObservacao] = useState<string>("");
  const [fechado, setFechado] = useState<boolean>(false);

  useEffect(() => {
    const load = () => {
      const all = readAll();
      setData(all[alunoId]?.avaliacoes ?? {});
      setObservacao(all[alunoId]?.observacao ?? "");
      setFechado(all[alunoId]?.fechado ?? false);
    };
    load();
    window.addEventListener("isp-assessments-updated", load);
    return () => window.removeEventListener("isp-assessments-updated", load);
  }, [alunoId]);

  const save = useCallback(
    (avaliacoes: AssessmentMap, observacao: string = "") => {
      const all = readAll();
      const prev = all[alunoId];
      all[alunoId] = {
        alunoId,
        avaliacoes,
        observacao,
        fechado: prev?.fechado ?? false,
        fechadoEm: prev?.fechadoEm,
        atualizadoEm: new Date().toISOString(),
      };
      writeAll(all);
    },
    [alunoId],
  );

  const setFechadoStatus = useCallback(
    (value: boolean) => {
      const all = readAll();
      const prev = all[alunoId];
      if (!prev) return;
      all[alunoId] = {
        ...prev,
        fechado: value,
        fechadoEm: value ? new Date().toISOString() : undefined,
        atualizadoEm: new Date().toISOString(),
      };
      writeAll(all);
    },
    [alunoId],
  );

  return { data, observacao, fechado, save, setFechadoStatus };
}

export function useAllAssessments() {
  const [all, setAll] = useState<Record<string, StudentAssessment>>({});
  useEffect(() => {
    const load = () => setAll(readAll());
    load();
    window.addEventListener("isp-assessments-updated", load);
    return () => window.removeEventListener("isp-assessments-updated", load);
  }, []);
  return all;
}

export function countByLevel(av: AssessmentMap) {
  const c = { iniciando: 0, desenvolvendo: 0, dominando: 0, total: 0 };
  for (const v of Object.values(av)) {
    c[v]++;
    c.total++;
  }
  return c;
}

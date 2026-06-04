// Catálogo compartilhado de segmentos, anos escolares e tipos de evidência.

export type SchoolSegment = "infantil" | "fundamental_1" | "fundamental_2" | "medio";
export type SchoolYear =
  | "infantil_1" | "infantil_2" | "infantil_3"
  | "ano_1" | "ano_2" | "ano_3" | "ano_4" | "ano_5"
  | "ano_6" | "ano_7" | "ano_8" | "ano_9"
  | "em_1" | "em_2" | "em_3";
export type EvidenceType = "rubrica" | "portfolio" | "notas" | "observacao_comportamento";
export type AppRole = "professor" | "coordenador" | "diretora" | "admin";

export const SEGMENT_LABELS: Record<SchoolSegment, string> = {
  infantil: "Infantil",
  fundamental_1: "Fundamental I",
  fundamental_2: "Fundamental II",
  medio: "Ensino Médio",
};

export const YEAR_LABELS: Record<SchoolYear, string> = {
  infantil_1: "Infantil 1",
  infantil_2: "Infantil 2",
  infantil_3: "Infantil 3",
  ano_1: "1º ano",
  ano_2: "2º ano",
  ano_3: "3º ano",
  ano_4: "4º ano",
  ano_5: "5º ano",
  ano_6: "6º ano",
  ano_7: "7º ano",
  ano_8: "8º ano",
  ano_9: "9º ano",
  em_1: "1ª série EM",
  em_2: "2ª série EM",
  em_3: "3ª série EM",
};

export const YEARS_BY_SEGMENT: Record<SchoolSegment, SchoolYear[]> = {
  infantil: ["infantil_1", "infantil_2", "infantil_3"],
  fundamental_1: ["ano_1", "ano_2", "ano_3", "ano_4", "ano_5"],
  fundamental_2: ["ano_6", "ano_7", "ano_8", "ano_9"],
  medio: ["em_1", "em_2", "em_3"],
};

export const EVIDENCE_LABELS: Record<EvidenceType, string> = {
  rubrica: "Rubrica de competências",
  portfolio: "Portfólio",
  notas: "Notas",
  observacao_comportamento: "Observação de comportamento",
};

export const EVIDENCE_DESCRIPTIONS: Record<EvidenceType, string> = {
  rubrica: "Avaliação por nível (iniciando · desenvolvendo · dominando) das habilidades das 5 competências.",
  portfolio: "Coleção de produções/trabalhos do aluno (texto, imagem, vídeo, link).",
  notas: "Notas numéricas por disciplina/período.",
  observacao_comportamento: "Registros qualitativos sobre comportamento e socialização.",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  professor: "Professor(a)",
  coordenador: "Coordenador(a)",
  diretora: "Diretor(a)",
  admin: "Administrador(a)",
};

export const ALL_EVIDENCE_TYPES: EvidenceType[] = [
  "rubrica",
  "portfolio",
  "notas",
  "observacao_comportamento",
];

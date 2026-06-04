// Compartilhado entre frontend/backend.
// Anos escolares e exigências são DINÂMICOS (vivem em tabelas do banco).
// Aqui ficam apenas: segmentos (mantidos no enum do banco) e papéis.

export type SchoolSegment = "infantil" | "fundamental_1" | "fundamental_2" | "medio";
export type AppRole = "professor" | "coordenador" | "diretora" | "admin";

export const SEGMENT_LABELS: Record<SchoolSegment, string> = {
  infantil: "K (Infantil)",
  fundamental_1: "Fundamental I",
  fundamental_2: "Fundamental II",
  medio: "Ensino Médio",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  professor: "Professor(a)",
  coordenador: "Coordenador(a)",
  diretora: "Diretor(a)",
  admin: "Administrador(a)",
};

export const SEGMENTS: SchoolSegment[] = ["infantil", "fundamental_1", "fundamental_2", "medio"];

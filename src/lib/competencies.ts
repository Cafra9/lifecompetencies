export const COMPETENCY_COLORS: Record<string, { bg: string; soft: string; text: string; ring: string }> = {
  cognitiva: { bg: "bg-cognitiva", soft: "bg-cognitiva-soft", text: "text-cognitiva", ring: "ring-cognitiva" },
  global: { bg: "bg-global", soft: "bg-global-soft", text: "text-global", ring: "ring-global" },
  digital: { bg: "bg-digital", soft: "bg-digital-soft", text: "text-digital", ring: "ring-digital" },
  autolideranca: { bg: "bg-autolideranca", soft: "bg-autolideranca-soft", text: "text-autolideranca", ring: "ring-autolideranca" },
  interpessoal: { bg: "bg-interpessoal", soft: "bg-interpessoal-soft", text: "text-interpessoal", ring: "ring-interpessoal" },
};

export const competencyColor = (slug?: string | null) =>
  (slug && COMPETENCY_COLORS[slug]) || { bg: "bg-primary", soft: "bg-muted", text: "text-primary", ring: "ring-primary" };

export const LEVEL_LABEL: Record<string, string> = {
  inicial: "Inicial",
  em_desenvolvimento: "Em Desenvolvimento",
  proficiente: "Proficiente",
  avancado: "Avançado",
};

export const LEVEL_VALUE: Record<string, number> = {
  inicial: 1,
  em_desenvolvimento: 2,
  proficiente: 3,
  avancado: 4,
};

export const SEGMENT_LABEL: Record<string, string> = {
  infantil: "Early Years (Kindergarten)",
  fundamental_1: "Elementary School",
  fundamental_2: "Elementary School",
  medio: "Ensino Médio",
};

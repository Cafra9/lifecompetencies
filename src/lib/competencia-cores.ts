// Cores oficiais do framework ISP Life Competencies (roda das competências).
import type { Nivel } from "@/lib/rubrica-infantil";

export type CompetenciaCor = {
  swatch: string; // bloco sólido (legenda / cabeçalho)
  badge: string; // pill suave (badge)
  text: string; // texto colorido
  cell: Record<Nivel, string>; // intensidade por nível
};

export const COMPETENCIA_CORES: Record<string, CompetenciaCor> = {
  Cognitivo: {
    swatch: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    text: "text-emerald-700",
    cell: {
      iniciando: "bg-emerald-100 text-emerald-900",
      desenvolvendo: "bg-emerald-400 text-white",
      dominando: "bg-emerald-700 text-white",
    },
  },
  Global: {
    swatch: "bg-violet-500",
    badge: "bg-violet-100 text-violet-800 border-violet-200",
    text: "text-violet-700",
    cell: {
      iniciando: "bg-violet-100 text-violet-900",
      desenvolvendo: "bg-violet-400 text-white",
      dominando: "bg-violet-700 text-white",
    },
  },
  Digital: {
    swatch: "bg-blue-600",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    text: "text-blue-700",
    cell: {
      iniciando: "bg-blue-100 text-blue-900",
      desenvolvendo: "bg-blue-400 text-white",
      dominando: "bg-blue-700 text-white",
    },
  },
  Autoliderança: {
    swatch: "bg-pink-500",
    badge: "bg-pink-100 text-pink-800 border-pink-200",
    text: "text-pink-700",
    cell: {
      iniciando: "bg-pink-100 text-pink-900",
      desenvolvendo: "bg-pink-400 text-white",
      dominando: "bg-pink-700 text-white",
    },
  },
  Interpessoal: {
    swatch: "bg-amber-400",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    text: "text-amber-700",
    cell: {
      iniciando: "bg-amber-100 text-amber-900",
      desenvolvendo: "bg-amber-400 text-amber-950",
      dominando: "bg-amber-600 text-white",
    },
  },
};

export const VAZIO_CELL = "bg-muted text-muted-foreground";

export function corDaCompetencia(nome: string): CompetenciaCor {
  return COMPETENCIA_CORES[nome] ?? COMPETENCIA_CORES.Cognitivo;
}

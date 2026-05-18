import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, TrendingUp, BookOpen, Users, Brain, Globe, Monitor, Target, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

const stats = [
  { label: "Alunos", value: 8, icon: GraduationCap, color: "text-blue-600" },
  { label: "Avaliações", value: 4, icon: TrendingUp, color: "text-emerald-600" },
  { label: "Recursos", value: 6, icon: BookOpen, color: "text-purple-600" },
  { label: "Práticas Compartilhadas", value: 3, icon: Users, color: "text-rose-600" },
];

const areas = [
  {
    nome: "Cognitivo", icon: Brain, count: 3,
    items: ["Pensamento Crítico", "Resolução de Problemas", "Criatividade e Inovação"],
    bg: "bg-[oklch(0.95_0.04_300)]", text: "text-[oklch(0.45_0.18_300)]",
  },
  {
    nome: "Global", icon: Globe, count: 3,
    items: ["Consciência Cultural", "Cidadania Global", "Sustentabilidade"],
    bg: "bg-[oklch(0.95_0.04_250)]", text: "text-[oklch(0.45_0.18_250)]",
  },
  {
    nome: "Digital", icon: Monitor, count: 3,
    items: ["Literacia Digital", "Pensamento Computacional", "Criação de Conteúdo Digital"],
    bg: "bg-[oklch(0.95_0.04_200)]", text: "text-[oklch(0.45_0.15_200)]",
  },
  {
    nome: "Autoliderança", icon: Target, count: 3,
    items: ["Autoconhecimento", "Autorregulação", "Resiliência"],
    bg: "bg-[oklch(0.96_0.05_65)]", text: "text-[oklch(0.55_0.17_55)]",
  },
  {
    nome: "Interpessoal", icon: Heart, count: 3,
    items: ["Comunicação", "Colaboração", "Empatia"],
    bg: "bg-[oklch(0.95_0.04_25)]", text: "text-[oklch(0.5_0.2_25)]",
  },
];

const avaliacoesRecentes = [
  { aluno: "João Pedro", area: "Pensamento Crítico", nivel: "Mastering", quando: "Há 2 dias" },
  { aluno: "Maria Eduarda", area: "Colaboração", nivel: "Developing", quando: "Há 3 dias" },
  { aluno: "Lucas Almeida", area: "Literacia Digital", nivel: "Mastering", quando: "Há 5 dias" },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vinda, Lisandra!</h1>
        <p className="text-muted-foreground mt-1">Acompanhe o desenvolvimento das competências e apoie sua equipe docente</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-bold mt-2">{s.value}</div>
                </div>
                <Icon className={`h-6 w-6 ${s.color}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Áreas de Competências</CardTitle>
          <p className="text-sm text-muted-foreground">5 áreas principais com 15 competências do programa ISP Life Competencies</p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.nome} className={`${a.bg} rounded-xl p-5`}>
                  <div className={`flex items-center gap-2 font-semibold ${a.text}`}>
                    <Icon className="h-5 w-5" />
                    {a.nome}
                  </div>
                  <div className={`text-xs ${a.text} opacity-80 mt-1`}>{a.count} competências</div>
                  <ul className={`mt-3 space-y-1 text-sm ${a.text}`}>
                    {a.items.map((i) => (
                      <li key={i}>• {i}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Avaliações Recentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {avaliacoesRecentes.map((a, i) => (
              <div key={i} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="font-medium text-sm">{a.aluno}</div>
                  <div className="text-xs text-muted-foreground">{a.area}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${a.nivel === "Mastering" ? "text-emerald-600" : "text-blue-600"}`}>{a.nivel}</div>
                  <div className="text-xs text-muted-foreground">{a.quando}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Ações Rápidas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <button className="rounded-lg border p-4 text-left hover:bg-muted transition">
              <ClipQuick icon={ClipboardCheckIcon} title="Nova Avaliação" desc="Registrar progresso" />
            </button>
            <button className="rounded-lg border p-4 text-left hover:bg-muted transition">
              <ClipQuick icon={BookOpen} title="Biblioteca" desc="Acessar recursos" />
            </button>
            <button className="rounded-lg border p-4 text-left hover:bg-muted transition">
              <ClipQuick icon={Users} title="Práticas" desc="Compartilhar com a equipe" />
            </button>
            <button className="rounded-lg border p-4 text-left hover:bg-muted transition">
              <ClipQuick icon={TrendingUp} title="Relatórios" desc="Ver evolução" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { ClipboardCheck as ClipboardCheckIcon } from "lucide-react";
function ClipQuick({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-primary mt-0.5" />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

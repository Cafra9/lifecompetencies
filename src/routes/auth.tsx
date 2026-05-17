import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Users,
  ClipboardCheck,
  BarChart3,
  UserCircle,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/auth")({ component: MenuPage });

const pages = [
  { to: "/", title: "Dashboard", desc: "Visão geral", icon: LayoutDashboard },
  { to: "/formacao", title: "Formação", desc: "Trilhas e cursos", icon: GraduationCap },
  { to: "/biblioteca", title: "Biblioteca", desc: "Recursos pedagógicos", icon: BookOpen },
  { to: "/planos", title: "Planos de Aula", desc: "Repositório colaborativo", icon: ClipboardList },
  { to: "/turmas", title: "Minhas Turmas", desc: "Turmas e alunos", icon: Users },
  { to: "/avaliacoes", title: "Avaliações", desc: "Avaliar habilidades", icon: ClipboardCheck },
  { to: "/relatorios", title: "Relatórios", desc: "Gráficos e PDF", icon: BarChart3 },
  { to: "/perfil", title: "Perfil", desc: "Meus dados", icon: UserCircle },
  { to: "/admin", title: "Administração", desc: "Gestão da plataforma", icon: Shield },
] as const;

function MenuPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Competências para a Vida</h1>
          <p className="text-muted-foreground mt-2">
            Menu de navegação (modo de testes — autenticação desativada)
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link key={p.to} to={p.to} className="group">
              <Card className="h-full transition hover:shadow-md hover:border-primary/40">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

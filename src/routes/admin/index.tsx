import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Administração</p>
          <h1 className="text-3xl font-bold mt-1">Gestão da plataforma</h1>
          <p className="text-muted-foreground">Painel restrito a coordenação e administradores.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <AdminCard icon={Users} title="Usuários e papéis" desc="Convidar professores, coordenadores e admins" />
          <AdminCard icon={GraduationCap} title="Trilhas de formação" desc="Publicar módulos, vídeos e quizzes" />
          <AdminCard icon={BookOpen} title="Biblioteca" desc="Curar recursos, rubricas e templates" />
          <AdminCard icon={Shield} title="Configurações" desc="Identidade visual, segmentos e domínios" />
        </div>
      </div>
    </AppLayout>
  ),
});

function AdminCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export const Route = createFileRoute("/turmas/")({
  component: () => (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Minhas Turmas</p>
            <h1 className="text-3xl font-bold mt-1">Turmas e alunos</h1>
            <p className="text-muted-foreground">Crie suas turmas (EI, Y1–Y12) e cadastre seus alunos para iniciar avaliações.</p>
          </div>
          <Button disabled><Plus className="h-4 w-4 mr-2" /> Nova turma</Button>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Comece pela primeira turma</CardTitle></CardHeader>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhuma turma cadastrada — funcionalidade será habilitada após o login.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  ),
});

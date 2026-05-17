import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/perfil/")({
  component: () => (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Meu Perfil</p>
          <h1 className="text-3xl font-bold mt-1">Dados profissionais</h1>
          <p className="text-muted-foreground">Mantenha suas informações atualizadas para personalizar trilhas e relatórios.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Nome</Label><Input placeholder="Seu nome" disabled /></div>
            <div><Label>E-mail institucional</Label><Input placeholder="voce@aubrick.com.br" disabled /></div>
            <div><Label>Segmento principal</Label><Input placeholder="Ex.: Fundamental I" disabled /></div>
            <div><Label>Disciplina</Label><Input placeholder="Ex.: História" disabled /></div>
            <div>
              <Label className="block mb-2">Papéis</Label>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary">professor</Badge>
              </div>
            </div>
            <Button disabled>Salvar alterações</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  ),
});

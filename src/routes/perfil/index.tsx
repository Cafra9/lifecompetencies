import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BADGES } from "@/lib/iSP-content";
import { Award } from "lucide-react";

export const Route = createFileRoute("/perfil/")({
  component: () => (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
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
              <div className="flex gap-1 flex-wrap"><Badge variant="secondary">professor</Badge></div>
            </div>
            <Button disabled>Salvar alterações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /><CardTitle>Badges de reconhecimento</CardTitle></div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {BADGES.map((b) => (
                <div key={b.nome} className="rounded-lg border p-3 flex gap-3 items-start">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{b.nome}</div>
                    <div className="text-xs text-muted-foreground">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  ),
});

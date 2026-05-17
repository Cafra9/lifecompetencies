import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, TrendingUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/avaliacoes/")({
  component: AvaliacoesPage,
});

const alunos = [
  { nome: "João Pedro", ano: "6º Ano", total: 2, mastering: 1, developing: 1, beginning: 0 },
  { nome: "Maria Eduarda", ano: "6º Ano", total: 1, mastering: 0, developing: 1, beginning: 0 },
  { nome: "Lucas Almeida", ano: "7º Ano", total: 1, mastering: 1, developing: 0, beginning: 0 },
  { nome: "Ana Carolina", ano: "7º Ano", total: 0, mastering: 0, developing: 0, beginning: 0 },
  { nome: "Gabriel Costa", ano: "8º Ano", total: 0, mastering: 0, developing: 0, beginning: 0 },
  { nome: "Julia Martins", ano: "8º Ano", total: 0, mastering: 0, developing: 0, beginning: 0 },
  { nome: "Pedro Henrique", ano: "9º Ano", total: 0, mastering: 0, developing: 0, beginning: 0 },
  { nome: "Beatriz Lima", ano: "9º Ano", total: 0, mastering: 0, developing: 0, beginning: 0 },
];

function AvaliacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
        <p className="text-muted-foreground mt-1">Gerencie avaliações de competências dos alunos</p>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar aluno por nome ou turma..." className="pl-9 bg-muted/50 border-0" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Todas as áreas
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {alunos.map((a) => (
          <Card key={a.nome}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{a.nome}</div>
                  <div className="text-sm text-muted-foreground">{a.ano}</div>
                </div>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" />Avaliar</Button>
              </div>

              <div className="space-y-2 text-sm">
                <Row label="Total de Avaliações" value={<Badge variant="secondary">{a.total}</Badge>} />
                <Row label={<span className="text-emerald-600">Mastering</span>} value={a.mastering} />
                <Row label={<span className="text-blue-600">Developing</span>} value={a.developing} />
                <Row label={<span className="text-muted-foreground">Beginning</span>} value={a.beginning} />
              </div>

              <Button variant="outline" className="w-full gap-2">
                <TrendingUp className="h-4 w-4" />
                Ver Histórico
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

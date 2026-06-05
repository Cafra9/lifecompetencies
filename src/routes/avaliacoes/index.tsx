import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Plus,
  FileText,
  ChevronDown,
  BookOpen,
  Flame,
  Lock,
  Unlock,
} from "lucide-react";
import { AvaliarDialog, RelatorioDialog } from "@/components/AvaliarDialog";
import { HeatmapDialog } from "@/components/HeatmapDialog";
import { ClassHeatmapDialog } from "@/components/ClassHeatmapDialog";
import { EvidencesDialog, useEvidenceCount } from "@/components/EvidencesDialog";
import { Paperclip } from "lucide-react";
import { useAllAssessments, countByLevel, useStudentAssessment } from "@/lib/assessments-store";
import { toast } from "sonner";

export const Route = createFileRoute("/avaliacoes/")({
  component: AvaliacoesPage,
});

type Aluno = { id: string; nome: string; ano: string };

function AvaliacoesPage() {
  const { user, loading } = useAuth();
  const [busca, setBusca] = useState("");
  const [turmaId, setTurmaId] = useState<string>("");
  const [avaliarId, setAvaliarId] = useState<string | null>(null);
  const [relatorioId, setRelatorioId] = useState<string | null>(null);
  const [heatmapId, setHeatmapId] = useState<string | null>(null);
  const [classHeatmap, setClassHeatmap] = useState(false);

  const { data: turmas = [] } = useQuery({
    queryKey: ["avaliacoes-turmas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, nome, arquivada")
        .eq("arquivada", false)
        .order("nome");
      return (data ?? []) as { id: string; nome: string }[];
    },
  });

  // Auto-seleciona a primeira turma assim que carregar
  if (turmas.length && !turmaId) {
    setTurmaId(turmas[0].id);
  }

  const { data: alunos = [], isLoading: alunosLoading } = useQuery({
    queryKey: ["avaliacoes-alunos", turmaId],
    enabled: !!user && !!turmaId,
    queryFn: async (): Promise<Aluno[]> => {
      const turma = turmas.find((t) => t.id === turmaId);
      const { data } = await supabase
        .from("students")
        .select("id, nome")
        .eq("class_id", turmaId)
        .order("nome");
      return (data ?? []).map((s: any) => ({
        id: s.id,
        nome: s.nome,
        ano: turma?.nome ?? "",
      }));
    },
  });

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!user) {
    return <Navigate to="/login" search={{ redirect: "/avaliacoes" }} replace />;
  }

  const filtrados = alunos.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()));

  const ativo = (id: string | null) => alunos.find((a) => a.id === id);

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground mt-1">Gerencie avaliações de competências dos alunos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setClassHeatmap(true)}>
            <Flame className="h-4 w-4" /> Heatmap da turma
          </Button>
          <Link to="/avaliacoes/rubrica">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" /> Ver Rubrica
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-3 items-center flex-wrap">
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {turmas.length === 0 && <option value="">Nenhuma turma</option>}
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno por nome..."
              className="pl-9 bg-muted/50 border-0"
            />
          </div>
        </CardContent>
      </Card>


      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((a) => (
          <AlunoCard
            key={a.id}
            aluno={a}
            onAvaliar={() => setAvaliarId(a.id)}
            onRelatorio={() => setRelatorioId(a.id)}
            onHeatmap={() => setHeatmapId(a.id)}
          />
        ))}
      </div>
      {!alunosLoading && filtrados.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {alunos.length === 0
              ? "Nenhum aluno cadastrado. Crie uma turma e adicione alunos em Turmas."
              : "Nenhum aluno encontrado para a busca."}
          </CardContent>
        </Card>
      )}

      {ativo(avaliarId) && (
        <AvaliarDialog
          open={!!avaliarId}
          onOpenChange={(v) => !v && setAvaliarId(null)}
          alunoId={ativo(avaliarId)!.id}
          alunoNome={ativo(avaliarId)!.nome}
        />
      )}

      {ativo(relatorioId) && (
        <RelatorioDialog
          open={!!relatorioId}
          onOpenChange={(v) => !v && setRelatorioId(null)}
          alunoId={ativo(relatorioId)!.id}
          alunoNome={ativo(relatorioId)!.nome}
        />
      )}

      {ativo(heatmapId) && (
        <HeatmapDialog
          open={!!heatmapId}
          onOpenChange={(v) => !v && setHeatmapId(null)}
          alunoId={ativo(heatmapId)!.id}
          alunoNome={ativo(heatmapId)!.nome}
        />
      )}

      <ClassHeatmapDialog
        open={classHeatmap}
        onOpenChange={setClassHeatmap}
        alunos={alunos}
      />
    </div>
    </AppLayout>
  );
}

function AlunoCard({
  aluno,
  onAvaliar,
  onRelatorio,
  onHeatmap,
}: {
  aluno: { id: string; nome: string; ano: string };
  onAvaliar: () => void;
  onRelatorio: () => void;
  onHeatmap: () => void;
}) {
  const { data, fechado, setFechadoStatus } = useStudentAssessment(aluno.id);
  const c = countByLevel(data);

  function toggleFechado() {
    if (fechado) {
      setFechadoStatus(false);
      toast.success("Avaliação reaberta para edição.");
    } else {
      if (c.total === 0) {
        toast.error("Registre ao menos uma habilidade antes de fechar.");
        return;
      }
      const ok = window.confirm(
        `Fechar a avaliação de ${aluno.nome}? Após fechada, não será possível editar ou excluir até que seja reaberta.`,
      );
      if (!ok) return;
      setFechadoStatus(true);
      toast.success("Avaliação fechada.");
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold flex items-center gap-2">
              {aluno.nome}
              {fechado && (
                <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-[10px]">
                  Fechada
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{aluno.ano}</div>
          </div>
          <Button size="sm" className="gap-1" onClick={onAvaliar}>
            <Plus className="h-4 w-4" />
            {fechado ? "Ver" : "Avaliar"}
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <Row label="Habilidades avaliadas" value={<Badge variant="secondary">{c.total}/15</Badge>} />
          <Row label={<span className="text-green-700">Dominando</span>} value={c.dominando} />
          <Row label={<span className="text-green-600">Desenvolvendo</span>} value={c.desenvolvendo} />
          <Row label={<span className="text-green-500">Iniciando</span>} value={c.iniciando} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onHeatmap}
            disabled={c.total === 0}
          >
            <Flame className="h-4 w-4" />
            Heatmap
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onRelatorio}
            disabled={c.total === 0}
          >
            <FileText className="h-4 w-4" />
            Relatório
          </Button>
        </div>

        <Button
          variant={fechado ? "secondary" : "outline"}
          className="w-full gap-2"
          onClick={toggleFechado}
        >
          {fechado ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {fechado ? "Reabrir avaliação" : "Fechar avaliação"}
        </Button>
      </CardContent>
    </Card>
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

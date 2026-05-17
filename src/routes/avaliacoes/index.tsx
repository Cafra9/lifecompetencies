import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardCheck, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/avaliacoes/")({ component: () => <AppLayout><Avaliacoes /></AppLayout> });

function Avaliacoes() {
  const { user } = useAuth();
  const [classId, setClassId] = useState<string>("");
  const qc = useQueryClient();

  const { data: turmas } = useQuery({
    queryKey: ["classes", user?.id],
    queryFn: async () => (await supabase.from("classes").select("*").order("nome")).data ?? [],
    enabled: !!user,
  });
  const { data: alunos } = useQuery({
    queryKey: ["students-of-class", classId],
    queryFn: async () => classId ? (await supabase.from("students").select("*").eq("class_id", classId).order("nome")).data ?? [] : [],
    enabled: !!classId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Avaliações</h1>
        <p className="text-muted-foreground">Selecione uma turma para avaliar seus alunos.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {turmas?.map((t: any) => (
          <Button key={t.id} variant={classId === t.id ? "default" : "outline"} onClick={() => setClassId(t.id)}>{t.nome}</Button>
        ))}
      </div>
      {classId && (
        <div className="grid gap-2">
          {alunos?.length === 0 ? <Card><CardContent className="py-6 text-center text-muted-foreground">Nenhum aluno nesta turma.</CardContent></Card> :
            alunos?.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-muted-foreground" /> {a.nome}</div>
                  <Button asChild size="sm" variant="ghost"><Link to="/alunos/$id" params={{ id: a.id }}>Avaliar <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

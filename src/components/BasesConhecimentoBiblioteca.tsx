import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Library } from "lucide-react";

type KB = { id: string; titulo: string; descricao: string | null; conteudo: string; anos: string[] };

export function BasesConhecimentoBiblioteca() {
  const [bases, setBases] = useState<KB[] | null>(null);
  const [sel, setSel] = useState<KB | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("knowledge_bases")
        .select("id, titulo, descricao, conteudo, knowledge_base_years(school_years(nome, ordem))")
        .eq("ativo", true)
        .order("titulo");
      setBases(
        (data ?? []).map((b: any) => ({
          id: b.id,
          titulo: b.titulo,
          descricao: b.descricao,
          conteudo: b.conteudo,
          anos: (b.knowledge_base_years ?? [])
            .map((y: any) => y.school_years)
            .filter(Boolean)
            .sort((a: any, z: any) => a.ordem - z.ordem)
            .map((y: any) => y.nome),
        })),
      );
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Bases de Conhecimento</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {bases === null ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : bases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma base cadastrada.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {bases.map((b) => (
              <button
                key={b.id}
                onClick={() => setSel(b)}
                className="text-left rounded-lg border p-4 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="font-medium">{b.titulo}</div>
                {b.descricao && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.descricao}</div>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {b.anos.map((a) => <Badge key={a} variant="secondary" className="font-normal text-xs">{a}</Badge>)}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{sel?.titulo}</DialogTitle></DialogHeader>
          {sel?.descricao && <p className="text-sm text-muted-foreground">{sel.descricao}</p>}
          <div className="flex flex-wrap gap-1">
            {sel?.anos.map((a) => <Badge key={a} variant="secondary" className="font-normal">{a}</Badge>)}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{sel?.conteudo}</div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

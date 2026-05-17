import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { competencyColor } from "@/lib/competencies";
import { Plus, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = {
  artigo: "Artigo", video: "Vídeo", podcast: "Podcast", infografico: "Infográfico", guia: "Guia", externo: "Link externo",
};

export const Route = createFileRoute("/biblioteca/")({ component: () => <AppLayout><Biblioteca /></AppLayout> });

function Biblioteca() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [compFilter, setCompFilter] = useState<string>("all");

  const { data: comps } = useQuery({
    queryKey: ["competencies"],
    queryFn: async () => (await supabase.from("competencies").select("*").order("ordem")).data ?? [],
  });
  const { data: resources } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => (await supabase.from("resources").select("*, competencies(slug, nome)").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = resources?.filter((r: any) =>
    (compFilter === "all" || r.competency_id === compFilter) &&
    (!search || r.titulo.toLowerCase().includes(search.toLowerCase()))
  );

  async function addResource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const file = f.get("arquivo") as File | null;
    let arquivo_url: string | null = null;
    if (file && file.size > 0) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr, data } = await supabase.storage.from("resources").upload(path, file);
      if (upErr) { toast.error(upErr.message); setBusy(false); return; }
      arquivo_url = supabase.storage.from("resources").getPublicUrl(data.path).data.publicUrl;
    }
    const { error } = await supabase.from("resources").insert({
      titulo: String(f.get("titulo")),
      descricao: String(f.get("descricao")) || null,
      tipo: f.get("tipo") as any,
      competency_id: (f.get("competency_id") as string) || null,
      link_externo: String(f.get("link_externo")) || null,
      arquivo_url,
      created_by: user.id,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Recurso adicionado"); setOpen(false); qc.invalidateQueries({ queryKey: ["resources"] }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca Pedagógica</h1>
          <p className="text-muted-foreground">Reúna artigos, vídeos, podcasts e guias para sua prática.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo recurso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo recurso</DialogTitle></DialogHeader>
            <form onSubmit={addResource} className="space-y-3">
              <div><Label>Título</Label><Input name="titulo" required /></div>
              <div><Label>Descrição</Label><Textarea name="descricao" rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select name="tipo" defaultValue="artigo">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Competência</Label>
                  <Select name="competency_id">
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{comps?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Link externo</Label><Input name="link_externo" placeholder="https://..." /></div>
              <div><Label>Arquivo</Label><Input name="arquivo" type="file" /></div>
              <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Adicionar"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={compFilter} onValueChange={setCompFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as competências</SelectItem>
            {comps?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.length === 0 ? <Card className="col-span-full"><CardContent className="py-10 text-center text-muted-foreground">Nenhum recurso ainda.</CardContent></Card> :
          filtered?.map((r: any) => {
            const col = competencyColor(r.competencies?.slug);
            return (
              <Card key={r.id} className="overflow-hidden">
                <div className={`h-1 ${col.bg}`} />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{r.titulo}</CardTitle>
                    <Badge variant="secondary">{TYPE_LABEL[r.tipo]}</Badge>
                  </div>
                  {r.competencies && <CardDescription>{r.competencies.nome}</CardDescription>}
                </CardHeader>
                <CardContent>
                  {r.descricao && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{r.descricao}</p>}
                  {(r.arquivo_url || r.link_externo) && (
                    <Button asChild size="sm" variant="outline">
                      <a href={r.arquivo_url || r.link_externo} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

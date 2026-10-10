import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bases-conhecimento")({
  component: Page,
  errorComponent: ({ error }) => (
    <AppLayout><div role="alert" className="p-6">Erro: {(error as Error).message}</div></AppLayout>
  ),
  notFoundComponent: () => <AppLayout><div className="p-6">Página não encontrada</div></AppLayout>,
});

type SchoolYear = { id: string; codigo: string; nome: string; segmento: string };
type Base = {
  id: string;
  titulo: string;
  conteudo: string;
  descricao: string | null;
  ativo: boolean;
  created_by: string;
  created_at: string;
};
type BaseWithYears = Base & { year_ids: string[] };

function Page() {
  const isAdmin = useIsAdmin();
  const sb = supabase as any;
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BaseWithYears | null>(null);
  const [open, setOpen] = useState(false);

  const { data: years } = useQuery({
    queryKey: ["school-years-all"],
    queryFn: async () => {
      const { data, error } = await sb.from("school_years").select("*").order("segmento").order("ordem");
      if (error) throw error;
      return data as SchoolYear[];
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["knowledge-bases-admin"],
    queryFn: async () => {
      const { data, error } = await sb.from("knowledge_bases").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: links, error: e2 } = await sb.from("knowledge_base_years").select("*");
      if (e2) throw e2;
      const byBase: Record<string, string[]> = {};
      (links ?? []).forEach((l: any) => {
        (byBase[l.knowledge_base_id] ??= []).push(l.school_year_id);
      });
      return (data as Base[]).map((b) => ({ ...b, year_ids: byBase[b.id] ?? [] })) as BaseWithYears[];
    },
  });

  if (!isAdmin) {
    return <AppLayout><div className="p-6">Acesso restrito a administradores.</div></AppLayout>;
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta base de conhecimento?")) return;
    const { error } = await sb.from("knowledge_bases").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Base removida");
    qc.invalidateQueries({ queryKey: ["knowledge-bases-admin"] });
  }

  const yearById = Object.fromEntries((years ?? []).map((y) => [y.id, y]));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Painel</Link>
            </Button>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Administração</p>
            <h1 className="text-3xl font-bold mt-1">Bases de Conhecimento</h1>
            <p className="text-muted-foreground max-w-2xl">
              Cadastre referências personalizadas (diretrizes pedagógicas, projetos, contextos)
              e associe-as aos anos escolares. A IA usará essas bases como critério adicional
              na geração dos relatórios, além das rubricas padrão.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova base
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Bases cadastradas</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Anos escolares</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.titulo}
                        {b.descricao && (
                          <div className="text-xs text-muted-foreground font-normal mt-0.5 max-w-md">
                            {b.descricao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {b.year_ids.length === 0 && (
                            <span className="text-xs text-muted-foreground">— nenhum —</span>
                          )}
                          {b.year_ids.map((yid) => {
                            const y = yearById[yid];
                            return (
                              <Badge key={yid} variant="secondary" className="text-xs">
                                {y ? `${y.nome}` : yid.slice(0, 6)}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.ativo ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(b); setOpen(true); }} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(b.id)} aria-label="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items?.length && (
                    <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma base cadastrada.
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <EditDialog
          open={open}
          onOpenChange={setOpen}
          item={editing}
          years={years ?? []}
          onResetEditing={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["knowledge-bases-admin"] })}
        />
      </div>
    </AppLayout>
  );
}

function EditDialog({
  open, onOpenChange, item, years, onSaved, onResetEditing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: BaseWithYears | null;
  years: SchoolYear[];
  onSaved: () => void;
  onResetEditing: () => void;
}) {
  const sb = supabase as any;
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [yearIds, setYearIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitulo(item?.titulo ?? "");
    setDescricao(item?.descricao ?? "");
    setConteudo(item?.conteudo ?? "");
    setAtivo(item?.ativo ?? true);
    setYearIds(item?.year_ids ?? []);
  }, [item?.id, open]);

  function toggleYear(id: string) {
    setYearIds((prev) => prev.includes(id) ? prev.filter((y) => y !== id) : [...prev, id]);
  }

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setConteudo("");
    setAtivo(true);
    setYearIds([]);
  }

  async function save(opts: { keepOpen: boolean }) {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }
    if (!user) return toast.error("Sessão inválida");
    setBusy(true);
    try {
      let baseId = item?.id;
      const payload: any = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        conteudo: conteudo.trim(),
        ativo,
      };
      if (item) {
        const { error } = await sb.from("knowledge_bases").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { data, error } = await sb.from("knowledge_bases")
          .insert({ ...payload, created_by: user.id })
          .select("id").single();
        if (error) throw error;
        baseId = data.id;
      }
      // sync year links: delete all and re-insert (simple + correct)
      await sb.from("knowledge_base_years").delete().eq("knowledge_base_id", baseId);
      if (yearIds.length > 0) {
        const rows = yearIds.map((yid) => ({ knowledge_base_id: baseId, school_year_id: yid }));
        const { error } = await sb.from("knowledge_base_years").insert(rows);
        if (error) throw error;
      }
      toast.success(item ? "Base atualizada" : "Base criada");
      onSaved();
      if (opts.keepOpen) {
        // reset state so the next save creates a NEW base instead of overwriting
        resetForm();
        onResetEditing();
      } else {
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save({ keepOpen: false });
  }

  // group years by segmento for cleaner UI
  const grouped: Record<string, SchoolYear[]> = {};
  years.forEach((y) => { (grouped[y.segmento] ??= []).push(y); });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar base de conhecimento" : "Nova base de conhecimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500}
              placeholder="Breve resumo para identificar a base" />
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={10}
              placeholder="Cole aqui as diretrizes, referências, contextos ou critérios que a IA deve considerar." />
            <p className="text-xs text-muted-foreground mt-1">
              Este conteúdo será enviado à IA como critério adicional ao gerar relatórios de alunos
              dos anos escolares selecionados abaixo.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Anos escolares vinculados</Label>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum ano escolar cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(grouped).map(([seg, list]) => (
                  <div key={seg}>
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">{seg}</div>
                    <div className="flex flex-wrap gap-1">
                      {list.map((y) => {
                        const active = yearIds.includes(y.id);
                        return (
                          <button
                            type="button"
                            key={y.id}
                            onClick={() => toggleYear(y.id)}
                            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {y.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={ativo} onCheckedChange={setAtivo} />
            <Label className="cursor-pointer">Ativo</Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="button" variant="secondary" disabled={busy}
              onClick={() => save({ keepOpen: true })}>
              {busy ? "Salvando..." : "Salvar e adicionar outra"}
            </Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

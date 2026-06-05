import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/tipos-evidencia")({
  component: Page,
  errorComponent: ({ error }) => (
    <AppLayout><div role="alert" className="p-6">Erro: {error.message}</div></AppLayout>
  ),
  notFoundComponent: () => <AppLayout><div className="p-6">Página não encontrada</div></AppLayout>,
});

const COMMON_EXTENSIONS = [
  // documentos
  "pdf", "docx", "doc", "txt", "md", "rtf", "odt",
  // planilhas / apresentações
  "xlsx", "xls", "csv", "pptx", "ppt", "key", "odp",
  // imagens
  "jpg", "jpeg", "png", "webp", "heic", "gif", "svg", "tiff", "bmp",
  // vídeo
  "mp4", "mov", "webm", "m4v", "avi", "mkv",
  // áudio
  "mp3", "m4a", "wav", "ogg", "flac",
  // arquivos
  "zip", "rar", "7z",
];

type Req = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  allowed_extensions: string[];
};

function Page() {
  const isAdmin = useIsAdmin();
  const sb = supabase as any;
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Req | null>(null);
  const [open, setOpen] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["evidence-requirements-admin"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("evidence_requirements")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return data as Req[];
    },
  });

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-6">Acesso restrito a administradores.</div>
      </AppLayout>
    );
  }

  async function remove(id: string) {
    if (!confirm("Excluir este tipo de evidência?")) return;
    const { error } = await sb.from("evidence_requirements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tipo removido");
    qc.invalidateQueries({ queryKey: ["evidence-requirements-admin"] });
    qc.invalidateQueries({ queryKey: ["evidence-requirements-active"] });
  }

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(r: Req) { setEditing(r); setOpen(true); }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Painel</Link>
            </Button>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Administração</p>
            <h1 className="text-3xl font-bold mt-1">Tipos de evidência</h1>
            <p className="text-muted-foreground">
              Configure as categorias disponíveis ao enviar evidências e quais
              extensões de arquivo cada categoria aceita.
            </p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo tipo</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Categorias cadastradas</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Extensões aceitas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.nome}
                        {r.descricao && (
                          <div className="text-xs text-muted-foreground font-normal mt-0.5 max-w-md">
                            {r.descricao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{r.slug}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {(r.allowed_extensions ?? []).map((e) => (
                            <Badge key={e} variant="secondary" className="text-xs">.{e}</Badge>
                          ))}
                          {(r.allowed_extensions ?? []).length === 0 && (
                            <span className="text-xs text-muted-foreground">— nenhuma —</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.ativo ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items?.length && (
                    <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground text-center py-8">
                      Nenhum tipo cadastrado.
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
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["evidence-requirements-admin"] });
            qc.invalidateQueries({ queryKey: ["evidence-requirements-active"] });
          }}
        />
      </div>
    </AppLayout>
  );
}

function EditDialog({
  open, onOpenChange, item, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Req | null;
  onSaved: () => void;
}) {
  const sb = supabase as any;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const [ordem, setOrdem] = useState(item?.ordem ?? 0);
  const [exts, setExts] = useState<string[]>(item?.allowed_extensions ?? []);
  const [extInput, setExtInput] = useState("");
  const [busy, setBusy] = useState(false);

  // re-sync when item changes
  useStateSync(item, { setNome, setSlug, setDescricao, setAtivo, setOrdem, setExts });

  function addExtFromInput() {
    const parts = extInput.split(/[,\s]+/).map(s => s.trim().replace(/^\./, "").toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    setExts((prev) => Array.from(new Set([...prev, ...parts])));
    setExtInput("");
  }
  function toggleCommon(ext: string) {
    setExts((prev) => prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]);
  }
  function removeExt(ext: string) {
    setExts((prev) => prev.filter(e => e !== ext));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !slug.trim()) return toast.error("Nome e slug são obrigatórios");
    const payload = {
      nome: nome.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"),
      descricao: descricao.trim() || null,
      ativo,
      ordem,
      allowed_extensions: exts,
    };
    setBusy(true);
    const res = item
      ? await sb.from("evidence_requirements").update(payload).eq("id", item.id)
      : await sb.from("evidence_requirements").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(item ? "Tipo atualizado" : "Tipo criado");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar tipo de evidência" : "Novo tipo de evidência"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={100} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={60}
                placeholder="ex: portfolio" />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={ordem} onChange={(e) => setOrdem(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label className="cursor-pointer">Ativo</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Extensões aceitas</Label>
            <p className="text-xs text-muted-foreground">
              Clique nas extensões abaixo para alternar, ou digite outras (separe por vírgula).
              Para portfólios, inclua vídeo, foto, áudio e texto.
            </p>
            <div className="flex flex-wrap gap-1">
              {COMMON_EXTENSIONS.map((ext) => {
                const active = exts.includes(ext);
                return (
                  <button
                    type="button"
                    key={ext}
                    onClick={() => toggleCommon(ext)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    .{ext}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={extInput}
                onChange={(e) => setExtInput(e.target.value)}
                placeholder="ex: epub, psd"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtFromInput(); } }}
              />
              <Button type="button" variant="outline" onClick={addExtFromInput}>Adicionar</Button>
            </div>
            {exts.length > 0 && (
              <div className="mt-2 p-2 rounded-md bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Selecionadas ({exts.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {exts.map((e) => (
                    <Badge key={e} variant="secondary" className="cursor-pointer" onClick={() => removeExt(e)}>
                      .{e} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// keep form state in sync when the editing target changes while dialog is open
function useStateSync(
  item: Req | null,
  s: {
    setNome: (v: string) => void;
    setSlug: (v: string) => void;
    setDescricao: (v: string) => void;
    setAtivo: (v: boolean) => void;
    setOrdem: (v: number) => void;
    setExts: (v: string[]) => void;
  }
) {
  const id = item?.id ?? "__new__";
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useReactEffect(() => {
    s.setNome(item?.nome ?? "");
    s.setSlug(item?.slug ?? "");
    s.setDescricao(item?.descricao ?? "");
    s.setAtivo(item?.ativo ?? true);
    s.setOrdem(item?.ordem ?? 0);
    s.setExts(item?.allowed_extensions ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

// re-export to avoid extra top-level import noise
import { useEffect as useReactEffect } from "react";

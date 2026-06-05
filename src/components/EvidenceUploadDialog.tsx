import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export const EVIDENCE_FILE_ACCEPT_FALLBACK =
  ".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.mp4,.mov,.zip";

interface Props {
  studentId: string;
  trigger: React.ReactNode;
  defaultRequirementId?: string;
}

export function EvidenceUploadDialog({ studentId, trigger, defaultRequirementId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const sb = supabase as any;
  const [open, setOpen] = useState(false);
  const [requirementId, setRequirementId] = useState(defaultRequirementId ?? "");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: requirements } = useQuery({
    queryKey: ["evidence-requirements-active"],
    queryFn: async () =>
      (await sb.from("evidence_requirements").select("*").eq("ativo", true).order("nome")).data ?? [],
  });

  function reset() {
    setRequirementId(defaultRequirementId ?? "");
    setTitulo(""); setDescricao(""); setPeriodo(""); setFile(null);
  }

  const selectedReq = (requirements as any[] | undefined)?.find((r) => r.id === requirementId);
  const allowedExts: string[] = selectedReq?.allowed_extensions?.length
    ? selectedReq.allowed_extensions
    : ["pdf","docx","pptx","xlsx","jpg","jpeg","png","webp","mp4","mov","zip"];
  const acceptAttr = allowedExts.map((e) => `.${e}`).join(",");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !requirementId || !titulo.trim()) return;
    const req = selectedReq;
    if (!req) return toast.error("Categoria inválida");

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExts.includes(ext)) {
        return toast.error(`Tipo de arquivo não permitido para "${req.nome}": .${ext}`);
      }
    }

    setBusy(true);
    let arquivo_url: string | null = null;
    if (file) {
      const path = `${user.id}/${studentId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("student-evidences").upload(path, file);
      if (upErr) { toast.error(upErr.message); setBusy(false); return; }
      arquivo_url = path;
    }
    const { error } = await sb.from("student_evidences").insert({
      student_id: studentId,
      created_by: user.id,
      requirement_id: req.id,
      evidence_type: req.slug,
      titulo: titulo.trim(),
      descricao: descricao || null,
      periodo: periodo || null,
      arquivo_url,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Evidência enviada");
    reset();
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["student-evidences", studentId] });
    qc.invalidateQueries({ queryKey: ["class-evidences"] });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar evidência</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Categoria</Label>
            <Select value={requirementId} onValueChange={setRequirementId}>
              <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
              <SelectContent>
                {(requirements as any[] | undefined)?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} />
          </div>
          <div>
            <Label>Observação (opcional)</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} maxLength={1000} />
          </div>
          <div>
            <Label>Período (opcional)</Label>
            <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="ex.: 1º trimestre" maxLength={50} />
          </div>
          <div>
            <Label>Arquivo</Label>
            <Input type="file" accept={EVIDENCE_FILE_ACCEPT} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, XLSX, JPG, PNG, WEBP, MP4, MOV, ZIP</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !requirementId || !titulo.trim()}>
              {busy ? "Enviando..." : <><Upload className="h-4 w-4 mr-2" /> Enviar evidência</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

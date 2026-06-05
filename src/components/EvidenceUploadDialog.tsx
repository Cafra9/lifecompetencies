import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { analisarEvidenciaAluno } from "@/lib/evidence-analysis.functions";

export const EVIDENCE_FILE_ACCEPT_FALLBACK =
  ".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.mp4,.mov,.zip";

const DEFAULT_EXTENSIONS = ["pdf", "docx", "pptx", "xlsx", "jpg", "jpeg", "png", "webp", "mp4", "mov", "zip"];

const LEGACY_EVIDENCE_TYPES = new Set([
  "rubrica",
  "portfolio",
  "notas",
  "observacao_comportamento",
  "relatorio_descritivo",
  "producoes_alunos",
  "evidencias_fotograficas",
  "video",
  "avaliacoes_academicas",
  "projetos",
  "outro",
]);

function legacyEvidenceType(slug: string) {
  return LEGACY_EVIDENCE_TYPES.has(slug) ? slug : "outro";
}

interface Props {
  studentId: string;
  trigger: React.ReactNode;
  defaultRequirementId?: string;
}

export function EvidenceUploadDialog({ studentId, trigger, defaultRequirementId }: Props) {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const sb = supabase as any;
  const analisar = useServerFn(analisarEvidenciaAluno);
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
    setTitulo("");
    setDescricao("");
    setPeriodo("");
    setFile(null);
  }

  const selectedReq = (requirements as any[] | undefined)?.find((r) => r.id === requirementId);
  const allowedExts: string[] = selectedReq?.allowed_extensions?.length
    ? selectedReq.allowed_extensions.map((e: string) => e.toLowerCase())
    : DEFAULT_EXTENSIONS;
  const acceptAttr = allowedExts.map((e) => `.${e}`).join(",");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !session || !requirementId || !titulo.trim()) return;
    const req = selectedReq;
    if (!req) return toast.error("Categoria inválida");

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExts.includes(ext)) {
        return toast.error(`Tipo de arquivo não permitido para "${req.nome}": .${ext}`);
      }
    }

    setBusy(true);
    try {
      const { data: studentMeta } = await sb
        .from("students")
        .select("class_id, class:classes(school_year_id)")
        .eq("id", studentId)
        .maybeSingle();
      const classId = studentMeta?.class_id ?? null;
      const classRel = Array.isArray(studentMeta?.class) ? studentMeta.class[0] : studentMeta?.class;
      const schoolYearId = classRel?.school_year_id ?? null;
      let arquivo_url: string | null = null;
      if (file) {
        const dot = file.name.lastIndexOf(".");
        const rawBase = dot > 0 ? file.name.slice(0, dot) : file.name;
        const rawExt = dot > 0 ? file.name.slice(dot + 1) : "";
        const sanitize = (s: string) =>
          s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^[._-]+|[._-]+$/g, "");
        const safeBase = (sanitize(rawBase) || "arquivo").slice(0, 80);
        const safeExt = sanitize(rawExt).toLowerCase().slice(0, 10);
        const safeName = safeExt ? `${safeBase}.${safeExt}` : safeBase;
        const path = `${user.id}/${studentId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from("student-evidences").upload(path, file);
        if (upErr) throw upErr;
        arquivo_url = path;
      }

      const { data: inserted, error } = await sb
        .from("student_evidences")
        .insert({
          student_id: studentId,
          class_id: classId,
          school_year_id: schoolYearId,
          created_by: user.id,
          requirement_id: req.id,
          evidence_type: legacyEvidenceType(String(req.slug)),
          titulo: titulo.trim(),
          descricao: descricao || null,
          periodo: periodo || null,
          arquivo_url,
          arquivo_nome: file?.name ?? null,
          arquivo_mime: file?.type || null,
          arquivo_tamanho: file?.size ?? null,
          analysis_status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Evidência enviada. Analisando para a IA...");
      qc.invalidateQueries({ queryKey: ["student-evidences", studentId] });
      qc.invalidateQueries({ queryKey: ["class-evidences"] });

      const res = await analisar({ data: { evidenceId: inserted.id, accessToken: session.access_token } });
      if (res.status === "analyzed") {
        toast.success("Evidência analisada e disponível para relatórios.");
      } else if (res.status === "skipped") {
        toast.warning(res.error || "Evidência salva, mas ignorada pela análise automática por limite técnico.");
      } else if (res.error) {
        toast.warning(`Evidência salva, mas a análise falhou: ${res.error}`);
      }

      reset();
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["student-evidences", studentId] });
      qc.invalidateQueries({ queryKey: ["class-evidences"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar evidência");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar evidência</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {defaultRequirementId ? (
            selectedReq ? (
              <div className="text-sm">
                <Label className="text-muted-foreground">Categoria</Label>
                <div className="font-medium">{selectedReq.nome}</div>
              </div>
            ) : null
          ) : (
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
          )}
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
            <Input type="file" accept={acceptAttr} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground mt-1">Aceito: {allowedExts.map(e => `.${e}`).join(", ")}</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !requirementId || !titulo.trim()}>
              {busy ? "Enviando e analisando..." : <><Upload className="h-4 w-4 mr-2" /> Enviar evidência</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

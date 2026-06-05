import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Paperclip, Eye } from "lucide-react";
import { toast } from "sonner";
import { EvidenceUploadDialog } from "./EvidenceUploadDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  studentName: string;
}

export function EvidencesDialog({ open, onOpenChange, studentId, studentName }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const sb = supabase as any;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["student-evidences", studentId],
    enabled: open && !!studentId,
    queryFn: async () => {
      const { data } = await sb
        .from("student_evidences")
        .select("id, titulo, descricao, periodo, arquivo_url, created_at, created_by, requirement_id, evidence_type")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as any[];
      const reqIds = [...new Set(rows.map((r) => r.requirement_id).filter(Boolean))];
      const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))];
      const [reqs, profs] = await Promise.all([
        reqIds.length
          ? sb.from("evidence_requirements").select("id, nome").in("id", reqIds)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? sb.from("profiles").select("id, nome").in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);
      const reqMap = new Map((reqs.data ?? []).map((r: any) => [r.id, r.nome]));
      const profMap = new Map((profs.data ?? []).map((p: any) => [p.id, p.nome]));
      return rows.map((r) => ({
        ...r,
        tipo_nome: reqMap.get(r.requirement_id) ?? r.evidence_type ?? "—",
        professor_nome: profMap.get(r.created_by) ?? "—",
      }));
    },
  });

  async function abrir(path: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("student-evidences")
      .createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) return toast.error("Erro ao gerar link");
    window.open(data.signedUrl, "_blank");
  }

  async function baixar(path: string | null, nome: string) {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("student-evidences")
      .createSignedUrl(path, 60 * 10, { download: nome });
    if (error || !data?.signedUrl) return toast.error("Erro ao baixar");
    window.location.href = data.signedUrl;
  }

  async function excluir(item: any) {
    if (!window.confirm(`Excluir evidência "${item.titulo}"?`)) return;
    if (item.arquivo_url) {
      await supabase.storage.from("student-evidences").remove([item.arquivo_url]);
    }
    const { error } = await sb.from("student_evidences").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Evidência excluída");
    qc.invalidateQueries({ queryKey: ["student-evidences", studentId] });
    qc.invalidateQueries({ queryKey: ["student-evidences-count", studentId] });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" /> Evidências — {studentName}
          </DialogTitle>
          <DialogDescription>
            Anexe portfólios, rubricas, observações, produções e demais evidências usadas no relatório de Competências para a Vida.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <EvidenceUploadDialog
            studentId={studentId}
            trigger={
              <Button size="sm" className="gap-2">
                <Paperclip className="h-4 w-4" /> Adicionar Evidência
              </Button>
            }
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Nenhuma evidência cadastrada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((it: any) => (
              <div key={it.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{it.tipo_nome}</Badge>
                      <span className="font-medium truncate">{it.titulo}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {it.professor_nome} · {new Date(it.created_at).toLocaleDateString("pt-BR")}
                      {it.periodo ? ` · ${it.periodo}` : ""}
                    </div>
                    {it.descricao && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{it.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {it.arquivo_url && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => abrir(it.arquivo_url)} title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => baixar(it.arquivo_url, it.titulo)} title="Baixar">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {it.created_by === user?.id && (
                      <Button size="icon" variant="ghost" onClick={() => excluir(it)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useEvidenceCount(studentId: string) {
  const sb = supabase as any;
  return useQuery({
    queryKey: ["student-evidences-count", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { count } = await sb
        .from("student_evidences")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      return count ?? 0;
    },
  });
}

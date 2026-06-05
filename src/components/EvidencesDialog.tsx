import { useMemo } from "react";
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
import {
  Download,
  Trash2,
  Paperclip,
  Eye,
  CheckCircle2,
  Circle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { EvidenceUploadDialog } from "./EvidenceUploadDialog";

export type RequirementItem = {
  id: string;
  nome: string;
  orientacao?: string | null;
  obrigatorio?: boolean;
  allowed_extensions?: string[];
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  studentName: string;
  requirements?: RequirementItem[];
}

export function EvidencesDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  requirements = [],
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const sb = supabase as any;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["student-evidences", studentId],
    enabled: open && !!studentId,
    queryFn: async () => {
      const { data } = await sb
        .from("student_evidences")
        .select(
          "id, titulo, descricao, periodo, arquivo_url, created_at, created_by, requirement_id, evidence_type",
        )
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

  const byReq = useMemo(() => {
    const map = new Map<string, any[]>();
    (items as any[]).forEach((it) => {
      const k = it.requirement_id ?? "__sem__";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    });
    return map;
  }, [items]);

  const requiredIds = new Set(requirements.map((r) => r.id));
  const fulfilled = requirements.filter((r) => (byReq.get(r.id)?.length ?? 0) > 0).length;
  const orphan = (items as any[]).filter(
    (it) => !it.requirement_id || !requiredIds.has(it.requirement_id),
  );

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
    qc.invalidateQueries({ queryKey: ["student-evidences-progress", studentId] });
  }

  function ItemCard({ it }: { it: any }) {
    return (
      <div className="border rounded-md p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{it.titulo}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
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
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" /> Evidências — {studentName}
          </DialogTitle>
          <DialogDescription>
            {requirements.length > 0 ? (
              <span>
                Evidências exigidas para esta turma:{" "}
                <strong>
                  {fulfilled}/{requirements.length}
                </strong>{" "}
                atendidas.
              </span>
            ) : (
              <span>
                Nenhuma evidência foi definida para esta turma. Configure os requisitos em Configurações → Requisitos por ano.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => {
              const evs = byReq.get(req.id) ?? [];
              const done = evs.length > 0;
              return (
                <div key={req.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-2 min-w-0">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{req.nome}</span>
                          {req.obrigatorio === false ? (
                            <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Obrigatório</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {evs.length} {evs.length === 1 ? "envio" : "envios"}
                          </Badge>
                        </div>
                        {req.orientacao && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                            {req.orientacao}
                          </p>
                        )}
                      </div>
                    </div>
                    <EvidenceUploadDialog
                      studentId={studentId}
                      defaultRequirementId={req.id}
                      trigger={
                        <Button size="sm" variant="outline" className="gap-1 shrink-0">
                          <Plus className="h-4 w-4" /> Adicionar
                        </Button>
                      }
                    />
                  </div>

                  {evs.length > 0 && (
                    <div className="space-y-2 pl-7">
                      {evs.map((it) => <ItemCard key={it.id} it={it} />)}
                    </div>
                  )}
                </div>
              );
            })}

            {orphan.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="font-medium text-sm">Outras evidências</div>
                <p className="text-xs text-muted-foreground">
                  Evidências sem categoria ou cuja categoria não faz parte dos requisitos atuais da turma.
                </p>
                {orphan.map((it: any) => (
                  <div key={it.id}>
                    <div className="text-xs text-muted-foreground mb-1">
                      <Badge variant="secondary" className="text-[10px] mr-2">{it.tipo_nome}</Badge>
                    </div>
                    <ItemCard it={it} />
                  </div>
                ))}
              </div>
            )}

            {requirements.length === 0 && orphan.length === 0 && (
              <p className="text-sm text-muted-foreground py-10 text-center">
                Nenhuma evidência cadastrada ainda.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useEvidenceProgress(studentId: string, requiredIds: string[]) {
  const sb = supabase as any;
  const key = requiredIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["student-evidences-progress", studentId, key],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await sb
        .from("student_evidences")
        .select("requirement_id")
        .eq("student_id", studentId);
      const have = new Set(
        ((data ?? []) as any[]).map((r) => r.requirement_id).filter(Boolean),
      );
      const fulfilled = requiredIds.filter((id) => have.has(id)).length;
      return { fulfilled, total: requiredIds.length };
    },
  });
}

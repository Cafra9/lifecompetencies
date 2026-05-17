import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { SEGMENT_LABEL } from "@/lib/competencies";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil/")({ component: () => <AppLayout><Perfil /></AppLayout> });

function Perfil() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nome: "", segmento: "", disciplina: "" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => user ? (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data : null,
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) setForm({ nome: profile.nome || "", segmento: profile.segmento || "", disciplina: profile.disciplina || "" });
  }, [profile]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      nome: form.nome,
      segmento: (form.segmento || null) as any,
      disciplina: form.disciplina || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["profile", user.id] }); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Atualize seus dados profissionais.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
            <div><Label>E-mail</Label><Input value={user?.email || ""} disabled /></div>
            <div>
              <Label>Segmento principal</Label>
              <Select value={form.segmento} onValueChange={(v) => setForm({ ...form, segmento: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{Object.entries(SEGMENT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Disciplina</Label><Input value={form.disciplina} onChange={(e) => setForm({ ...form, disciplina: e.target.value })} /></div>
            <div>
              <Label className="block mb-2">Papéis</Label>
              <div className="flex gap-1 flex-wrap">{roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}</div>
            </div>
            <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

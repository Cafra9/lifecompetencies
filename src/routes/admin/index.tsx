import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({ component: () => <AppLayout><Admin /></AppLayout> });

function Admin() {
  const { loading } = useAuth();
  const isAdmin = useIsAdmin();
  if (loading) return <div>Carregando…</div>;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administração</h1>
        <p className="text-muted-foreground">Gerencie a estrutura pedagógica e usuários da plataforma.</p>
      </div>
      <Tabs defaultValue="competencias">
        <TabsList>
          <TabsTrigger value="competencias">Competências & Habilidades</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="competencias" className="mt-4"><CompsAdmin /></TabsContent>
        <TabsContent value="usuarios" className="mt-4"><UsersAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function CompsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-comps"],
    queryFn: async () => (await supabase.from("competencies").select("*, skills(*)").order("ordem")).data ?? [],
  });

  async function saveSkill(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("skills").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Habilidade atualizada"); qc.invalidateQueries({ queryKey: ["admin-comps"] }); }
  }
  async function saveComp(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("competencies").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Competência atualizada"); qc.invalidateQueries({ queryKey: ["admin-comps"] }); }
  }

  return (
    <div className="space-y-4">
      {data?.map((c: any) => (
        <Card key={c.id}>
          <CardHeader><CardTitle className="text-base">{c.nome}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <CompForm comp={c} onSave={(patch) => saveComp(c.id, patch)} />
            <div className="border-t pt-4">
              <div className="font-medium text-sm mb-2">Habilidades</div>
              <div className="grid gap-2">
                {c.skills?.sort((a: any, b: any) => a.ordem - b.ordem).map((s: any) => (
                  <SkillForm key={s.id} skill={s} onSave={(patch) => saveSkill(s.id, patch)} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompForm({ comp, onSave }: any) {
  const [edit, setEdit] = useState(false);
  const [nome, setNome] = useState(comp.nome);
  const [descricao, setDescricao] = useState(comp.descricao || "");
  if (!edit) return <Button variant="ghost" size="sm" onClick={() => setEdit(true)}><Pencil className="h-3 w-3 mr-1" /> Editar competência</Button>;
  return (
    <div className="space-y-2 bg-muted/50 p-3 rounded">
      <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} /></div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { onSave({ nome, descricao }); setEdit(false); }}><Save className="h-3 w-3 mr-1" /> Salvar</Button>
        <Button size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancelar</Button>
      </div>
    </div>
  );
}
function SkillForm({ skill, onSave }: any) {
  const [nome, setNome] = useState(skill.nome);
  const [descricao, setDescricao] = useState(skill.descricao || "");
  return (
    <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-end p-2 border rounded">
      <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
      <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" />
      <Button size="sm" onClick={() => onSave({ nome, descricao })}>Salvar</Button>
    </div>
  );
}

function UsersAdmin() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("nome");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      return (profiles ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role) }));
    },
  });

  async function toggleRole(userId: string, role: string, has: boolean) {
    if (has) await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    else await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div className="space-y-2">
      {users?.map((u: any) => (
        <Card key={u.id}>
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-medium">{u.nome}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["professor", "coordenador", "admin"].map((r) => {
                const has = u.roles.includes(r);
                return (
                  <Button key={r} size="sm" variant={has ? "default" : "outline"} onClick={() => toggleRole(u.id, r, has)}>{r}</Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

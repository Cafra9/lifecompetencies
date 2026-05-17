import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" />;

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else nav({ to: "/" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: String(f.get("nome")) },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Você já pode entrar.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">CV</div>
          <CardTitle className="text-2xl">Competências para a Vida</CardTitle>
          <CardDescription>Formação e Avaliação Docente</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="entrar">
              <form onSubmit={signIn} className="space-y-3 mt-4">
                <div><Label htmlFor="e-email">E-mail</Label><Input id="e-email" name="email" type="email" required autoComplete="email" /></div>
                <div><Label htmlFor="e-pass">Senha</Label><Input id="e-pass" name="password" type="password" required autoComplete="current-password" /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="criar">
              <form onSubmit={signUp} className="space-y-3 mt-4">
                <div><Label htmlFor="s-nome">Nome completo</Label><Input id="s-nome" name="nome" required /></div>
                <div><Label htmlFor="s-email">E-mail</Label><Input id="s-email" name="email" type="email" required autoComplete="email" /></div>
                <div><Label htmlFor="s-pass">Senha</Label><Input id="s-pass" name="password" type="password" required minLength={6} autoComplete="new-password" /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Criando..." : "Criar conta"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

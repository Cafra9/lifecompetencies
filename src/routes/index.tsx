import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: () => (
    <AppLayout>
      <Placeholder
        title="Dashboard"
        desc="Visão geral da plataforma — placeholder."
      />
    </AppLayout>
  ),
});

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{desc}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Conteúdo desta página será implementado em breve.
        </CardContent>
      </Card>
    </div>
  );
}

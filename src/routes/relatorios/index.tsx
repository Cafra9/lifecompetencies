import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/relatorios/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Relatórios" desc="Gráficos e exportação em PDF — placeholder." />
    </AppLayout>
  ),
});

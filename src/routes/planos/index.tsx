import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/planos/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Planos de Aula" desc="Repositório colaborativo — placeholder." />
    </AppLayout>
  ),
});

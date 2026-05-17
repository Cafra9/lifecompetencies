import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Dashboard" desc="Visão geral da plataforma — placeholder." />
    </AppLayout>
  ),
});

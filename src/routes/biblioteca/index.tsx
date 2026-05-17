import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/biblioteca/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Biblioteca Pedagógica" desc="Recursos e materiais — placeholder." />
    </AppLayout>
  ),
});

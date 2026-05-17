import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/formacao/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Formação Docente" desc="Trilhas e quiz — placeholder." />
    </AppLayout>
  ),
});

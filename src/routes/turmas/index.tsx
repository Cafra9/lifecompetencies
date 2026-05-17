import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/turmas/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Minhas Turmas" desc="Turmas e alunos — placeholder." />
    </AppLayout>
  ),
});

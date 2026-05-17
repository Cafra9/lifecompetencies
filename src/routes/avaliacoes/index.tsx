import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/avaliacoes/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Avaliações" desc="Avaliar habilidades dos alunos — placeholder." />
    </AppLayout>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/perfil/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Meu Perfil" desc="Dados profissionais — placeholder." />
    </AppLayout>
  ),
});

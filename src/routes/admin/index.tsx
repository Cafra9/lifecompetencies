import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AppLayout>
      <Placeholder title="Administração" desc="Gestão da plataforma — placeholder." />
    </AppLayout>
  ),
});

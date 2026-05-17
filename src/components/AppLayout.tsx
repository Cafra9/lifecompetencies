import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import type { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  // Auth temporariamente desativada para facilitar testes.
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
          <SidebarTrigger />
        </header>
        <main className="p-6 max-w-7xl mx-auto w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

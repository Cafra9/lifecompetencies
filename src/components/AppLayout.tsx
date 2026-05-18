import { Link, useLocation } from "@tanstack/react-router";
import { BookMarked, LayoutGrid, ClipboardCheck, Library, Users2, LogOut } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/avaliacoes", label: "Avaliações", icon: ClipboardCheck },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/planos", label: "Práticas Compartilhadas", icon: Users2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_250)]">
      <header className="bg-background border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm">ISP Life Competencies</div>
              <div className="text-xs text-muted-foreground">Formação Docente</div>
            </div>
          </div>
          <nav className="flex-1 flex items-center justify-center gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">Lisandra</div>
              <div className="text-xs text-muted-foreground">Coordenador</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

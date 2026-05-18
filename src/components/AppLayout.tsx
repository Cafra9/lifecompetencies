import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, ClipboardCheck, Library, Users2, LogOut } from "lucide-react";
import frameworkIcon from "@/assets/framework.png";
import aubrickLogo from "@/assets/aubrick-isp-logo.jpg";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/avaliacoes", label: "Avaliações", icon: ClipboardCheck },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/planos", label: "Práticas Compartilhadas", icon: Users2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName =
    (user?.user_metadata?.nome as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "Lisandra");
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };
  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_250)]">
      <header className="bg-background border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img src={frameworkIcon} alt="Framework ISP" className="h-11 w-11 rounded-full object-cover" />
            <div className="leading-tight flex items-center gap-3">
              <img src={aubrickLogo} alt="Aubrick · ISP International Schools Partnership" className="h-7 w-auto" />
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
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">Professora</div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { HAS_TEST_CREDENTIALS, TEST_AUTO_LOGIN, TEST_USER_EMAIL, TEST_USER_PASSWORD } from "@/lib/test-auth";

type Role = "professor" | "coordenador" | "diretora" | "admin";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, roles: [], loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function applySession(s: Session | null) {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await loadRoles(s.user.id);
      } else {
        setRoles([]);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void applySession(s);
    });

    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await applySession(data.session);
        if (active) setLoading(false);
        return;
      }

      if (TEST_AUTO_LOGIN) {
        if (!HAS_TEST_CREDENTIALS) {
          console.error("VITE_TEST_AUTO_LOGIN está ativo, mas VITE_TEST_USER_EMAIL/VITE_TEST_USER_PASSWORD não foram configurados.");
          await applySession(null);
          if (active) setLoading(false);
          return;
        }

        const { data: loginData, error } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        });

        if (error) {
          console.error("Falha no login automático de teste:", error.message);
          await applySession(null);
          if (active) setLoading(false);
          return;
        }

        await applySession(loginData.session);
        if (active) setLoading(false);
        return;
      }

      await applySession(null);
      if (active) setLoading(false);
    }

    void initAuth();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadRoles(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as Role));
  }

  const signOut = async () => {
    if (TEST_AUTO_LOGIN) return;
    await supabase.auth.signOut();
    setRoles([]);
  };

  return <Ctx.Provider value={{ user, session, roles, loading, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
export const useIsAdmin = () => useAuth().roles.includes("admin");
export const useIsDiretora = () => useAuth().roles.includes("diretora");
export const useIsCoordenador = () => useAuth().roles.includes("coordenador");
export const useIsStaff = () => {
  const { roles } = useAuth();
  return roles.some((r) => r === "admin" || r === "diretora" || r === "coordenador");
};
export const useCanConfigure = () => {
  const { roles } = useAuth();
  return roles.some((r) => r === "admin" || r === "diretora" || r === "coordenador");
};

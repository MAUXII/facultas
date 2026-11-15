"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUsuario } from "@/hooks/useUsuario";
import { isGuestSession } from "@/lib/guest";
import { routes } from "@/lib/routes";

const SKIP_PATHS = ["/auth", "/onboarding"];

export function useInstitutionGate() {
  const { usuario, loading } = useUsuario();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!usuario) return;
    // Visitante (login anônimo via convite) não tem instituição e não deve
    // ser mandado para o onboarding: ele só entra na sala do convite.
    if (isGuestSession(user, usuario)) return;

    const skip = SKIP_PATHS.some(
      (p) => pathname === p || pathname?.startsWith(`${p}/`)
    );

    if (!usuario.institution_id && !skip) {
      router.replace(routes.onboarding);
      return;
    }

    if (usuario.institution_id && pathname === routes.onboarding) {
      router.replace(routes.discover);
    }
  }, [usuario, user, loading, pathname, router]);

  return { usuario, loading };
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUsuario } from "@/hooks/useUsuario";
import { routes } from "@/lib/routes";

const SKIP_PATHS = ["/auth", "/onboarding"];

export function useInstitutionGate() {
  const { usuario, loading } = useUsuario();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!usuario) return;

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
  }, [usuario, loading, pathname, router]);

  return { usuario, loading };
}

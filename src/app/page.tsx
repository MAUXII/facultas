"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUsuario } from "@/hooks/useUsuario";
import { routes } from "@/lib/routes";

export default function Home() {
  const router = useRouter();
  const { user, loading: loadingAuth } = useAuth();
  const { usuario, loading: loadingUser } = useUsuario();

  useEffect(() => {
    if (loadingAuth || loadingUser) return;
    if (!user) {
      router.replace(routes.login);
      return;
    }
    if (!usuario?.institution_id) {
      router.replace(routes.onboarding);
      return;
    }
    router.replace(routes.discover);
  }, [user, usuario, loadingAuth, loadingUser, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)]">
      <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
    </div>
  );
}

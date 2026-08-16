"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

/** Perfil abre como dialog na TopNav. */
export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(routes.communities);
  }, [router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)]">
      <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
    </div>
  );
}

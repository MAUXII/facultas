"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loginHref } from "@/lib/login-next";

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;
    const search = window.location.search;
    router.replace(loginHref(`${pathname}${search}`));
  }, [loading, user, pathname, router]);

  return { user, loading };
}

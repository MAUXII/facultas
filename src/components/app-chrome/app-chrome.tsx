"use client";

import { usePathname } from "next/navigation";
import { OverlayScrollbar } from "@/components/overlay-scrollbar/overlay-scrollbar";
import { TopNav } from "@/components/top-nav/top-nav";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketing = pathname === "/";

  return (
    <>
      {marketing ? null : <TopNav />}
      {children}
      {marketing ? null : <OverlayScrollbar />}
    </>
  );
}

"use client";

import { ReactNode } from "react";
import { useInstitutionGate } from "@/hooks/useInstitutionGate";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  useInstitutionGate();

  return (
    <div className={cn("min-h-screen bg-[var(--ff-bg)] text-[var(--ff-ink)]", className)}>
      <div
        className={cn(
          "ff-shell pb-16 pt-[68px] md:pt-[72px]",
          wide && "ff-shell-wide",
        )}
      >
        {children}
      </div>
    </div>
  );
}

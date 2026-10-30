"use client";

import type { ComponentProps } from "react";
import { useSurface } from "@/components/surface-provider";
import { FrostGlassVariant, FrostGlassVariantProp, glassVariantStyles } from "@/lib/glass-variants";
import { cn } from "@/lib/utils";

import { Card, CardFooter } from "../card";
import { LiquidGlass, type LiquidGlassProps } from "./liquid-glass";

type GlassCardProps = ComponentProps<typeof Card> &
  FrostGlassVariantProp & { liquidProps?: Omit<LiquidGlassProps, "children">; surfaceClassName?: string };

type GlassCardFooterProps = ComponentProps<typeof CardFooter> & FrostGlassVariantProp;

const FLAT_CARD =
  "border border-white/10 bg-[var(--ff-surface)] shadow-none ring-0";

function GlassCard({
  className,
  glassVariant = "liquid-refract",
  liquidProps,
  surfaceClassName,
  ...props
}: GlassCardProps) {
  const { surface } = useSurface();

  if (surface === "flat") {
    return (
      <Card
        data-slot="glass-card"
        data-glass-variant={glassVariant}
        data-ff-surface-skin="flat"
        className={cn(FLAT_CARD, "rounded-2xl", surfaceClassName, className)}
        {...props}
      />
    );
  }

  if (glassVariant === "liquid-refract") {
    return (
      <LiquidGlass {...liquidProps} className={cn("rounded-2xl", surfaceClassName, liquidProps?.className)}>
        <Card
          data-slot="glass-card"
          data-glass-variant={glassVariant}
          className={cn("bg-transparent border-0 shadow-none ring-0", className)}
          {...props}
        />
      </LiquidGlass>
    );
  }

  return (
    <Card
      data-slot="glass-card"
      data-glass-variant={glassVariant}
      className={cn(glassVariantStyles[glassVariant], className)}
      {...props}
    />
  );
}

const footerVariantStyles: Record<FrostGlassVariant, string> = {
  clear: "bg-white/10 dark:bg-black/10",
  frosted: "bg-white/20 dark:bg-black/20",
  subtle: "bg-white/15 dark:bg-white/[0.04]",
  liquid: "bg-white/15 dark:bg-white/[0.06] [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.45)]",
  "liquid-refract": "bg-white/10 dark:bg-white/[0.04]",
};

function GlassCardFooter({ className, glassVariant = "liquid-refract", ...props }: GlassCardFooterProps) {
  return (
    <CardFooter
      data-glass-variant={glassVariant}
      className={cn(footerVariantStyles[glassVariant], className)}
      {...props}
    />
  );
}

export { GlassCard, GlassCardFooter };

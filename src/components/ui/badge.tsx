import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[var(--ff-bg)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-white text-black hover:bg-white/90",
        secondary:
          "border-transparent bg-white/10 text-white/80 hover:bg-white/15",
        destructive:
          "border-transparent bg-red-500/90 text-white hover:bg-red-500",
        outline: "border-white/15 text-white/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  playRuixenClick,
  type ClickSoundKind,
} from "@/lib/ruixen-click";

type SoundLinkProps = ComponentProps<typeof Link> & {
  sound?: ClickSoundKind | false;
};

export function SoundLink({
  sound = "nav",
  onClick,
  ...props
}: SoundLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (sound) playRuixenClick(sound);
        onClick?.(e);
      }}
    />
  );
}

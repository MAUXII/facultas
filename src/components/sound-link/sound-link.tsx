"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { ClickSoundKind } from "@/lib/ruixen-click";

type SoundLinkProps = ComponentProps<typeof Link> & {
  sound?: ClickSoundKind | false;
};

const KIND_TO_ATTR: Record<ClickSoundKind, string> = {
  nav: "tap",
  action: "button",
  tab: "select",
  soft: "tap",
};

/** Som vem do SoundProvider via data-snd / href — evita double-play. */
export function SoundLink({
  sound = "nav",
  ...props
}: SoundLinkProps) {
  const dataSnd = sound === false ? undefined : KIND_TO_ATTR[sound];
  return <Link {...props} data-snd={dataSnd} />;
}

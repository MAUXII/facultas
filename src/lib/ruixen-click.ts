import { playSnd, type SndName } from "@/lib/snd";

export type ClickSoundKind = "nav" | "action" | "tab" | "soft";

const KIND_TO_SND: Record<ClickSoundKind, SndName> = {
  nav: "tap",
  action: "button",
  tab: "select",
  soft: "tap",
};

/** Compat: mapeia os kinds antigos para o pack SND01 do Leitour. */
export function playRuixenClick(kind: ClickSoundKind = "soft") {
  playSnd(KIND_TO_SND[kind] ?? "tap");
}

/** SND01 sine — Yasuhiro Tsuchiya / https://snd.dev/ (portado do Leitour). */
const BASE = "/audio/snd01";
const VOLUME = 0.2;

export type SndName =
  | "tap"
  | "tap1"
  | "tap2"
  | "tap3"
  | "tap4"
  | "tap5"
  | "button"
  | "select"
  | "caution"
  | "celebration"
  | "disabled"
  | "notification"
  | "toggleOn"
  | "toggleOff"
  | "type"
  | "swipe"
  | "transitionUp"
  | "transitionDown";

const TAP_SRC = [
  `${BASE}/tap_01.wav`,
  `${BASE}/tap_02.wav`,
  `${BASE}/tap_03.wav`,
  `${BASE}/tap_04.wav`,
  `${BASE}/tap_05.wav`,
] as const;

const TYPE_SRC = [
  `${BASE}/type_01.wav`,
  `${BASE}/type_02.wav`,
  `${BASE}/type_03.wav`,
  `${BASE}/type_04.wav`,
  `${BASE}/type_05.wav`,
] as const;

const SWIPE_SRC = [
  `${BASE}/swipe_01.wav`,
  `${BASE}/swipe_02.wav`,
  `${BASE}/swipe_03.wav`,
  `${BASE}/swipe_04.wav`,
  `${BASE}/swipe_05.wav`,
] as const;

const FILE: Record<Exclude<SndName, "tap" | "type" | "swipe">, string> = {
  tap1: TAP_SRC[0],
  tap2: TAP_SRC[1],
  tap3: TAP_SRC[2],
  tap4: TAP_SRC[3],
  tap5: TAP_SRC[4],
  button: `${BASE}/button.wav`,
  select: `${BASE}/select.wav`,
  caution: `${BASE}/caution.wav`,
  celebration: `${BASE}/celebration.wav`,
  disabled: `${BASE}/disabled.wav`,
  notification: `${BASE}/notification.wav`,
  toggleOn: `${BASE}/toggle_on.wav`,
  toggleOff: `${BASE}/toggle_off.wav`,
  transitionUp: `${BASE}/transition_up.wav`,
  transitionDown: `${BASE}/transition_down.wav`,
};

/** Um tap estável por destino — cada link da nav soa diferente. */
const TAP_BY_PATH: Record<string, SndName> = {
  "/": "tap1",
  "/communities": "tap1",
  "/discover": "tap3",
  "/calendar": "tap2",
  "/create": "tap4",
  "/profile": "tap5",
  "/auth/login": "tap5",
  "/auth/signup": "tap4",
  "/auth/avatar": "tap3",
  "/onboarding": "tap3",
};

const DATA_SND: Record<string, SndName> = {
  tap: "tap",
  tap1: "tap1",
  "tap-1": "tap1",
  tap2: "tap2",
  "tap-2": "tap2",
  tap3: "tap3",
  "tap-3": "tap3",
  tap4: "tap4",
  "tap-4": "tap4",
  tap5: "tap5",
  "tap-5": "tap5",
  button: "button",
  select: "select",
  caution: "caution",
  celebration: "celebration",
  disabled: "disabled",
  notification: "notification",
  "toggle-on": "toggleOn",
  toggleon: "toggleOn",
  "toggle-off": "toggleOff",
  toggleoff: "toggleOff",
  type: "type",
  swipe: "swipe",
  "transition-up": "transitionUp",
  "transition-down": "transitionDown",
  nav: "tap",
  action: "button",
  tab: "select",
  soft: "tap",
};

const cache = new Map<string, HTMLAudioElement>();
let lastTypeAt = 0;

const SND_MUTE_KEY = "ff-snd-muted";

export function isSndMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SND_MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSndMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SND_MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function srcFor(name: SndName): string {
  if (name === "tap") return pick(TAP_SRC);
  if (name === "type") return pick(TYPE_SRC);
  if (name === "swipe") return pick(SWIPE_SRC);
  return FILE[name];
}

function ensure(src: string): HTMLAudioElement {
  let el = cache.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = "auto";
    cache.set(src, el);
  }
  return el;
}

export function preloadSnd() {
  if (typeof window === "undefined") return;
  for (const src of TAP_SRC) ensure(src);
  for (const src of TYPE_SRC) ensure(src);
  for (const src of SWIPE_SRC) ensure(src);
  for (const src of Object.values(FILE)) ensure(src);
}

export function playSnd(name: SndName) {
  if (typeof window === "undefined") return;
  if (isSndMuted()) return;
  const src = srcFor(name);
  const node = ensure(src).cloneNode(true) as HTMLAudioElement;
  node.volume = VOLUME;
  void node.play().catch(() => undefined);
}

export function playTypeSnd() {
  const now = performance.now();
  if (now - lastTypeAt < 28) return;
  lastTypeAt = now;
  playSnd("type");
}

function normalizePath(href: string): string {
  try {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      const url = new URL(href);
      if (url.origin !== window.location.origin) return "";
      href = url.pathname;
    }
  } catch {
    return "";
  }
  const path = href.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function playSndForHref(href: string | null | undefined) {
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  const path = normalizePath(href);
  if (!path) return;
  if (path.startsWith("/communities/") && path !== "/communities") {
    playSnd("tap2");
    return;
  }
  playSnd(TAP_BY_PATH[path] ?? "tap");
}

export function playSndAttr(value: string | null | undefined) {
  if (!value) return;
  const name = DATA_SND[value.trim().toLowerCase()];
  if (name) playSnd(name);
}

const TYPE_SKIP = new Set([
  "Tab",
  "Escape",
  "Enter",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

export function shouldPlayTypeKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (TYPE_SKIP.has(e.key)) return false;
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

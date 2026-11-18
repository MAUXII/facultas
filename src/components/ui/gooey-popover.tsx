"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import {
  GOOEY_FILL_OPACITY,
  GOOEY_FROST,
  GooeyItem,
  GooeyShell,
} from "@/components/ui/gooey-shell";
import { cn } from "@/lib/utils";

/**
 * Menus e dialog gooey no padrão do Luma.
 *
 * Em movimento: duas peças no mesmo grupo Liquid (uma gota sobre o gatilho e o
 * painel). Ao abrir, o painel nasce dentro da gota e escorre até o lugar.
 * Parado: continua líquido — mesma silhueta, a ponte com o gatilho e a sombra
 * do goo; não há troca de estado. A cor é a do menu do Luma
 * (rgba(35,35,35,.8)) e o blur do fundo fica ligado do começo ao fim.
 *
 * Anti-piscada (medido quadro a quadro no Chrome):
 * - a primeira pintura do filtro SVG visível é cara (100ms+ sem GPU). Ela
 *   acontece na fase "in": o líquido já aparece, mas parado dentro da gota do
 *   gatilho; só depois de 3 quadros o painel começa a viajar. Assim a trava
 *   cai num quadro sem movimento e a viagem não é "pulada";
 * - o grupo Liquid do popover cobre só a área do menu, não a tela toda;
 * - a abertura usa easing por duração (não mola), para a viagem ocupar
 *   quadros de verdade em vez de terminar dentro de um quadro atrasado.
 */

type Phase = "closed" | "measure" | "in" | "open" | "rest" | "out" | "fade";

const OPEN_MS = 440;
const OPEN_TRANSITION = {
  duration: OPEN_MS,
  ease: "cubic-bezier(0.3, 1.22, 0.45, 1)",
};
const CLOSE_TRAVEL_MS = 260;
const CLOSE_TRANSITION = {
  duration: CLOSE_TRAVEL_MS,
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
};
const INSTANT_TRANSITION = { duration: 0.01, ease: "linear" as const };
const OPEN_FADE_MS = 140;
/** Espera máxima com o líquido parado na gota antes de viajar. */
const WARM_MS = 90;
const SETTLE_MS = OPEN_MS + 40;
const CLOSE_FADE_DELAY_MS = CLOSE_TRAVEL_MS - 60;
const CLOSE_FADE_MS = 160;

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}
const PAD = 8;
/** Px a mais no raio do blur para caber dentro do canto arredondado pelo goo. */
const FROST_RADIUS_EXTRA = 3;
/** Folga do grupo Liquid em volta do menu (goo + sombra). */
const REGION_PAD = 48;

/** Raios do Luma: painel 8 (--border-radius), itens 4 (--small-border-radius). */
export const GOOEY_PANEL_RADIUS = 8;

function usePhase(open: boolean, first: "measure" | "in") {
  const [phase, setPhase] = useState<Phase>("closed");

  useEffect(() => {
    if (open) {
      setPhase((p) =>
        p === "closed" || p === "out" || p === "fade" ? first : p,
      );
      return;
    }
    setPhase((p) => (p === "closed" ? p : "out"));
    const t1 = window.setTimeout(
      () => setPhase((p) => (p === "out" ? "fade" : p)),
      CLOSE_FADE_DELAY_MS,
    );
    const t2 = window.setTimeout(
      () => setPhase((p) => (p === "fade" || p === "out" ? "closed" : p)),
      CLOSE_FADE_DELAY_MS + CLOSE_FADE_MS + 30,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open, first]);

  // Espera a pintura cara passar antes de mover: anda quando um quadro longo
  // (a trava) já aconteceu, ou depois de WARM_MS se não houver trava.
  // O timeout só cobre aba sem rAF. Com reduced-motion, abre na hora.
  useEffect(() => {
    if (phase !== "in") return;
    const go = () => setPhase((p) => (p === "in" ? "open" : p));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      go();
      return;
    }
    const t0 = performance.now();
    let last = t0;
    let frames = 0;
    let raf = 0;
    const tick = (now: number) => {
      frames++;
      const stalled = now - last > 50;
      last = now;
      if ((frames >= 2 && stalled) || now - t0 >= WARM_MS) go();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t = window.setTimeout(go, 500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const settle = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 16
      : SETTLE_MS;
    const t = window.setTimeout(
      () => setPhase((p) => (p === "open" ? "rest" : p)),
      settle,
    );
    return () => window.clearTimeout(t);
  }, [phase]);

  return [phase, setPhase] as const;
}

/** Opacidade do líquido por fase (escrita direto no SVG, sem transição herdada). */
function liquidFade(phase: Phase) {
  switch (phase) {
    case "in":
    case "open":
      return { fillOpacity: GOOEY_FILL_OPACITY, fadeMs: 0 };
    case "out":
      return { fillOpacity: GOOEY_FILL_OPACITY, fadeMs: 0 };
    case "fade":
      return { fillOpacity: 0, fadeMs: CLOSE_FADE_MS };
    case "rest":
      // Parado continua líquido (conectado ao gatilho, com a sombra do goo).
      return { fillOpacity: GOOEY_FILL_OPACITY, fadeMs: 0 };
    default:
      return { fillOpacity: 0, fadeMs: 0 };
  }
}

/** Opacidade + transição da camada de blur por fase. */
function frostStyle(phase: Phase): CSSProperties {
  if (phase === "in") return { opacity: 1, transition: "none" };
  if (phase === "fade") {
    return { opacity: 0, transition: `opacity ${CLOSE_FADE_MS}ms ease-out` };
  }
  if (phase === "measure" || phase === "closed") {
    return { opacity: 0, transition: "none" };
  }
  return { opacity: 1, transition: `opacity ${OPEN_FADE_MS}ms ease-out` };
}

/**
 * Blur do fundo por baixo do conteúdo (o frost do Luma). A cor vem do líquido,
 * em repouso também. O raio fica um pouco maior que o do painel porque o goo
 * arredonda os cantos da silhueta; assim o blur nunca passa da borda líquida.
 */
function Surface({ phase, radius }: { phase: Phase; radius: number }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", GOOEY_FROST)}
      style={{ borderRadius: radius + FROST_RADIUS_EXTRA, ...frostStyle(phase) }}
    />
  );
}

function contentClass(phase: Phase) {
  return phase === "open" || phase === "rest"
    ? "opacity-100 delay-150 duration-200"
    : "opacity-0 duration-75";
}

/** Escape fecha, exceto quando um popover Radix interno está aberto (ele fecha primeiro). */
// Pilha de camadas abertas: o Esc fecha só a de cima (popover dentro de dialog).
const escapeStack: { current: () => void }[] = [];

function useEscape(active: boolean, onClose: () => void) {
  const handler = useRef(onClose);
  handler.current = onClose;

  useEffect(() => {
    if (!active) return;
    const entry = { current: () => handler.current() };
    escapeStack.push(entry);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (escapeStack[escapeStack.length - 1] !== entry) return;
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      entry.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = escapeStack.indexOf(entry);
      if (i >= 0) escapeStack.splice(i, 1);
    };
  }, [active]);
}

/** Foca o primeiro campo do painel quando ele chega (ou o próprio painel). */
function useInitialFocus(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  fallbackToPanel: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const field = panel?.querySelector<HTMLElement>(
      '[contenteditable="true"], textarea, input:not([type="hidden"]):not([type="file"])',
    );
    const target = field ?? (fallbackToPanel ? panel : null);
    target?.focus({ preventScroll: true });
    if (!target) return;
    return () => prev?.focus?.({ preventScroll: true });
  }, [active, ref, fallbackToPanel]);
}

/** Raio visível do gatilho: o do próprio elemento ou de um ancestral próximo (ex.: pill de vidro). */
function radiusOf(el: HTMLElement | null | undefined, height: number) {
  let node: HTMLElement | null | undefined = el;
  for (let i = 0; node && i < 3; i++, node = node.parentElement) {
    const v = parseFloat(getComputedStyle(node).borderTopLeftRadius);
    if (Number.isFinite(v) && v > 0) return Math.min(v, height / 2);
  }
  return Math.min(GOOEY_PANEL_RADIUS, height / 2);
}

type Anchor = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

function anchorOf(el: HTMLElement | null | undefined): Anchor | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    radius: radiusOf(el, r.height),
  };
}

/**
 * Gota sobre o gatilho. O conteúdo nítido (cópia do gatilho) fica 100% visível
 * do primeiro ao último quadro — sem fade — para o texto real embaixo, borrado
 * pelo blur, nunca aparecer sem a cópia por cima. Ao desmontar, a cópia some
 * no mesmo quadro em que o texto real volta a ficar nítido (são idênticos).
 */
function TriggerDrop({
  anchor,
  phase,
  offset = { x: 0, y: 0 },
  scale = 1,
  transition,
  children,
}: {
  anchor: Anchor;
  phase: Phase;
  offset?: { x: number; y: number };
  scale?: number;
  transition?: typeof OPEN_TRANSITION | typeof CLOSE_TRANSITION;
  children?: ReactNode;
}) {
  const hasContent = children != null;
  return (
    <GooeyItem
      radius={anchor.radius}
      scale={scale}
      transition={transition}
      className="absolute"
      style={{
        left: anchor.left - offset.x,
        top: anchor.top - offset.y,
        width: anchor.width,
        height: anchor.height,
      }}
    >
      <div
        className="relative flex h-full w-full items-center justify-center text-white"
        style={{ borderRadius: anchor.radius }}
      >
        {hasContent ? (
          <>
            <Surface phase={phase} radius={anchor.radius} />
            <div className="relative">{children}</div>
          </>
        ) : null}
      </div>
    </GooeyItem>
  );
}

type Placement = {
  anchor: Anchor;
  left: number;
  top: number;
  width: number;
  dx: number;
  dy: number;
  s0: number;
  /** Área do grupo Liquid (coordenadas da tela). */
  region: { x: number; y: number; w: number; h: number };
};

type GooeyPopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Largura do painel; ignorada com `matchAnchorWidth`. */
  width?: number;
  /** Painel com a largura do gatilho (como o menu de local do Luma). */
  matchAnchorWidth?: boolean;
  align?: "start" | "end";
  gap?: number;
  /**
   * Conteúdo nítido sobre a gota do gatilho (ex.: o mesmo ícone/label da pill).
   * Sem ele não há gota sobre o gatilho: o painel escorre da borda de baixo.
   */
  triggerContent?: ReactNode;
  radius?: number;
  className?: string;
  zIndex?: number;
  ariaLabel?: string;
  role?: "menu" | "dialog" | "listbox";
};

/** Popover gooey: a gota sai do gatilho e vira o painel. API parecida com GlassMenu. */
export function GooeyPopover({
  open,
  onClose,
  anchorRef,
  children,
  width = 260,
  matchAnchorWidth = false,
  align = "end",
  gap = 6,
  triggerContent,
  radius = GOOEY_PANEL_RADIUS,
  className,
  zIndex = 500,
  ariaLabel,
  role = "menu",
}: GooeyPopoverProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [phase, setPhase] = usePhase(open, "measure");
  const [place, setPlace] = useState<Placement | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const live = phase !== "closed";
  const close = useCallback(() => onClose(), [onClose]);
  const hasDrop = triggerContent != null;
  const moveTransition = reduceMotion
    ? INSTANT_TRANSITION
    : phase === "out" || phase === "fade"
      ? CLOSE_TRANSITION
      : OPEN_TRANSITION;

  useEscape(open && live, close);
  useInitialFocus(phase === "open" || phase === "rest", panelRef, false);

  useEffect(() => {
    if (!open || !live) return;
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close);
    };
  }, [open, live, close]);

  const panelWidth = (anchorWidth: number) =>
    Math.min(matchAnchorWidth ? anchorWidth : width, window.innerWidth - PAD * 2);

  useLayoutEffect(() => {
    if (phase !== "measure") return;
    const anchor = anchorOf(anchorRef.current);
    const el = measureRef.current;
    if (!anchor || !el) {
      setPhase("closed");
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = panelWidth(anchor.width);
    const h = el.offsetHeight;

    let left = align === "end" ? anchor.left + anchor.width - w : anchor.left;
    left = Math.max(PAD, Math.min(left, vw - PAD - w));
    let top = anchor.top + anchor.height + gap;
    const flip = top + h > vh - PAD && anchor.top - gap - h >= PAD;
    if (flip) top = anchor.top - gap - h;
    // Não cabe nem embaixo nem em cima: sobe o quanto precisar para caber na tela.
    else if (top + h > vh - PAD) top = Math.max(PAD, vh - PAD - h);

    const cx = left + w / 2;
    const cy = top + h / 2;
    const fromX = anchor.left + anchor.width / 2;
    // Com gota: nasce no centro do gatilho. Sem gota: na borda voltada ao painel.
    const fromY = hasDrop
      ? anchor.top + anchor.height / 2
      : flip
        ? anchor.top
        : anchor.top + anchor.height;

    const x0 = Math.min(anchor.left, left) - REGION_PAD;
    const y0 = Math.min(anchor.top, top) - REGION_PAD;
    const x1 = Math.max(anchor.left + anchor.width, left + w) + REGION_PAD;
    // Folga extra embaixo: o conteúdo pode crescer (ex.: lista filtrada).
    const y1 = Math.max(anchor.top + anchor.height, top + h) + REGION_PAD * 3;

    setPlace({
      anchor,
      left,
      top,
      width: w,
      dx: fromX - cx,
      dy: fromY - cy,
      s0: hasDrop
        ? Math.max(0.08, Math.min(anchor.height / h, anchor.width / w))
        : 0.06,
      region: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
    });
    setPhase("in");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, anchorRef, width, matchAnchorWidth, align, gap, hasDrop, setPhase]);

  if (!live || typeof document === "undefined") return null;

  const shown = phase === "open" || phase === "rest";
  const panel = (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "relative overflow-hidden p-1 text-white transition-opacity",
        contentClass(phase),
        className,
      )}
      style={{ borderRadius: radius }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );

  const off = place ? { x: place.region.x, y: place.region.y } : { x: 0, y: 0 };

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }} data-ff-gooey-popover="">
      <div
        aria-hidden
        className="absolute inset-0"
        onPointerDown={(e) => {
          e.preventDefault();
          close();
        }}
      />
      {phase === "measure" || !place ? (
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0"
          style={{ width: panelWidth(anchorRef.current?.offsetWidth ?? width) }}
        >
          {panel}
        </div>
      ) : (
        <GooeyShell
          className="pointer-events-none"
          style={{
            position: "absolute",
            left: place.region.x,
            top: place.region.y,
            width: place.region.w,
            height: place.region.h,
          }}
          {...liquidFade(phase)}
        >
          <GooeyItem
            x={shown ? 0 : reduceMotion ? 0 : place.dx}
            y={shown ? 0 : reduceMotion ? 0 : place.dy}
            scale={shown || reduceMotion ? 1 : place.s0}
            transition={moveTransition}
            className={cn("absolute", shown && "pointer-events-auto")}
            style={{
              left: place.left - off.x,
              top: place.top - off.y,
              width: place.width,
            }}
          >
            <div ref={panelRef} className="relative" style={{ borderRadius: radius }}>
              <Surface phase={phase} radius={radius} />
              {panel}
            </div>
          </GooeyItem>
          {/* Depois do painel: a cópia nítida do gatilho fica por cima do blur dele. */}
          {hasDrop ? (
            <TriggerDrop anchor={place.anchor} phase={phase} offset={off}>
              {triggerContent}
            </TriggerDrop>
          ) : null}
        </GooeyShell>
      )}
    </div>,
    document.body,
  );
}

/* ---------- Itens no padrão do Luma (lux-menu-item) ---------- */

const ITEM_BASE =
  "flex w-full items-center rounded-[4px] px-2 py-1.5 text-left text-sm leading-[21px] text-white outline-none transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#95959522] focus-visible:bg-[#95959522] data-[active=true]:bg-[#95959522]";

/** Item de menu do Luma: ícone 16 a 50%, título 14, descrição 13 a 50%, check à direita. */
export function GooeyMenuItem({
  id,
  icon,
  title,
  description,
  checked,
  active,
  onClick,
  role = "menuitem",
}: {
  id?: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  active?: boolean;
  onClick?: () => void;
  role?: "menuitem" | "menuitemradio" | "menuitemcheckbox" | "option";
}) {
  return (
    <button
      id={id}
      type="button"
      role={role}
      aria-checked={
        role === "menuitemradio" || role === "menuitemcheckbox" ? !!checked : undefined
      }
      aria-selected={role === "option" ? !!active : undefined}
      data-active={active ? "true" : undefined}
      className={ITEM_BASE}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon ? (
        <span className="mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center self-start pt-[3px] text-white/50 [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{title}</span>
        {description ? (
          <span className="block text-[13px] leading-[19.5px] text-white/50">
            {description}
          </span>
        ) : null}
      </span>
      {checked != null ? (
        <span className="ml-2.5 flex h-4 w-4 shrink-0 items-center justify-center">
          {checked ? <Check className="h-4 w-4" strokeWidth={2} /> : null}
        </span>
      ) : null}
    </button>
  );
}

/** Rótulo de seção do Luma (13px, 50%). */
export function GooeyMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-0.5 pt-1.5 text-[13px] leading-[19.5px] text-white/50">
      {children}
    </div>
  );
}

/** Divisor do Luma: 1px branco/8, de ponta a ponta do painel. */
export function GooeyMenuSep() {
  return <div className="-mx-1 my-1 h-px bg-white/[0.08]" />;
}

/* ---------- Dialog ---------- */

type GooeyDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Gatilho de origem: o dialog escorre dele e volta para ele. */
  anchorRef?: RefObject<HTMLElement | null>;
  width?: number;
  radius?: number;
  className?: string;
  /** Abaixo do z-[300] dos popovers Radix, para menus internos ficarem por cima. */
  zIndex?: number;
  ariaLabel?: string;
};

/**
 * Dialog gooey centrado, com overlay escuro e blur. Nasce como uma gotinha no
 * centro do gatilho, cresce até o centro da tela e volta para ela ao fechar.
 */
export function GooeyDialog({
  open,
  onClose,
  children,
  anchorRef,
  width = 560,
  radius = 12,
  className,
  zIndex = 200,
  ariaLabel,
}: GooeyDialogProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [phase] = usePhase(open, "in");
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const live = phase !== "closed";
  const close = useCallback(() => onClose(), [onClose]);
  const moveTransition = reduceMotion
    ? INSTANT_TRANSITION
    : phase === "out" || phase === "fade"
      ? CLOSE_TRANSITION
      : OPEN_TRANSITION;

  useEscape(open && live, close);
  useInitialFocus(phase === "open" || phase === "rest", panelRef, true);

  // Roda antes do efeito que troca a fase, então a gota já monta no lugar certo.
  useLayoutEffect(() => {
    if (open) setAnchor(anchorOf(anchorRef?.current));
  }, [open, anchorRef]);

  useEffect(() => {
    if (!live) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [live]);

  if (!live || typeof document === "undefined") return null;

  const shown = phase === "open" || phase === "rest";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(width, vw - 32);
  const start = anchor
    ? {
        dx: anchor.left + anchor.width / 2 - vw / 2,
        dy: anchor.top + anchor.height / 2 - vh / 2,
        // Nasce como gotinha no centro do gatilho (sem cobrir o card inteiro,
        // que escurecia o card no quadro de espera e parecia uma piscada).
        s0: 0.06,
      }
    : { dx: 0, dy: 40, s0: 0.9 };

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }} data-ff-gooey-dialog="">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{
          opacity: shown ? 1 : 0,
          transition: reduceMotion ? "none" : "opacity 200ms ease-out",
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          close();
        }}
      />
      {/* No celular o teclado cobre a metade de baixo: o diálogo fica no topo. */}
      <GooeyShell
        className="pointer-events-none flex items-start justify-center p-4 sm:items-center"
        style={{ position: "absolute", inset: 0 }}
        {...liquidFade(phase)}
      >
        <GooeyItem
          x={shown || reduceMotion ? 0 : start.dx}
          y={shown || reduceMotion ? 0 : start.dy}
          scale={shown || reduceMotion ? 1 : start.s0}
          transition={moveTransition}
          className={cn(shown && "pointer-events-auto")}
          style={{ width: w }}
        >
          <div className="relative" style={{ borderRadius: radius }}>
            <Surface phase={phase} radius={radius} />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              tabIndex={-1}
              className={cn(
                "relative max-h-[calc(100dvh-2rem)] overflow-y-auto text-white outline-none transition-opacity",
                contentClass(phase),
                className,
              )}
              style={{ borderRadius: radius }}
            >
              {children}
            </div>
          </div>
        </GooeyItem>
      </GooeyShell>
    </div>,
    document.body,
  );
}

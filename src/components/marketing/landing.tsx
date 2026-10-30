"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark/brand-mark";
import { APP_MARK, APP_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  birdsOverlay,
  prologueScene,
  crabScene,
  towerScene,
  moonsScene,
  pigeonScene,
  valleyScene,
} from "./dither/scenes";
import { DitherStage, type Scene } from "./dither/stage";
import { DAY, NIGHT } from "./dither/util";
import { useLandingMotion } from "./use-landing-motion";
import "./landing.css";

const GITHUB = "https://github.com/MAUXII/facultas";
const OVERLAY = ["transparent", ...NIGHT.slice(1)] as const;
const WEEK = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const PROLOGUE =
  "O Facultas começou num grupo de WhatsApp lotado: aviso perdido, prova descoberta na véspera, PDF que ninguém achava. Virou um lugar aberto, onde cada turma guarda o que importa e cada estudante recebe as próprias datas. Feito por estudantes, com o código aberto.";

export function Landing({ fontClass }: { fontClass?: string }) {
  const rootRef = useRef<HTMLElement>(null);
  useLandingMotion(rootRef);


  return (
    <main
      ref={rootRef}
      className={cn("lp-root min-h-screen overflow-x-clip", fontClass)}
    >
      <Nav />
      <div className="pointer-events-none fixed inset-0 z-30">
        <DitherStage scene={birdsOverlay} tones={OVERLAY} />
      </div>

      <Hero />

      <Track
        scene={prologueScene}
        tones={NIGHT}
        height="h-[230vh]"
        curtain
        floatCtaStart
      >
        <div className="absolute inset-x-0 top-1/2 mx-auto max-w-[42rem] -translate-y-1/2 px-6 text-center md:max-w-[48rem]">
          <p className="ff-display text-[clamp(2.35rem,5.2vw,4.4rem)] leading-[1.05] tracking-[-0.02em]">
            {PROLOGUE.split(" ").map((word, i, all) => (
              <span
                key={i}
                className="lp-lit"
                style={{ "--k": 0.12 + (i / all.length) * 0.7 } as CSSProperties}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
      </Track>

      <Track id="rebanho" scene={towerScene} tones={NIGHT} height="h-[320vh]" curtain>
        <Chapter n="01" label="Comunidade" />
        <h2
          className="ff-display lp-in absolute inset-x-0 top-[16vh] px-4 text-center text-[clamp(3.4rem,10.5vw,9.5rem)] leading-[0.9]"
          style={at(0.04, 0.2, 1.1, 1.2)}
        >
          Junte a <em>turma.</em>
        </h2>
        <Caption
          className="md:inset-x-auto md:bottom-[30vh] md:right-[7vw] md:mx-0 md:max-w-[19rem] md:text-left"
          style={at(0.74, 0.86, 1.1, 1.2)}>
          Turma, monitoria, grupo ou evento. Pública no Descobrir, privada com
          código.
        </Caption>
      </Track>

      <Track scene={pigeonScene} tones={DAY} height="h-[210vh]" curtain className="lp-day text-[#151618]">
        <Chapter n="02" label="Avisos" dark />
        <h2
          className="ff-display lp-in absolute inset-x-0 top-[14vh] px-4 text-center text-[clamp(3.4rem,10.5vw,9.5rem)] leading-[0.9]"
          style={at(0.02, 0.16, 1.1, 1.2)}
        >
          O aviso chega <em>voando.</em>
        </h2>
        <Caption dark style={at(0.5, 0.62, 1.1, 1.2)}>
          Prova na quarta? Com data, ela cai na agenda de todo mundo.
        </Caption>
      </Track>

      <Track scene={moonsScene} tones={NIGHT} height="h-[230vh]" curtain>
        <Chapter n="03" label="Grade e calendário" />
        <h2
          className="ff-display lp-in absolute inset-x-0 top-[13vh] px-4 text-center text-[clamp(3.2rem,9.5vw,8.5rem)] leading-[0.9]"
          style={at(0.02, 0.14, 1.1, 1.2)}
        >
          A semana, <em>em fases.</em>
        </h2>
        <div className="lp-mono absolute inset-x-0 top-[calc(50%+min(6.2vw,14vh)+18px)] grid grid-cols-6 text-center text-[11px] uppercase tracking-[0.25em] text-white/55">
          {WEEK.map((day, i) => (
            <span key={day} className="lp-in" style={at(0.1 + i * 0.08, 0.3 + i * 0.08, 2, 3)}>
              {day}
            </span>
          ))}
        </div>
        <Caption style={at(0.74, 0.86, 1.1, 1.2)}>
          A grade é da turma. O calendário é seu, e assina no Google ou na
          Apple.
        </Caption>
      </Track>

      <section className="relative h-[92svh] min-h-[560px] overflow-hidden border-t border-white/[0.06]">
        <DitherStage scene={crabScene} tones={NIGHT} pixel={2} curtain />
        <div className="absolute inset-x-0 top-[16%] px-4 text-center">
          <p className="lp-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
            04 · Código aberto
          </p>
          <h2 data-reveal className="ff-display mt-5 text-[clamp(3.4rem,10.5vw,9.5rem)] leading-[0.9]">
            Código <em>aberto.</em>
          </h2>
          <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={GITHUB} target="_blank" rel="noreferrer" className="lp-btn lp-btn--solid">
              MAUXII/facultas <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
            <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className="lp-btn">
              Abrir uma issue
            </a>
          </div>
          <p data-reveal className="lp-mono mt-6 text-[11px] uppercase tracking-[0.25em] text-white/45">
            Next.js · Supabase · Licença MIT
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/*
 * Abertura em papel claro: um vale em dither que some no papel embaixo,
 * com o texto centrado por cima dessa passagem.
 */
function Hero() {
  return (
    <section
      data-hero
      className="lp-day relative h-[100svh] min-h-[620px] overflow-hidden bg-[#e9edf3] text-[#151618]"
    >
      <DitherStage scene={valleyScene} tones={DAY} pixel={2} />
      <div className="absolute inset-x-0 bottom-[8vh] flex flex-col items-center px-5 text-center">
        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          className="lp-pill lp-rise"
        >
          Código aberto · feito por estudantes <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
        <h1
          style={{ "--i": 1 } as CSSProperties}
          className="ff-display lp-rise mt-5 text-[clamp(3.1rem,7.4vw,6.8rem)] leading-[0.92] tracking-[-0.01em]"
        >
          Sua faculdade,
          <br />
          <em>num só lugar.</em>
        </h1>
        <p style={{ "--i": 2 } as CSSProperties} className="lp-rise mt-5 max-w-[34rem] text-[16px] leading-relaxed text-[#151618]/65 md:text-[18px]">
          Comunidade, grade da turma, avisos e calendário de quem estuda junto.
          Aberto e gratuito.
        </p>
        <div style={{ "--i": 3 } as CSSProperties} className="lp-rise mt-7">
          <Link href={routes.discover} className="lp-btn lp-btn--ink">
            Abrir o app <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Trecho alto com a cena presa na tela enquanto o scroll anda. */
function Track({
  id,
  scene,
  tones,
  height,
  curtain,
  pixel,
  className,
  children,
  floatCtaStart,
}: {
  id?: string;
  scene: Scene;
  tones: readonly string[];
  height: string;
  curtain?: boolean;
  pixel?: number;
  className?: string;
  children: ReactNode;
  floatCtaStart?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section
      id={id}
      ref={ref}
      data-track
      data-cta-float-start={floatCtaStart ? "" : undefined}
      className={cn("relative", height, className)}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <DitherStage scene={scene} tones={tones} track={ref as RefObject<HTMLElement>} curtain={curtain} pixel={pixel} />
        {children}
      </div>
    </section>
  );
}

/** Entra entre `a` e `b`, sai entre `c` e `d`, no progresso da trilha. */
function at(a: number, b: number, c: number, d: number): CSSProperties {
  return { "--a": a, "--b": b, "--c": c, "--d": d } as CSSProperties;
}

function Chapter({ n, label, dark }: { n: string; label: string; dark?: boolean }) {
  return (
    <p
      className={cn(
        "lp-mono absolute left-4 top-20 text-[11px] uppercase tracking-[0.3em] md:left-8",
        dark ? "text-[#151618]/60" : "text-white/50",
      )}
    >
      {n} · {label}
    </p>
  );
}

function Caption({
  children,
  style,
  dark,
  className,
}: {
  children: ReactNode;
  style: CSSProperties;
  dark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "lp-in absolute inset-x-0 bottom-[7vh] mx-auto max-w-[30rem] px-4 text-center text-lg leading-snug md:text-xl",
        dark ? "text-[#151618]/80" : "text-white/75",
        className,
      )}
      style={style}
    >
      {children}
    </p>
  );
}

function Nav() {
  // Absolute: sobe com o hero. Sem barra/blur no scroll — o CTA volta no float.
  const ctaRef = useRef<HTMLAnchorElement>(null);

  return (
    <>
      <header className="lp-nav absolute inset-x-0 top-0 z-50" data-tone="light">
        <nav className="mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-8">
          <Link
            href={routes.home}
            className="flex items-center gap-2 text-[15px] font-medium lowercase tracking-tight"
          >
            <BrandMark size={22} />
            {APP_MARK}
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="lp-nav__link hidden px-2 py-1 text-sm sm:inline"
            >
              GitHub
            </a>
            <Link
              ref={ctaRef}
              href={routes.discover}
              data-lp-nav-cta=""
              className="lp-nav__cta rounded-full px-3.5 py-1.5 text-sm font-medium"
            >
              Abrir o app
            </Link>
          </div>
        </nav>
      </header>
      <FloatingAppCta sourceRef={ctaRef} />
    </>
  );
}

/**
 * Cópia fixa do “Abrir o app”: o header absolute some com o scroll;
 * quando o hero sai, o botão sobe de dentro da máscara (padrão Cadda).
 */
function FloatingAppCta({
  sourceRef,
}: {
  sourceRef: RefObject<HTMLAnchorElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // light = fundo claro → botão preto; dark = fundo escuro → botão branco
  const [tone, setTone] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const wrap = wrapRef.current;
    const source = sourceRef.current;
    if (!wrap || !source) return;

    const pin = () => {
      const r = source.getBoundingClientRect();
      if (r.width < 2) return;
      wrap.style.top = `${r.top + window.scrollY}px`;
      wrap.style.left = `${r.left}px`;
      wrap.style.width = `${r.width}px`;
    };

    const readTone = (): "light" | "dark" => {
      const slot = wrap.getBoundingClientRect();
      const x = slot.left + slot.width / 2;
      const y = Math.min(
        Math.max(8, slot.top + 20),
        window.innerHeight - 8,
      );
      const prev = wrap.style.pointerEvents;
      wrap.style.pointerEvents = "none";
      const under = document.elementFromPoint(x, y);
      wrap.style.pointerEvents = prev;
      if (under?.closest("[data-hero], .lp-day")) return "light";
      return "dark";
    };

    const sync = () => {
      pin();
      const hero = document.querySelector("[data-hero]");
      const start = document.querySelector("[data-cta-float-start]");
      const show = start
        ? start.getBoundingClientRect().top <= 0
        : hero
          ? hero.getBoundingClientRect().bottom <= 0
          : window.scrollY > window.innerHeight * 0.85;
      setVisible(show);
      setTone(readTone());
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sourceRef]);

  return (
    <div
      ref={wrapRef}
      className="lp-cta-float"
      data-visible={visible ? "true" : "false"}
      data-tone={tone}
      inert={!visible}
    >
      <Link
        href={routes.discover}
        className="lp-cta-float__btn lp-nav__cta rounded-full px-3.5 py-1.5 text-sm font-medium"
        tabIndex={visible ? 0 : -1}
      >
        Abrir o app
      </Link>
    </div>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "App",
    links: [
      ["Descobrir", routes.discover],
      ["Comunidades", routes.communities],
      ["Calendário", routes.calendar],
    ],
  },
  {
    title: "Projeto",
    links: [
      ["GitHub", GITHUB],
      ["Issues", `${GITHUB}/issues`],
      ["Licença MIT", `${GITHUB}/blob/main/LICENSE`],
      ["Créditos das imagens", `${GITHUB}/blob/main/public/marketing/CREDITS.md`],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacidade", routes.privacy],
      ["Termos", routes.terms],
    ],
  },
] as const;

/** Footer sem cena dither — só marca, colunas e copyright. */
function Footer() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer ref={ref} className={cn("lp-foot", inView && "is-in")}>
      <div className="lp-foot__top">
        <div className="lp-foot__brand">
          <Link href={routes.home} className="lp-foot__logo lp-foot__r" style={delay(140)}>
            <BrandMark size={24} />
            {APP_MARK}
          </Link>
          <p className="lp-foot__tag lp-foot__r" style={delay(230)}>
            Hub aberto para a vida acadêmica. Comunidade, grade, avisos e
            calendário num lugar só.
          </p>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="lp-foot__social lp-foot__r"
            style={delay(320)}
          >
            <GitHubIcon />
          </a>
        </div>
        {FOOTER_COLUMNS.map((col, ci) => (
          <nav key={col.title} aria-label={col.title} className="lp-foot__col">
            <h3 className="lp-mono lp-foot__r" style={delay(260 + ci * 110)}>
              {col.title}
            </h3>
            <ul>
              {col.links.map(([label, href], li) => (
                <li key={label} className="lp-foot__r" style={delay(330 + ci * 110 + li * 55)}>
                  {href.startsWith("/") ? (
                    <Link href={href} className="lp-foot__link">
                      {label}
                    </Link>
                  ) : (
                    <a href={href} target="_blank" rel="noreferrer" className="lp-foot__link">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="lp-foot__bar lp-foot__r" style={delay(1250)}>
        <p>
          © {new Date().getFullYear()} {APP_NAME} · Licença MIT · sem afiliação institucional
        </p>
        <p>Projeto de estudante, aberto a quem quiser contribuir.</p>
      </div>
    </footer>
  );
}

function delay(ms: number) {
  return { "--d": ms } as CSSProperties;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.1 10.1 0 0 0 22 12.23C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

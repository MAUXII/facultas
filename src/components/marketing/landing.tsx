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
  coverScene,
  crabScene,
  towerScene,
  moonsScene,
  pigeonScene,
  roadScene,
} from "./dither/scenes";
import { DitherStage, type Scene } from "./dither/stage";
import { DAY, NIGHT } from "./dither/util";
import { AshHero } from "./ash-hero";
import { HubMock } from "./mocks";
import { useLandingMotion } from "./use-landing-motion";
import "./landing.css";

const GITHUB = "https://github.com/MAUXII/facultas";
const OVERLAY = ["transparent", ...NIGHT.slice(1)] as const;
const WEEK = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const PROLOGUE =
  "O Facultas começou num grupo de WhatsApp lotado: aviso perdido, prova descoberta na véspera, PDF que ninguém achava. Virou um lugar aberto, onde cada turma guarda o que importa e cada estudante recebe as próprias datas. Feito por estudantes, com o código à vista.";

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

      <Track scene={prologueScene} tones={NIGHT} height="h-[230vh]" curtain>
        <div className="absolute inset-x-0 top-1/2 mx-auto max-w-[56rem] -translate-y-1/2 px-6 text-center">
          <p className="lp-mono text-[11px] uppercase tracking-[0.4em] text-white/55">
            ✦ ✦ ✦ &nbsp; Prólogo &nbsp; ✦ ✦ ✦
          </p>
          <p className="ff-display mt-8 text-[clamp(1.9rem,4vw,3.6rem)] leading-[1.08]">
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

      <section className="relative px-4 pb-28 pt-16 md:px-5 md:pb-40 md:pt-20">
        <div className="mx-auto max-w-[1120px]">
          <p className="lp-mono text-[11px] uppercase tracking-[0.3em] text-white/45">
            04 · Por dentro
          </p>
          <h2 data-reveal className="ff-display mt-6 text-[clamp(3.2rem,8vw,7rem)] leading-[0.92]">
            Tudo isso, <em>num app.</em>
          </h2>
          <div data-reveal className="mx-auto mt-16 max-w-[920px]">
            <HubMock cover={<DitherStage scene={coverScene} tones={NIGHT} pixel={2} />} />
          </div>
        </div>
      </section>

      <section className="relative h-[92svh] min-h-[560px] overflow-hidden border-t border-white/[0.06]">
        <DitherStage scene={crabScene} tones={NIGHT} pixel={2} curtain />
        <div className="absolute inset-x-0 top-[16%] px-4 text-center">
          <p className="lp-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
            05 · Código aberto
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
 * Abertura em papel claro: o nome em tinta spray (AshHero) que vira cinza
 * no scroll, com os textos pequenos nos cantos, como num cartaz.
 */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} data-track data-hero className="relative h-[260vh] bg-[#e9e8e3] text-[#151618]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <AshHero track={ref} />
        <h1 className="sr-only">Facultas: sua faculdade, num só lugar.</h1>
        <div className="lp-in pointer-events-none absolute inset-0" style={at(-1, 0, 0.04, 0.13)}>
          <div className="lp-mono absolute left-4 top-[12vh] flex gap-4 text-[11px] uppercase leading-relaxed tracking-[0.22em] md:left-[4vw]">
            <span className="text-[#151618]/45">01<br />08</span>
            <span>Hub acadêmico<br />código aberto</span>
          </div>
          <ul className="lp-mono absolute right-4 top-[12vh] text-right text-[11px] uppercase leading-relaxed tracking-[0.22em] md:right-[4vw]">
            <li>Comunidades</li>
            <li>Grade</li>
            <li>Avisos</li>
            <li>Calendário</li>
          </ul>
          <p className="absolute inset-x-4 top-[calc(40%+8.7vw+3vh)] text-center text-[15px] leading-snug text-[#151618]/80 md:top-[calc(45%+min(8.35vw,18vh)+3vh)] md:text-[17px]">
            Turma, grade, avisos e calendário,
            <br />
            num só lugar.
          </p>
          <div className="pointer-events-auto absolute bottom-8 left-4 md:left-[4vw]">
            <Link href={routes.discover} className="lp-btn lp-btn--ink">
              Abrir o app <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
          <p className="lp-mono absolute bottom-10 right-4 text-[11px] uppercase tracking-[0.3em] text-[#151618]/50 md:right-[4vw]">
            Role ↓
          </p>
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
}: {
  id?: string;
  scene: Scene;
  tones: readonly string[];
  height: string;
  curtain?: boolean;
  pixel?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section id={id} ref={ref} data-track className={cn("relative", height, className)}>
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
  const [scrolled, setScrolled] = useState(false);
  // Sobre o papel claro da abertura, a nav fica escura.
  const [light, setLight] = useState(true);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24);
      const hero = document.querySelector("[data-hero]");
      setLight(hero ? hero.getBoundingClientRect().bottom > 56 : false);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className="lp-nav fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
      data-tone={light ? "light" : "dark"}
    >
      <nav className="mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-8">
        <Link href={routes.home} className="flex items-center gap-2 text-[15px] font-medium lowercase tracking-tight">
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
            href={routes.discover}
            className="lp-nav__cta rounded-full px-3.5 py-1.5 text-sm font-medium"
          >
            Abrir o app
          </Link>
        </div>
      </nav>
    </header>
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

/**
 * Mesmo desenho do footer do Copia: marca e colunas em cima, a linha do
 * copyright e, embaixo, a cena em dither que revela quando chega na tela.
 */
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
      <div className="lp-foot__scene">
        <DitherStage scene={roadScene} tones={NIGHT} revealAt={0.2} />
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

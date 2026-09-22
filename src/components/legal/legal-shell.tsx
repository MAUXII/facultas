import Link from "next/link";
import { BrandMark } from "@/components/brand-mark/brand-mark";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[var(--ff-max-width)] px-5 pb-20 pt-16 sm:px-8">
      <Link
        href="/"
        className="ff-display flex items-center gap-2 text-sm font-medium tracking-tight text-white/40 transition hover:text-white"
      >
        <BrandMark size={18} />
        {APP_NAME}
      </Link>
      <h1 className="ff-display mt-10 text-4xl font-medium tracking-tight text-white/55 md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-white/35">
        {APP_TAGLINE} · Atualizado em {updated}
      </p>
      <div className="mt-12 space-y-8 text-base leading-relaxed text-white/70">
        {children}
      </div>
      <div className="mt-16 flex flex-wrap gap-6 text-sm text-white/40">
        <Link href="/privacy" className="transition hover:text-white">
          Privacidade
        </Link>
        <Link href="/terms" className="transition hover:text-white">
          Termos
        </Link>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

import { CalendarDays, FileText, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Telas de exemplo da landing. Desenham o app com dado inventado; nenhum
 * nome aqui é turma, pessoa ou instituição real.
 */

function Window({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("lp-mock overflow-hidden rounded-2xl", className)}>
      <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.06] px-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        {title ? (
          <span className="ml-3 truncate text-[11px] text-white/35">{title}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** O hub de uma turma: capa, abas e o aviso que vai para a agenda. */
export function HubMock({
  className,
  cover,
}: {
  className?: string;
  /** A capa da comunidade, no lugar do degradê. */
  cover?: React.ReactNode;
}) {
  return (
    <Window className={className} title="facultas.vercel.app/communities/calculo-2">
      <div className="relative h-40 overflow-hidden sm:h-56">
        {cover ?? <div className="ff-cover-1 absolute inset-0" />}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1b1c1f] to-transparent" />
      </div>
      <div className="relative -mt-8 px-5 pb-5 sm:px-7">
        <div className="h-14 w-14 overflow-hidden rounded-xl border-4 border-[#1b1c1f] bg-[#151618]">
          {cover}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xl font-semibold tracking-tight">Cálculo II</p>
            <p className="mt-0.5 text-xs text-white/45">Turma · Noite · 38 membros</p>
          </div>
          <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] text-white/70">
            Código K7Q-2MX
          </span>
        </div>
        <div className="mt-5 flex gap-1 overflow-hidden text-[12px]">
          {["Avisos", "Grade", "Materiais", "Membros"].map((tab, i) => (
            <span
              key={tab}
              className={cn(
                "rounded-full px-3 py-1.5",
                i === 0 ? "bg-white text-[#151618]" : "text-white/50",
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[11px] text-white/45">
              <Megaphone className="h-3.5 w-3.5" strokeWidth={1.6} />
              Representante · há 2 h
            </div>
            <p className="mt-2 text-sm font-medium">P1 na quarta, 20h30</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Cai até integral por partes. Lista 3 nos materiais.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#5b8def]/15 px-2.5 py-1 text-[11px] text-[#9dbcf7]">
              <CalendarDays className="h-3 w-3" strokeWidth={1.8} />
              Na agenda de todo mundo
            </div>
          </div>
          <div className="hidden rounded-xl bg-white/[0.04] p-4 sm:block">
            <div className="flex items-center gap-2 text-[11px] text-white/45">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.6} />
              Materiais
            </div>
            {["Lista 3 — integrais.pdf", "Resumo P1.pdf", "Slides aula 6"].map((f) => (
              <p key={f} className="mt-2.5 truncate text-xs text-white/70">
                {f}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}

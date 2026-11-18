import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Telas simplificadas dos apps de agenda para o passo a passo.
 * Só aparecem como texto os rótulos confirmados na ajuda oficial de cada app;
 * o resto vira barra cinza para não ensinar um botão que não existe.
 */

function Bar({ className }: { className?: string }) {
  return <span className={cn("block h-2 rounded-full bg-[#e3e3e3]", className)} />;
}

/** Destaque do alvo do passo, com o anel e a bolinha de toque. */
function Target({
  children,
  className,
  round,
}: {
  children: ReactNode;
  className?: string;
  round?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center ring-2 ring-[#f5a524] ring-offset-2 ring-offset-white",
        round ? "rounded-full" : "rounded-[6px]",
        className,
      )}
    >
      {children}
      <span className="pointer-events-none absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-white bg-[#f5a524]/90 shadow" />
    </span>
  );
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] bg-white text-[#1f1f1f] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 border-b border-[#e3e3e3] bg-[#f1f3f4] px-2.5 py-1.5">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#d5d5d5]" />
          <span className="h-2 w-2 rounded-full bg-[#d5d5d5]" />
          <span className="h-2 w-2 rounded-full bg-[#d5d5d5]" />
        </span>
        <span className="flex-1 truncate rounded-full bg-white px-2.5 py-0.5 font-sans text-[10px] text-[#444746]">
          calendar.google.com
        </span>
      </div>
      {children}
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[220px] overflow-hidden rounded-[22px] border-[5px] border-[#1c1c1e] bg-white text-[#1f1f1f]">
      <div className="flex items-center justify-between px-4 pb-1 pt-1.5">
        <Bar className="h-1.5 w-6 bg-[#c7c7c7]" />
        <span className="h-1.5 w-10 rounded-full bg-[#1c1c1e]" />
        <Bar className="h-1.5 w-6 bg-[#c7c7c7]" />
      </div>
      {children}
    </div>
  );
}

function CheckBox({ color, checked }: { color: string; checked?: boolean }) {
  return (
    <span
      className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px]"
      style={{ backgroundColor: color }}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" aria-hidden>
          <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ) : null}
    </span>
  );
}

/** Computador: coluna da esquerda do Google Agenda, com o "+" de Outras agendas. */
export function GoogleSidebarArt() {
  return (
    <BrowserFrame>
      <div className="flex gap-3 p-3 font-sans">
        <div className="flex w-[150px] shrink-0 flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-[14px] bg-white px-3 py-1.5 text-[11px] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
            <span className="text-[14px] leading-none">+</span>
            Criar
          </span>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} className="mx-auto h-1.5 w-1.5 rounded-full bg-[#e3e3e3]" />
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium text-[#444746]">Minhas agendas</span>
            {["#1a73e8", "#0b8043", "#7986cb"].map((color) => (
              <span key={color} className="flex items-center gap-1.5">
                <CheckBox color={color} checked />
                <Bar className="w-16" />
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-[#444746]">Outras agendas</span>
            <Target round>
              <span className="flex h-5 w-5 items-center justify-center text-[15px] leading-none text-[#444746]">
                +
              </span>
            </Target>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-px self-stretch rounded-[6px] bg-[#e3e3e3] p-px">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="bg-white" />
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/** Computador: menu que abre no "+", com "Do URL" em destaque. */
export function GoogleAddMenuArt() {
  const items = ["Inscrever-se na agenda", null, null, "Do URL", null];
  return (
    <BrowserFrame>
      <div className="flex gap-3 p-3 font-sans">
        <div className="flex w-[118px] shrink-0 flex-col gap-1.5 pt-1">
          <Bar className="w-20" />
          <Bar className="w-14" />
          <span className="mt-2 text-[10px] font-medium text-[#444746]">Outras agendas</span>
        </div>
        <div className="flex flex-1 flex-col rounded-[6px] bg-white py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
          {items.map((item, i) =>
            item === "Do URL" ? (
              <span key={i} className="px-2 py-1">
                <Target className="w-full bg-[#e8f0fe] px-2 py-1 text-[11px] font-medium text-[#0b57d0]">
                  {item}
                </Target>
              </span>
            ) : item ? (
              <span key={i} className="px-4 py-1.5 text-[11px] text-[#1f1f1f]">
                {item}
              </span>
            ) : (
              <span key={i} className="px-4 py-[9px]">
                <Bar className={i % 2 ? "w-24" : "w-16"} />
              </span>
            ),
          )}
        </div>
      </div>
    </BrowserFrame>
  );
}

/** Computador: página "Do URL" com o link colado e o botão de adicionar. */
export function GoogleFromUrlArt({ url }: { url: string }) {
  return (
    <BrowserFrame>
      <div className="flex flex-col gap-3 p-4 font-sans">
        <span className="text-[14px] text-[#1f1f1f]">Do URL</span>
        <span className="relative block rounded-[4px] border border-[#0b57d0] px-2.5 pb-1.5 pt-2.5">
          <span className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] text-[#0b57d0]">
            URL da agenda
          </span>
          <span className="block truncate font-mono text-[10px] text-[#1f1f1f]">{url}</span>
        </span>
        <span className="flex items-center gap-2 text-[10px] text-[#444746]">
          <span className="h-3 w-3 rounded-[2px] border border-[#747775]" />
          Tornar a agenda acessível ao público
        </span>
        <span className="flex justify-end">
          <Target className="rounded-full">
            <span className="rounded-full bg-[#0b57d0] px-3.5 py-1.5 text-[11px] font-medium text-white">
              Adicionar agenda
            </span>
          </Target>
        </span>
      </div>
    </BrowserFrame>
  );
}

/** Celular Android: menu lateral do app com a agenda nova marcada. */
export function GoogleAppDrawerArt({ name }: { name: string }) {
  return (
    <PhoneFrame>
      <div className="flex font-sans">
        <div className="flex w-[160px] flex-col gap-2.5 border-r border-[#e3e3e3] px-3 pb-4 pt-2 shadow-[2px_0_6px_rgba(0,0,0,0.08)]">
          <Bar className="h-2.5 w-20 bg-[#d5d5d5]" />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#e3e3e3]" />
              <Bar className="w-12" />
            </span>
          ))}
          <span className="my-0.5 h-px bg-[#e3e3e3]" />
          <Bar className="w-24 bg-[#ececec]" />
          {["#1a73e8", "#0b8043"].map((color) => (
            <span key={color} className="flex items-center gap-2">
              <CheckBox color={color} checked />
              <Bar className="w-14" />
            </span>
          ))}
          <Target className="-mx-1 px-1 py-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <CheckBox color="#8e24aa" checked />
              <span className="truncate text-[10px] font-medium">{name}</span>
            </span>
          </Target>
        </div>
        <div className="flex flex-1 flex-col gap-2 bg-[#f8f9fa] p-2">
          <Bar className="w-8" />
          <Bar className="w-6" />
        </div>
      </div>
    </PhoneFrame>
  );
}

/** iPhone: confirmação do sistema depois de tocar no link da agenda. */
export function IphoneSubscribeArt() {
  return (
    <PhoneFrame>
      <div className="relative flex h-[150px] items-center justify-center bg-[#b9b9be] px-6 font-sans">
        <div className="w-full overflow-hidden rounded-[12px] bg-[#f2f2f7]/95 text-center">
          <div className="flex flex-col items-center gap-1.5 px-4 pb-3 pt-3.5">
            <Bar className="h-2.5 w-24 bg-[#c7c7cc]" />
            <Bar className="w-16 bg-[#d8d8dc]" />
          </div>
          <div className="grid grid-cols-2 border-t border-[#c6c6c8] text-[11px]">
            <span className="border-r border-[#c6c6c8] py-2 text-[#007aff]">Cancelar</span>
            <span className="flex items-center justify-center py-1">
              <Target className="px-2 py-0.5 font-semibold text-[#007aff]">Assinar</Target>
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** iPhone: tela da assinatura, com "Adicionar" no canto. */
export function IphoneAddArt({ name }: { name: string }) {
  return (
    <PhoneFrame>
      <div className="flex h-[150px] flex-col bg-[#f2f2f7] font-sans">
        <div className="flex items-center justify-between px-3 py-2">
          <Bar className="w-10 bg-[#c7d7f5]" />
          <Target className="px-1.5 py-0.5 text-[11px] font-semibold text-[#007aff]">
            Adicionar
          </Target>
        </div>
        <div className="mx-3 flex flex-col divide-y divide-[#e5e5ea] rounded-[10px] bg-white">
          <span className="truncate px-3 py-2 text-[10px] font-medium">{name}</span>
          <span className="flex items-center justify-between px-3 py-2">
            <Bar className="w-10" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8e24aa]" />
          </span>
          <span className="px-3 py-2">
            <Bar className="w-16" />
          </span>
        </div>
      </div>
    </PhoneFrame>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  connected: boolean;
  busy?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  className?: string;
};

export function GoogleCalendarConnect({
  connected,
  busy,
  onConnect,
  onDisconnect,
  className,
}: Props) {
  if (connected) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 text-sm text-white/50",
          className,
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Google Calendar conectado
        </span>
        <button
          type="button"
          data-snd="select"
          onClick={onDisconnect}
          className="text-white/40 transition hover:text-white/70"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-snd={busy ? "disabled" : "select"}
      disabled={busy}
      onClick={onConnect}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-white/12 bg-transparent px-4 text-sm font-medium text-white/75 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
      ) : (
        <GoogleCalIcon className="h-4 w-4" />
      )}
      Conectar Google Calendar
    </button>
  );
}

function GoogleCalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
      />
    </svg>
  );
}

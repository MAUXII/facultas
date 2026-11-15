"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { playRuixenClick } from "@/lib/ruixen-click";
import type { SessionRow } from "@/lib/community-hub";
import type { HubRole } from "@/lib/hub";
import {
  canCheckIn,
  canCloseSession,
  canOpenSession,
  canUndoCheckIn,
} from "@/lib/sessao";
import {
  desfazerPresenca,
  encerrarSessao,
  listarPresencas,
  marcarPresenca,
} from "@/lib/sessao-supabase";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { SessaoDialog } from "@/components/community-hub/sessao-dialog";

function statusLabel(status: SessionRow["status"]) {
  if (status === "open") return "Aberta";
  if (status === "closed") return "Encerrada";
  return "Marcada";
}

export function SessionPanel({
  communityId,
  userId,
  institutionId,
  role,
  viaLink,
  sessions,
  onChanged,
}: {
  communityId: string;
  userId: string | null;
  institutionId: string | null;
  role: HubRole | null;
  viaLink: boolean;
  sessions: SessionRow[];
  onChanged: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const [rows, setRows] = useState<{ session_id: string; user_id: string }[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const opens = canOpenSession(role);

  useEffect(() => {
    let cancel = false;
    if (viaLink || sessions.length === 0) {
      setRows([]);
      return;
    }
    void listarPresencas(sessions.map((session) => session.id))
      .then((next) => {
        if (!cancel) setRows(next);
      })
      .catch(() => {
        if (!cancel) setRows([]);
      });
    return () => {
      cancel = true;
    };
  }, [sessions, viaLink]);

  const run = async (task: () => Promise<void>, fail: string) => {
    setSaving(true);
    setError("");
    try {
      await task();
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "session_attendance"
          ? "Presença ainda não está liberada nesta sala."
          : fail,
      );
    } finally {
      setSaving(false);
    }
  };

  if (viaLink) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <CalendarDays className="h-8 w-8 text-white/20" strokeWidth={1.25} />
        <p className="mt-4 text-base font-medium text-white">Sessão pede conta</p>
        <p className="mt-1 max-w-sm text-sm text-white/55">
          Pelo link dá para ver a sala e assinar os avisos. Presença fica na
          agenda de quem entra com conta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {opens && userId ? (
        <div className="flex justify-end">
          <button
            ref={createTriggerRef}
            type="button"
            data-snd="select"
            onClick={() => {
              playRuixenClick("soft");
              setCreateOpen(true);
            }}
            className="text-sm text-white/40 transition hover:text-white"
          >
            Abrir sessão
          </button>
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <CalendarDays className="h-8 w-8 text-white/20" strokeWidth={1.25} />
          <p className="mt-4 text-base font-medium text-white">Nenhuma sessão</p>
          <p className="mt-1 max-w-sm text-sm text-white/55">
            {opens
              ? "Abra quando o encontro começar. Quem tem conta marca presença, e ela entra na agenda dessa pessoa."
              : "Quando uma sessão abrir, marque presença aqui. Ela entra na sua agenda."}
          </p>
        </div>
      ) : (
        sessions.map((session) => {
          const mine = rows.some(
            (row) => row.session_id === session.id && row.user_id === userId,
          );
          const count = rows.filter((row) => row.session_id === session.id)
            .length;
          const checkIn = canCheckIn({
            role,
            status: session.status,
            already: mine,
          });
          const undo = canUndoCheckIn({
            role,
            status: session.status,
            already: mine,
          });
          const close = canCloseSession(role, session.status);
          return (
            <GlassCard
              key={session.id}
              className="gap-0 px-4 py-3.5 text-white"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-white">{session.title}</p>
                <span className="shrink-0 text-xs text-white/55">
                  {statusLabel(session.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/55">
                {format(new Date(session.starts_at), "EEE, d 'de' MMM · HH:mm", {
                  locale: ptBR,
                })}
                {session.location ? ` · ${session.location}` : ""}
              </p>
              {opens ? (
                <p className="mt-1 text-xs text-white/55">
                  {count === 0
                    ? "Ninguém marcou presença ainda"
                    : count === 1
                      ? "1 presença"
                      : `${count} presenças`}
                </p>
              ) : null}
              {mine ? (
                <p className="mt-2 text-sm text-white/70">
                  Presença marcada. Entra na sua agenda, e a data não muda lá.
                </p>
              ) : null}
              {checkIn || undo || close ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {checkIn && userId ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        playRuixenClick("soft");
                        void run(
                          () => marcarPresenca(session.id, userId),
                          "Não deu para marcar presença.",
                        );
                      }}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-40"
                    >
                      Marcar presença
                    </button>
                  ) : null}
                  {undo && userId ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        playRuixenClick("soft");
                        void run(
                          () => desfazerPresenca(session.id, userId),
                          "Não deu para desfazer.",
                        );
                      }}
                      className="rounded-xl px-3 py-2 text-sm text-white/70"
                    >
                      Desfazer
                    </button>
                  ) : null}
                  {close ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        playRuixenClick("soft");
                        void run(
                          () => encerrarSessao(session.id),
                          "Não deu para encerrar.",
                        );
                      }}
                      className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/70"
                    >
                      Encerrar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </GlassCard>
          );
        })
      )}
      {!opens && error ? (
        <p className="text-xs text-white/70">{error}</p>
      ) : null}

      {opens && userId ? (
        <SessaoDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          communityId={communityId}
          userId={userId}
          institutionId={institutionId}
          onSaved={onChanged}
          anchorRef={createTriggerRef}
        />
      ) : null}
    </div>
  );
}

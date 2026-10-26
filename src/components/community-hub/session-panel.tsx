"use client";

import { useEffect, useState } from "react";
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
  normalizeOpenSession,
} from "@/lib/sessao";
import {
  abrirSessao,
  desfazerPresenca,
  encerrarSessao,
  listarPresencas,
  marcarPresenca,
} from "@/lib/sessao-supabase";
import { GlassCard } from "@/components/ui/glasscn/glass-card";

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
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");
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

  const openSession = async () => {
    if (!userId || !opens) return;
    const draft = normalizeOpenSession({
      title,
      startsAt: when,
      location: place,
      institutionId,
    });
    if (!draft.ok) {
      setError(
        draft.reason === "title"
          ? "Escreve o nome da sessão."
          : "Escolhe quando ela começa.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await abrirSessao({
        communityId,
        hostId: userId,
        institutionId: draft.value.institutionId,
        title: draft.value.title,
        startsAt: draft.value.startsAt,
        location: draft.value.location,
      });
      setTitle("");
      setWhen("");
      setPlace("");
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "institution_id"
          ? "Rode a migration 016 no Supabase para abrir sessão sem instituição."
          : "Não deu para abrir a sessão.",
      );
    } finally {
      setSaving(false);
    }
  };

  const run = async (task: () => Promise<void>, fail: string) => {
    setSaving(true);
    setError("");
    try {
      await task();
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "session_attendance"
          ? "Rode a migration 016 no Supabase para marcar presença."
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
      {opens ? (
        <GlassCard className="gap-0 p-4 text-white">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome da sessão"
            aria-label="Nome da sessão"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="datetime-local"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
              aria-label="Quando a sessão começa"
              style={{ colorScheme: "dark" }}
              className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-white outline-none sm:w-fit"
            />
            <input
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="Lugar, se quiser"
              aria-label="Lugar da sessão"
              className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              disabled={saving || !title.trim() || !when}
              onClick={() => {
                playRuixenClick("soft");
                void openSession();
              }}
              className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              Abrir sessão
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-white/70">{error}</p>
          ) : null}
        </GlassCard>
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
    </div>
  );
}

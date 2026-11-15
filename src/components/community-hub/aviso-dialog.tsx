"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { GooeyCompose } from "@/components/ui/gooey-compose";
import { DateTimeField } from "@/components/ui/date-time-field";
import { createHub, HubError } from "@/lib/hub";
import { supabaseHubPort } from "@/lib/hub-supabase";
import { playRuixenClick } from "@/lib/ruixen-click";
import { toast } from "@/components/ui/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  kind?: string;
  onSaved: () => Promise<void> | void;
  anchorRef?: RefObject<HTMLElement | null>;
};

export function AvisoDialog({
  open,
  onOpenChange,
  communityId,
  userId,
  kind,
  onSaved,
  anchorRef,
}: Props) {
  const [body, setBody] = useState("");
  const [agendaAt, setAgendaAt] = useState<Date | null>(null);
  const [pushCalendar, setPushCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBody("");
    setAgendaAt(null);
    setPushCalendar(false);
  }, [open]);

  const close = () => onOpenChange(false);

  const save = async () => {
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    playRuixenClick("action");
    try {
      await createHub(supabaseHubPort()).addAviso(communityId, userId, text, {
        at: agendaAt ? agendaAt.toISOString() : null,
        pushToCalendar: Boolean(agendaAt) && pushCalendar,
      });
      await onSaved();
      close();
      toast({ title: "Aviso publicado" });
    } catch (err) {
      console.error(err);
      const description =
        err instanceof HubError
          ? err.code === "forbidden"
            ? "Você não pode publicar aqui."
            : "Preencha o aviso antes de enviar."
          : "Não deu para publicar.";
      toast({
        title: "Não deu para publicar",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GooeyCompose
      open={open}
      onClose={close}
      anchorRef={anchorRef}
      title="Novo aviso"
      onSubmit={() => void save()}
      submitLabel={saving ? "Publicando…" : "Publicar"}
      submitDisabled={saving || !body.trim()}
    >
      <div className="flex flex-col gap-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={
            kind === "turma"
              ? "Escrever um aviso para a turma…"
              : "Escrever um aviso…"
          }
          aria-label="Aviso"
          data-ff-bare-input=""
          autoFocus
          rows={4}
          className="w-full resize-none border-0 bg-transparent text-lg leading-relaxed text-white outline-none placeholder:text-white/25"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateTimeField
            value={agendaAt}
            onChange={(next) => {
              setAgendaAt(next);
              if (!next) setPushCalendar(false);
            }}
          />
          {agendaAt ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-[13px] text-white/60 transition hover:text-white">
              <input
                type="checkbox"
                checked={pushCalendar}
                onChange={(e) => setPushCalendar(e.target.checked)}
                className="size-3.5 accent-white"
              />
              Mandar para o calendário
            </label>
          ) : null}
        </div>
      </div>
    </GooeyCompose>
  );
}

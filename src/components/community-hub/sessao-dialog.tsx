"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { MapPin } from "lucide-react";
import { GooeyCompose } from "@/components/ui/gooey-compose";
import { DateTimeField } from "@/components/ui/date-time-field";
import { normalizeOpenSession } from "@/lib/sessao";
import { abrirSessao } from "@/lib/sessao-supabase";
import { playRuixenClick } from "@/lib/ruixen-click";
import { toast } from "@/components/ui/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  institutionId: string | null;
  onSaved: () => Promise<void> | void;
  anchorRef?: RefObject<HTMLElement | null>;
};

const STEP_MIN = 5;

/** Sessão costuma começar na hora: já vem com agora (arredondado para 5 min). */
function nowRounded() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % STEP_MIN));
  return d;
}

export function SessaoDialog({
  open,
  onOpenChange,
  communityId,
  userId,
  institutionId,
  onSaved,
  anchorRef,
}: Props) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<Date | null>(null);
  const [place, setPlace] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setWhen(nowRounded());
    setPlace("");
  }, [open]);

  const close = () => onOpenChange(false);

  const save = async () => {
    const draft = normalizeOpenSession({
      title,
      startsAt: when ? when.toISOString() : "",
      location: place,
      institutionId,
    });
    if (!draft.ok) {
      toast({
        title:
          draft.reason === "title"
            ? "Escreve o nome da sessão."
            : "Escolhe quando ela começa.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    playRuixenClick("action");
    try {
      await abrirSessao({
        communityId,
        hostId: userId,
        institutionId: draft.value.institutionId,
        title: draft.value.title,
        startsAt: draft.value.startsAt,
        location: draft.value.location,
      });
      await onSaved();
      close();
      toast({ title: "Sessão aberta" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para abrir a sessão",
        description:
          err instanceof Error && err.message === "institution_id"
            ? "Presença ainda não está liberada nesta sala."
            : undefined,
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
      title="Abrir sessão"
      onSubmit={() => void save()}
      submitLabel={saving ? "Abrindo…" : "Abrir sessão"}
      submitDisabled={saving || !title.trim() || !when}
    >
      <div className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome da sessão"
          aria-label="Nome da sessão"
          data-ff-bare-input=""
          autoFocus
          className="w-full border-0 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/25"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateTimeField
            value={when}
            onChange={setWhen}
            placeholder="Quando começa"
          />
        </div>
        <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.06] px-3 py-2">
          <MapPin className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.75} />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Lugar, se quiser"
            aria-label="Lugar"
            data-ff-bare-input=""
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
      </div>
    </GooeyCompose>
  );
}

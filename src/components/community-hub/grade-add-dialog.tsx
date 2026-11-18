"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { DoorOpen, UserRound } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { GHOST_BTN, GooeyCompose } from "@/components/ui/gooey-compose";
import { TimeRangeField } from "@/components/ui/time-range-field";
import { playRuixenClick } from "@/lib/ruixen-click";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  createGrade,
  GradeError,
  type Aula,
  type AulaDraft,
} from "@/lib/grade";
import { supabaseGradePort } from "@/lib/grade-supabase";
import { useClockTimes } from "@/components/ruixen/grade-scheduler";

const emptyDraft: AulaDraft = {
  disciplina: "",
  professor: "",
  dia: "mon",
  comeca: "19:00",
  termina: "20:40",
  salaFisica: "",
};

function draftFrom(aula: Aula | null | undefined): AulaDraft {
  if (!aula) return emptyDraft;
  return {
    disciplina: aula.disciplina,
    professor: aula.professor,
    dia: aula.dia,
    comeca: aula.comeca,
    termina: aula.termina,
    salaFisica: aula.salaFisica,
  };
}

export function GradeAddDialog({
  open,
  onOpenChange,
  communityId,
  userId,
  aula,
  onSaved,
  anchorRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  aula?: Aula | null;
  onSaved: () => Promise<void> | void;
  anchorRef?: RefObject<HTMLElement | null>;
}) {
  const t = useTranslations("grade");
  const [draft, setDraft] = useState<AulaDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const times = useClockTimes();

  useEffect(() => {
    if (!open) return;
    setDraft(draftFrom(aula));
  }, [open, aula]);

  const close = () => onOpenChange(false);

  const set = <K extends keyof AulaDraft>(key: K, value: AulaDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    playRuixenClick("action");
    try {
      const grade = createGrade(supabaseGradePort());
      const saved = aula
        ? await grade.update(communityId, userId, aula.id, draft)
        : await grade.add(communityId, userId, draft);
      await onSaved();
      close();
      if (saved.overlap) {
        toast({
          title: t("overlapTitle"),
          description: t("overlapHint"),
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: t("saveError"),
        description:
          err instanceof GradeError && err.code === "invalid"
            ? t("invalid")
            : t("saveErrorHint"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!aula) return;
    setSaving(true);
    playRuixenClick("action");
    try {
      await createGrade(supabaseGradePort()).remove(
        communityId,
        userId,
        aula.id,
      );
      await onSaved();
      close();
    } catch (err) {
      console.error(err);
      toast({
        title: t("removeError"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const field =
    "flex items-center gap-2 rounded-[8px] bg-white/[0.06] px-3";
  const fieldInput =
    "w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30";

  return (
    <GooeyCompose
      open={open}
      onClose={close}
      anchorRef={anchorRef}
      title={aula ? t("edit") : t("scheduleFor")}
      onSubmit={() => void save()}
      submitLabel={saving ? t("saving") : aula ? t("save") : t("add")}
      submitDisabled={
        saving ||
        !draft.disciplina.trim() ||
        !draft.professor.trim() ||
        !draft.salaFisica.trim()
      }
      extra={
        aula ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void remove()}
            className={cn(GHOST_BTN, "text-red-300/80 hover:text-red-200")}
          >
            {t("remove")}
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-3">
        <input
          value={draft.disciplina}
          onChange={(e) => set("disciplina", e.target.value)}
          placeholder={t("disciplina")}
          aria-label={t("disciplina")}
          data-ff-bare-input=""
          autoFocus
          className="w-full border-0 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/25"
        />

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label={t("pickDay")}
            className="inline-flex rounded-[8px] bg-white/[0.06] p-0.5"
          >
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                role="radio"
                aria-checked={draft.dia === day}
                onClick={() => {
                  playRuixenClick("tab");
                  set("dia", day);
                }}
                className={cn(
                  "rounded-[6px] px-2 py-2 text-[13px] transition-[color] sm:py-1",
                  draft.dia === day
                    ? "bg-white/[0.12] text-white"
                    : "text-white/50 hover:text-white",
                )}
              >
                {t(`daysShort.${day}`)}
              </button>
            ))}
          </div>
          <TimeRangeField
            start={draft.comeca}
            end={draft.termina}
            slots={times}
            onChange={({ start, end }) =>
              setDraft((current) => ({ ...current, comeca: start, termina: end }))
            }
            startLabel={t("comeca")}
            endLabel={t("termina")}
          />
        </div>

        <div className={field}>
          <UserRound className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.75} />
          <input
            value={draft.professor}
            onChange={(e) => set("professor", e.target.value)}
            placeholder={t("professor")}
            aria-label={t("professor")}
            data-ff-bare-input=""
            className={fieldInput}
          />
        </div>
        <div className={field}>
          <DoorOpen className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.75} />
          <input
            value={draft.salaFisica}
            onChange={(e) => set("salaFisica", e.target.value)}
            placeholder={t("sala")}
            aria-label={t("sala")}
            data-ff-bare-input=""
            className={fieldInput}
          />
        </div>
      </div>
    </GooeyCompose>
  );
}

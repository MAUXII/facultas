"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { playRuixenClick } from "@/lib/ruixen-click";
import {
  WEEKDAYS,
  createGrade,
  GradeError,
  type Aula,
  type AulaDraft,
  type Weekday,
} from "@/lib/grade";
import { supabaseGradePort } from "@/lib/grade-supabase";
import {
  GradeDayGrid,
  GradeSentence,
  GradeTimeGrid,
  nextClockAfter,
  useClockTimes,
  type GradePicker,
} from "@/components/ruixen/grade-scheduler";

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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  aula?: Aula | null;
  onSaved: () => Promise<void> | void;
}) {
  const t = useTranslations("grade");
  const [draft, setDraft] = useState<AulaDraft>(emptyDraft);
  const [picker, setPicker] = useState<GradePicker | null>(null);
  const [saving, setSaving] = useState(false);
  const times = useClockTimes();

  const dayLabels = Object.fromEntries(
    WEEKDAYS.map((day) => [day, t(`days.${day}`)]),
  ) as Record<Weekday, string>;

  useEffect(() => {
    if (!open) return;
    setDraft(draftFrom(aula));
    setPicker(null);
  }, [open, aula]);

  const close = () => onOpenChange(false);

  const backOrClose = () => {
    if (picker) {
      setPicker(null);
      return;
    }
    close();
  };

  const pickDia = (dia: Weekday) => {
    playRuixenClick("tab");
    setDraft((current) => ({ ...current, dia }));
    setPicker("start");
  };

  const pickStart = (comeca: string) => {
    playRuixenClick("tab");
    setDraft((current) => ({
      ...current,
      comeca,
      termina: comeca >= current.termina ? nextClockAfter(times, comeca) : current.termina,
    }));
    setPicker("end");
  };

  const pickEnd = (termina: string) => {
    playRuixenClick("tab");
    setDraft((current) => ({ ...current, termina }));
    setPicker(null);
  };

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

  const title =
    picker === "day"
      ? t("pickDay")
      : picker === "start"
        ? t("comeca")
        : picker === "end"
          ? t("termina")
          : aula
            ? t("edit")
            : t("scheduleFor");

  const endTimes = times.filter((slot) => slot > draft.comeca);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) backOrClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) backOrClose();
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-5 pb-10 pt-16 sm:px-8">
            <DialogTitle className="ff-display text-4xl font-medium tracking-tight text-white/50 md:text-5xl">
              {title}
            </DialogTitle>

            {picker === "day" ? (
              <GradeDayGrid
                dia={draft.dia}
                dayLabels={dayLabels}
                onPick={pickDia}
              />
            ) : null}

            {picker === "start" ? (
              <GradeTimeGrid
                times={times}
                selected={draft.comeca}
                onPick={pickStart}
              />
            ) : null}

            {picker === "end" ? (
              <GradeTimeGrid
                times={endTimes}
                selected={draft.termina}
                onPick={pickEnd}
              />
            ) : null}

            {picker ? null : (
              <form
                className="mt-12 flex flex-1 flex-col gap-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
              >
                <GradeSentence
                  dia={draft.dia}
                  comeca={draft.comeca}
                  termina={draft.termina}
                  onPick={setPicker}
                  dayLabels={dayLabels}
                  fromLabel={t("from")}
                  toLabel={t("to")}
                />
                <input
                  value={draft.disciplina}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      disciplina: e.target.value,
                    }))
                  }
                  placeholder={t("disciplina")}
                  autoFocus
                  className="ff-display w-full border-0 bg-transparent text-4xl font-medium text-white outline-none placeholder:text-white/25 md:text-5xl"
                />
                <input
                  value={draft.professor}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      professor: e.target.value,
                    }))
                  }
                  placeholder={t("professor")}
                  className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/30"
                />
                <input
                  value={draft.salaFisica}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      salaFisica: e.target.value,
                    }))
                  }
                  placeholder={t("sala")}
                  className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/30"
                />
                <div className="mt-auto flex items-center justify-end gap-2 pt-10">
                  {aula ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void remove()}
                      className="mr-auto rounded-xl px-4 py-2 text-sm text-white/40 transition hover:text-white disabled:opacity-60"
                    >
                      {t("remove")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                  >
                    {saving ? t("saving") : aula ? t("save") : t("add")}
                  </button>
                </div>
              </form>
            )}

            {picker ? (
              <div className="mt-auto flex items-center justify-end pt-10">
                <button
                  type="button"
                  onClick={backOrClose}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  {t("back")}
                </button>
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

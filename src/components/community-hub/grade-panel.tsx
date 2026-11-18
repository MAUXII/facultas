"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { WEEKDAYS, createGrade, type Aula, type Weekday } from "@/lib/grade";
import { supabaseGradePort } from "@/lib/grade-supabase";
import { GradeWeek } from "@/components/community-hub/grade-week";
import { GradeAddDialog } from "@/components/community-hub/grade-add-dialog";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { playRuixenClick } from "@/lib/ruixen-click";

export function GradePanel({
  communityId,
  userId,
  canEdit,
  fixedAulas,
}: {
  communityId: string;
  userId: string;
  canEdit: boolean;
  fixedAulas?: Aula[];
}) {
  const t = useTranslations("grade");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const addTriggerRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState<Aula | null>(null);

  const dayShortLabels = Object.fromEntries(
    WEEKDAYS.map((day) => [day, t(`daysShort.${day}`)]),
  ) as Record<Weekday, string>;

  const load = async () => {
    if (fixedAulas) {
      setAulas(fixedAulas);
      setLoading(false);
      return;
    }
    try {
      const list = await createGrade(supabaseGradePort()).list(
        communityId,
        userId,
      );
      setAulas(list);
    } catch (err) {
      console.error(err);
      setAulas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, userId, fixedAulas]);

  if (loading) {
    return <GlassCard className="h-24 gap-0 animate-pulse p-0" />;
  }

  const empty = aulas.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {canEdit && !empty ? (
        <div className="flex justify-end">
          <button
            ref={addTriggerRef}
            type="button"
            onClick={() => {
              playRuixenClick("soft");
              setAdding(true);
            }}
            className="-my-1 rounded-[8px] bg-white/[0.06] px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {t("add")}
          </button>
        </div>
      ) : null}

      {!empty ? (
        <GradeWeek
          aulas={aulas}
          dayShortLabels={dayShortLabels}
          mode={canEdit ? "admin" : "member"}
          onSelectAula={
            canEdit
              ? (aula) => {
                  playRuixenClick("soft");
                  setEditing(aula);
                }
              : undefined
          }
        />
      ) : null}

      {empty ? (
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <p className="text-sm text-white/40">
            {canEdit ? t("emptyAdmin") : t("emptyMember")}
          </p>
          {canEdit ? (
            <button
              ref={addTriggerRef}
              type="button"
              data-snd="select"
              onClick={() => {
                playRuixenClick("soft");
                setAdding(true);
              }}
              className="mt-4 rounded-[6px] bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              {t("add")}
            </button>
          ) : null}
        </div>
      ) : null}

      {canEdit ? (
        <GradeAddDialog
          open={adding || !!editing}
          onOpenChange={(open) => {
            if (open) return;
            setAdding(false);
            setEditing(null);
          }}
          communityId={communityId}
          userId={userId}
          aula={editing}
          onSaved={load}
          anchorRef={editing ? undefined : addTriggerRef}
        />
      ) : null}
    </div>
  );
}

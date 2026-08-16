"use client";

import { useEffect, useState } from "react";
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
}: {
  communityId: string;
  userId: string;
  canEdit: boolean;
}) {
  const t = useTranslations("grade");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Aula | null>(null);

  const dayShortLabels = Object.fromEntries(
    WEEKDAYS.map((day) => [day, t(`daysShort.${day}`)]),
  ) as Record<Weekday, string>;

  const load = async () => {
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
  }, [communityId, userId]);

  if (loading) {
    return <GlassCard className="h-24 gap-0 animate-pulse p-0" />;
  }

  return (
    <div className="flex flex-col gap-8">
      {canEdit ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              playRuixenClick("soft");
              setAdding(true);
            }}
            className="text-sm text-white/40 transition hover:text-white"
          >
            {t("add")}
          </button>
        </div>
      ) : null}

      <GradeWeek
        aulas={aulas}
        dayShortLabels={dayShortLabels}
        onSelectAula={
          canEdit
            ? (aula) => {
                playRuixenClick("soft");
                setEditing(aula);
              }
            : undefined
        }
      />

      {aulas.length === 0 ? (
        <p className="text-center text-sm text-white/40">
          {canEdit ? t("emptyAdmin") : t("emptyMember")}
        </p>
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
        />
      ) : null}
    </div>
  );
}

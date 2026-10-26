"use client";

import {
  visibleGradeDays,
  type Aula,
  type Weekday,
} from "@/lib/grade";
import { GlassCard } from "@/components/ui/glasscn/glass-card";

function todayWeekday(): Weekday | null {
  const name = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  });
  const map: Record<string, Weekday> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };
  return map[name] ?? null;
}

export function GradeWeek({
  aulas,
  dayShortLabels,
  mode,
  onSelectAula,
}: {
  aulas: Aula[];
  dayShortLabels: Record<Weekday, string>;
  mode: "admin" | "member";
  onSelectAula?: (aula: Aula) => void;
}) {
  const today = todayWeekday();
  const days = visibleGradeDays(aulas, mode);

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div
        className="grid gap-3 px-1"
        style={{
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          minWidth: `${Math.max(days.length * 7.5, 18)}rem`,
        }}
      >
        {days.map((day) => {
          const isToday = day === today;
          const dayAulas = aulas.filter((aula) => aula.dia === day);
          return (
            <div key={day} className="min-w-0">
              <p
                className={`px-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  isToday ? "text-white" : "text-white/35"
                }`}
              >
                {dayShortLabels[day]}
              </p>
              <div className="mt-2 flex min-h-[4.5rem] flex-col gap-2">
                {dayAulas.map((aula) => (
                  <GlassCard
                    key={aula.id}
                    className={`gap-0 px-3 py-2.5 text-white ${
                      onSelectAula ? "cursor-pointer" : ""
                    }`}
                    surfaceClassName="rounded-xl"
                    onClick={
                      onSelectAula
                        ? () => {
                            onSelectAula(aula);
                          }
                        : undefined
                    }
                  >
                    <p className="text-sm font-medium tabular-nums text-white">
                      {aula.comeca}-{aula.termina}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/70">
                      {aula.disciplina}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-white/35">
                      {aula.salaFisica}
                      {aula.professor ? ` · ${aula.professor}` : ""}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

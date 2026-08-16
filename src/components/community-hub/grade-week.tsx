"use client";

import { WEEKDAYS, type Aula, type Weekday } from "@/lib/grade";
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
  onSelectAula,
}: {
  aulas: Aula[];
  dayShortLabels: Record<Weekday, string>;
  onSelectAula?: (aula: Aula) => void;
}) {
  const today = todayWeekday();
  const byDay = Object.fromEntries(
    WEEKDAYS.map((day) => [day, aulas.filter((aula) => aula.dia === day)]),
  ) as Record<Weekday, Aula[]>;

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="grid min-w-[36rem] grid-cols-6 gap-2 px-1">
        {WEEKDAYS.map((day) => {
          const isToday = day === today;
          const dayAulas = byDay[day];
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
                    className={`gap-0 px-2.5 py-2 text-white ${
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

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Search,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";
import {
  CalendarScheduler,
  schedulerValueToDate,
  type SchedulerStep,
} from "@/components/ruixen/calendar-scheduler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color: string;
  category?: string;
  attendees?: string[];
  tags?: string[];
  /** Id no Google Calendar, se sincronizado. */
  googleEventId?: string;
}

export interface EventManagerProps {
  events?: Event[];
  onEventCreate?: (
    event: Event,
  ) => void | Promise<void | { googleEventId?: string }>;
  onEventUpdate?: (
    id: string,
    event: Event,
  ) => void | Promise<void>;
  onEventDelete?: (
    id: string,
    event?: Event,
  ) => void | Promise<void>;
  categories?: string[];
  colors?: { name: string; value: string; bg: string; text: string }[];
  defaultView?: CalendarView;
  className?: string;
  availableTags?: string[];
  /** Extra no header (ex.: conectar Google Calendar). */
  headerExtra?: React.ReactNode;
}

type CalendarView = "month" | "week" | "day" | "list";

const CALENDAR_VIEWS: CalendarView[] = ["month", "week", "day", "list"];

function isCalendarView(value: string): value is CalendarView {
  return CALENDAR_VIEWS.includes(value as CalendarView);
}

const defaultColors = [
  { name: "Azul", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Verde", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Roxo", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Laranja", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Rosa", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Vermelho", value: "red", bg: "bg-red-500", text: "text-red-700" },
];

const calendarSurfaceClass =
  "overflow-hidden rounded-[18px] border border-white/[0.06] bg-white/[0.03] sm:rounded-[20px]";

const VIEW_TAB_ITEMS = [
  { value: "month", label: "Mês" },
  { value: "week", label: "Semana" },
  { value: "day", label: "Dia" },
  { value: "list", label: "Lista" },
] as const;

function createEmptyEvent(
  colors: { value: string }[],
  categories: string[],
): Partial<Event> {
  return {
    title: "",
    description: "",
    color: colors[0]?.value ?? "blue",
    category: categories[0],
    tags: [],
  };
}

function formatScheduleLabel(date?: Date | null) {
  if (!date) return "escolher";
  return date.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Aula", "Prova", "Reunião", "Pessoal", "Entrega"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = [
    "Importante",
    "Urgente",
    "Trabalho",
    "Faculdade",
    "Grupo",
    "Entrega",
  ],
  headerExtra,
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(defaultView);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>(() =>
    createEmptyEvent(colors, categories),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [scheduleTarget, setScheduleTarget] = useState<"start" | "end" | null>(
    null,
  );
  const [scheduleStep, setScheduleStep] = useState<SchedulerStep>("month");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false;
      }

      if (selectedTags.length > 0) {
        const hasMatchingTag = event.tags?.some((tag) =>
          selectedTags.includes(tag),
        );
        if (!hasMatchingTag) return false;
      }

      if (
        selectedCategories.length > 0 &&
        event.category &&
        !selectedCategories.includes(event.category)
      ) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedColors, selectedTags, selectedCategories]);

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedTags.length > 0 ||
    selectedCategories.length > 0;

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedTags([]);
    setSelectedCategories([]);
  };

  const activeFilterCount =
    selectedColors.length + selectedTags.length + selectedCategories.length;

  const closeEventDialog = () => {
    setIsDialogOpen(false);
    setIsCreating(false);
    setSelectedEvent(null);
    setNewEvent(createEmptyEvent(colors, categories));
    setScheduleTarget(null);
    setScheduleStep("month");
  };

  const backOrCloseSchedule = () => {
    if (scheduleTarget) {
      setScheduleTarget(null);
      return;
    }
    closeEventDialog();
  };

  const openSchedule = (target: "start" | "end") => {
    setScheduleTarget(target);
    setScheduleStep(target === "end" ? "time" : "month");
  };

  const scheduleSeedDate = useMemo(() => {
    if (scheduleTarget === "end") {
      return isCreating
        ? (newEvent.endTime ?? newEvent.startTime ?? null)
        : (selectedEvent?.endTime ?? selectedEvent?.startTime ?? null);
    }
    return isCreating
      ? (newEvent.startTime ?? null)
      : (selectedEvent?.startTime ?? null);
  }, [
    scheduleTarget,
    isCreating,
    newEvent.endTime,
    newEvent.startTime,
    selectedEvent?.endTime,
    selectedEvent?.startTime,
  ]);

  const scheduleTitle =
    scheduleStep === "month"
      ? "Mês"
      : scheduleStep === "day"
        ? "Dia"
        : scheduleTarget === "end"
          ? "Término"
          : "Início";

  const applyScheduleValue = useCallback(
    (value: { date: string; time: string }) => {
      const date = schedulerValueToDate(value);
      if (!date || !scheduleTarget) return;

      const pickedStart = scheduleTarget === "start";

      if (isCreating) {
        setNewEvent((prev) => {
          if (pickedStart) {
            const end =
              prev.endTime && prev.endTime.getTime() > date.getTime()
                ? prev.endTime
                : new Date(date.getTime() + 60 * 60 * 1000);
            return { ...prev, startTime: date, endTime: end };
          }
          return { ...prev, endTime: date };
        });
      } else {
        setSelectedEvent((prev) => {
          if (!prev) return prev;
          if (pickedStart) {
            const end =
              prev.endTime.getTime() > date.getTime()
                ? prev.endTime
                : new Date(date.getTime() + 60 * 60 * 1000);
            return { ...prev, startTime: date, endTime: end };
          }
          return { ...prev, endTime: date };
        });
      }

      // Cascata igual à grade: início → término → formulário
      if (pickedStart) {
        setScheduleTarget("end");
        setScheduleStep("time");
      } else {
        setScheduleTarget(null);
        setScheduleStep("month");
      }
    },
    [isCreating, scheduleTarget],
  );

  const handleCreateEvent = useCallback(async () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;

    const event: Event = {
      id: Math.random().toString(36).slice(2, 11),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    };

    setEvents((prev) => [...prev, event]);
    closeEventDialog();

    const result = await onEventCreate?.(event);
    if (result?.googleEventId) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? { ...item, googleEventId: result.googleEventId }
            : item,
        ),
      );
    }
  }, [newEvent, colors, categories, onEventCreate]);

  const handleUpdateEvent = useCallback(async () => {
    if (!selectedEvent) return;

    setEvents((prev) =>
      prev.map((e) => (e.id === selectedEvent.id ? selectedEvent : e)),
    );
    closeEventDialog();
    await onEventUpdate?.(selectedEvent.id, selectedEvent);
  }, [selectedEvent, onEventUpdate]);

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      const existing = events.find((e) => e.id === id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      closeEventDialog();
      await onEventDelete?.(id, existing);
    },
    [onEventDelete, events],
  );

  const openEditEvent = (event: Event) => {
    setIsCreating(false);
    setSelectedEvent(event);
    setScheduleTarget(null);
    setIsDialogOpen(true);
  };

  const handleDragStart = useCallback((event: Event) => {
    setDraggedEvent(event);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null);
  }, []);

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!draggedEvent) return;

      const duration =
        draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
      const newStartTime = new Date(date);
      if (hour !== undefined) {
        newStartTime.setHours(hour, 0, 0, 0);
      }
      const newEndTime = new Date(newStartTime.getTime() + duration);

      const updatedEvent: Event = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      };

      setEvents((prev) =>
        prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)),
      );
      void onEventUpdate?.(draggedEvent.id, updatedEvent);
      setDraggedEvent(null);
    },
    [draggedEvent, onEventUpdate],
  );

  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        if (view === "month") {
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
        } else if (view === "week") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
        } else if (view === "day") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
        }
        return newDate;
      });
    },
    [view],
  );

  const getColorClasses = useCallback(
    (colorValue: string) => {
      const color = colors.find((c) => c.value === colorValue);
      return color || colors[0];
    },
    [colors],
  );

  const toggleTag = (tag: string, creating: boolean) => {
    if (creating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag)
          ? prev.tags.filter((t) => t !== tag)
          : [...(prev.tags || []), tag],
      }));
    } else {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              tags: prev.tags?.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...(prev.tags || []), tag],
            }
          : null,
      );
    }
  };

  const headerTitle = useMemo(() => {
    if (view === "month") {
      return currentDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      return `Semana de ${currentDate.toLocaleDateString("pt-BR", {
        month: "short",
        day: "numeric",
      })}`;
    }
    if (view === "day") {
      return currentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return "Todos os eventos";
  }, [view, currentDate]);

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="min-w-0 text-[28px] font-semibold capitalize tracking-tight text-white">
              {headerTitle}
            </h1>
            {headerExtra}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              data-snd="select"
              onClick={() => navigateDate("prev")}
              className="h-9 w-9 text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-snd="select"
              onClick={() => setCurrentDate(new Date())}
              className="text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-snd="select"
              onClick={() => navigateDate("next")}
              className="h-9 w-9 text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              data-snd="select"
              onClick={() => {
                setIsCreating(true);
                setSelectedEvent(null);
                setNewEvent(createEmptyEvent(colors, categories));
                setScheduleTarget("start");
                setScheduleStep("month");
                setIsDialogOpen(true);
              }}
              className="ml-2 h-10 bg-white px-4 text-black shadow-none hover:bg-white/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo evento
            </Button>
          </div>
        </div>

        <MagneticTabs
          defaultValue={view}
          items={[...VIEW_TAB_ITEMS]}
          onChange={(value) => {
            if (isCalendarView(value)) setView(value);
          }}
          className="w-fit"
        />
      </div>

      <div className="flex gap-2">
        <LiquidGlass className="min-w-0 flex-1 rounded-2xl">
          <label className="flex h-12 w-full items-center gap-3 px-4">
            <Search
              className="h-4 w-4 shrink-0 text-white/35"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </LiquidGlass>
        <FiltersMenu
          colors={colors}
          tags={availableTags}
          categories={categories}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          getColorClasses={getColorClasses}
        />
      </div>

      {/* Visualizações do calendário */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={openEditEvent}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={openEditEvent}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={openEditEvent}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "list" && (
        <ListView
          events={filteredEvents}
          onEventClick={openEditEvent}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Diálogo de evento — cascata igual à grade (início → término → form) */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(next) => {
          if (!next) backOrCloseSchedule();
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) backOrCloseSchedule();
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-5 pb-10 pt-16 sm:px-8">
              <DialogTitle className="ff-display text-4xl font-medium tracking-tight text-white/50 md:text-5xl">
                {scheduleTarget
                  ? scheduleTitle
                  : isCreating
                    ? "Novo evento"
                    : "Editar evento"}
              </DialogTitle>

              {scheduleTarget ? (
                <>
                  <CalendarScheduler
                    key={`${scheduleTarget}-${scheduleSeedDate?.getTime() ?? "new"}`}
                    initialDate={scheduleSeedDate}
                    startStep={
                      scheduleTarget === "end" && scheduleSeedDate
                        ? "time"
                        : "month"
                    }
                    startHour={7}
                    endHour={22}
                    interval={30}
                    onStepChange={setScheduleStep}
                    onConfirm={applyScheduleValue}
                  />
                  <div className="mt-auto flex items-center justify-end pt-10">
                    <button
                      type="button"
                      data-snd="select"
                      onClick={backOrCloseSchedule}
                      className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                    >
                      Voltar
                    </button>
                  </div>
                </>
              ) : (
                <form
                  className="mt-12 flex flex-1 flex-col gap-8"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (isCreating
                      ? handleCreateEvent()
                      : handleUpdateEvent());
                  }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 select-none">
                    <span className="px-0.5 text-[22px] font-light text-white/35">
                      de
                    </span>
                    <button
                      type="button"
                      data-snd="select"
                      onClick={() => openSchedule("start")}
                      className={cn(
                        "rounded-[10px] px-2.5 py-0.5 text-[28px] leading-snug transition",
                        (isCreating
                          ? newEvent.startTime
                          : selectedEvent?.startTime)
                          ? "text-white hover:bg-white/10"
                          : "text-white/35 hover:bg-white/10 hover:text-white/60",
                      )}
                    >
                      {formatScheduleLabel(
                        isCreating
                          ? newEvent.startTime
                          : selectedEvent?.startTime,
                      )}
                    </button>
                    <span className="px-0.5 text-[22px] font-light text-white/35">
                      até
                    </span>
                    <button
                      type="button"
                      data-snd="select"
                      onClick={() => openSchedule("end")}
                      className={cn(
                        "rounded-[10px] px-2.5 py-0.5 text-[28px] leading-snug transition",
                        (isCreating
                          ? newEvent.endTime
                          : selectedEvent?.endTime)
                          ? "text-white hover:bg-white/10"
                          : "text-white/35 hover:bg-white/10 hover:text-white/60",
                      )}
                    >
                      {formatScheduleLabel(
                        isCreating
                          ? newEvent.endTime
                          : selectedEvent?.endTime,
                      )}
                    </button>
                  </div>

                  <input
                    value={
                      isCreating
                        ? newEvent.title || ""
                        : selectedEvent?.title || ""
                    }
                    onChange={(e) =>
                      isCreating
                        ? setNewEvent((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        : setSelectedEvent((prev) =>
                            prev ? { ...prev, title: e.target.value } : null,
                          )
                    }
                    placeholder="Título do evento"
                    autoFocus
                    className="ff-display w-full border-0 bg-transparent text-4xl font-medium text-white outline-none placeholder:text-white/25 md:text-5xl"
                  />

                  <input
                    value={
                      isCreating
                        ? newEvent.description || ""
                        : selectedEvent?.description || ""
                    }
                    onChange={(e) =>
                      isCreating
                        ? setNewEvent((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        : setSelectedEvent((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : null,
                          )
                    }
                    placeholder="Descrição (opcional)"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/30"
                  />

                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                    {categories.map((cat) => {
                      const active =
                        (isCreating
                          ? newEvent.category
                          : selectedEvent?.category) === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          data-snd="select"
                          onClick={() =>
                            isCreating
                              ? setNewEvent((prev) => ({
                                  ...prev,
                                  category: cat,
                                }))
                              : setSelectedEvent((prev) =>
                                  prev ? { ...prev, category: cat } : null,
                                )
                          }
                          className={cn(
                            "text-sm transition",
                            active
                              ? "text-white"
                              : "text-white/30 hover:text-white/60",
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => {
                      const active =
                        (isCreating
                          ? newEvent.color
                          : selectedEvent?.color) === color.value;
                      return (
                        <button
                          key={color.value}
                          type="button"
                          data-snd="select"
                          aria-label={color.name}
                          onClick={() =>
                            isCreating
                              ? setNewEvent((prev) => ({
                                  ...prev,
                                  color: color.value,
                                }))
                              : setSelectedEvent((prev) =>
                                  prev
                                    ? { ...prev, color: color.value }
                                    : null,
                                )
                          }
                          className={cn(
                            "h-7 w-7 rounded-full transition",
                            color.bg,
                            active
                              ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--ff-bg)]"
                              : "opacity-55 hover:opacity-90",
                          )}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = isCreating
                        ? newEvent.tags?.includes(tag)
                        : selectedEvent?.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          data-snd="select"
                          onClick={() => toggleTag(tag, isCreating)}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs transition",
                            isSelected
                              ? "bg-white text-black"
                              : "bg-white/[0.06] text-white/50 hover:text-white/80",
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto flex items-center justify-end gap-2 pt-10">
                    {!isCreating ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedEvent)
                            void handleDeleteEvent(selectedEvent.id);
                        }}
                        className="mr-auto rounded-xl px-4 py-2 text-sm text-white/40 transition hover:text-white"
                      >
                        Excluir
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={closeEventDialog}
                      className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      data-snd="select"
                      disabled={
                        isCreating
                          ? !newEvent.title?.trim() ||
                            !newEvent.startTime ||
                            !newEvent.endTime
                          : !selectedEvent?.title?.trim()
                      }
                      className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                    >
                      {isCreating ? "Criar" : "Salvar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

function FiltersMenu({
  colors,
  tags,
  categories,
  selectedColors,
  setSelectedColors,
  selectedTags,
  setSelectedTags,
  selectedCategories,
  setSelectedCategories,
  clearFilters,
  hasActiveFilters,
  activeFilterCount,
  getColorClasses,
}: {
  colors: { name: string; value: string; bg: string; text: string }[];
  tags: string[];
  categories: string[];
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  getColorClasses: (colorValue: string) => {
    name: string;
    value: string;
    bg: string;
    text: string;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-white/60 transition hover:bg-white/[0.04] hover:text-white"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="max-h-[min(280px,45vh)] w-56 overflow-y-auto overscroll-contain"
      >
        <DropdownMenuLabel>Cores</DropdownMenuLabel>
        {colors.map((color) => {
          const resolved = getColorClasses(color.value);
          return (
            <DropdownMenuCheckboxItem
              key={color.value}
              checked={selectedColors.includes(color.value)}
              onCheckedChange={(checked) => {
                setSelectedColors((prev) =>
                  checked
                    ? [...prev, color.value]
                    : prev.filter((c) => c !== color.value),
                );
              }}
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded", resolved.bg)} />
                {resolved.name}
              </div>
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tags</DropdownMenuLabel>
        {tags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag}
            checked={selectedTags.includes(tag)}
            onCheckedChange={(checked) => {
              setSelectedTags((prev) =>
                checked ? [...prev, tag] : prev.filter((t) => t !== tag),
              );
            }}
          >
            {tag}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Categorias</DropdownMenuLabel>
        {categories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category}
            checked={selectedCategories.includes(category)}
            onCheckedChange={(checked) => {
              setSelectedCategories((prev) =>
                checked
                  ? [...prev, category]
                  : prev.filter((c) => c !== category),
              );
            }}
          >
            {category}
          </DropdownMenuCheckboxItem>
        ))}
        {hasActiveFilters && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                clearFilters();
              }}
              className="text-white/70 focus:text-white"
            >
              Limpar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
}: {
  event: Event;
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
  variant?: "default" | "compact" | "detailed";
}) {
  const [isHovered, setIsHovered] = useState(false);
  const colorClasses = getColorClasses(event.color);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const popoverCard = (
    <Card className="gap-0 border border-white/10 bg-[var(--ff-surface)] p-3 text-white shadow-lg shadow-black/20 ring-0">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight">{event.title}</h4>
          <div
            className={cn("h-3 w-3 flex-shrink-0 rounded-full", colorClasses.bg)}
          />
        </div>
        {event.description && (
          <p className="line-clamp-2 text-xs text-[var(--ff-muted)]">
            {event.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-[var(--ff-muted)]">
          <Clock className="h-3 w-3" />
          <span>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
          <span className="text-[10px]">({getDuration()})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {event.category && (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {event.category}
            </Badge>
          )}
          {event.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="h-5 text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );

  if (variant === "compact") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer"
      >
        <div
          className={cn(
            "truncate rounded-[8px] px-1.5 py-0.5 text-xs font-medium text-white shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-1",
            colorClasses.bg,
            isHovered && "z-10 scale-[1.02] shadow-md",
          )}
        >
          {event.title}
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            {popoverCard}
          </div>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer rounded-lg p-3 text-white transition-all duration-300 animate-in fade-in slide-in-from-left-2",
          colorClasses.bg,
          isHovered && "scale-[1.03] shadow-2xl ring-2 ring-white/50",
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && (
          <div className="mt-1 line-clamp-2 text-sm opacity-90">
            {event.description}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
        {isHovered && (
          <div className="mt-2 flex animate-in fade-in slide-in-from-bottom-1 flex-wrap gap-1 duration-200">
            {event.category && (
              <Badge variant="secondary" className="text-xs">
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "cursor-pointer rounded-[8px] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-left-1",
          colorClasses.bg,
          isHovered && "z-10 scale-[1.02] shadow-md",
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="gap-0 border border-white/10 bg-[var(--ff-surface)] p-4 text-white shadow-lg shadow-black/20 ring-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{event.title}</h4>
                <div
                  className={cn(
                    "h-4 w-4 flex-shrink-0 rounded-full",
                    colorClasses.bg,
                  )}
                />
              </div>
              {event.description && (
                <p className="text-sm text-[var(--ff-muted)]">
                  {event.description}
                </p>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[var(--ff-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MonthView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
}) {
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days: Date[] = [];
  const currentDay = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i);
    return d.toLocaleDateString("pt-BR", { weekday: "short" });
  });

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <div className={calendarSurfaceClass}>
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {weekdayLabels.map((day) => (
          <div
            key={day}
            className="border-r border-white/[0.06] px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35 last:border-r-0 sm:py-3 sm:text-xs"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0).toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={cn(
                "min-h-20 border-b border-r border-white/[0.06] bg-transparent p-1 transition-colors last:border-r-0 hover:bg-white/[0.04] sm:min-h-24 sm:p-2",
                !isCurrentMonth && "text-white/25",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              <div
                className={cn(
                  "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm",
                  isToday && "bg-white font-semibold text-black",
                  !isToday && isCurrentMonth && "text-white",
                  !isToday && !isCurrentMonth && "text-white/25",
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-[var(--ff-muted)] sm:text-xs">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventHour === hour
      );
    });
  };

  return (
    <div className={cn(calendarSurfaceClass, "overflow-auto")}>
      <div className="grid grid-cols-8 border-b border-white/[0.06]">
        <div className="border-r border-white/[0.06] px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35 sm:py-3 sm:text-xs">
          Horário
        </div>
        {weekDays.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={day.toISOString()}
              className="border-r border-white/[0.06] px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35 last:border-r-0 sm:py-3 sm:text-xs"
            >
              <div className="hidden sm:block">
                {day.toLocaleDateString("pt-BR", { weekday: "short" })}
              </div>
              <div className="sm:hidden">
                {day.toLocaleDateString("pt-BR", { weekday: "narrow" })}
              </div>
              <div
                className={cn(
                  "mx-auto mt-0.5 text-[10px] sm:text-xs",
                  isToday
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-white font-semibold text-black"
                    : "text-[var(--ff-muted)]",
                )}
              >
                {isToday ? (
                  day.getDate()
                ) : (
                  day.toLocaleDateString("pt-BR", {
                    month: "short",
                    day: "numeric",
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <React.Fragment key={`hour-${hour}`}>
            <div className="border-b border-r border-white/[0.06] p-1 text-[10px] text-white/35 sm:p-2 sm:text-xs">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 border-b border-r border-white/[0.06] p-0.5 transition-colors hover:bg-white/[0.04] last:border-r-0 sm:min-h-16 sm:p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        getColorClasses={getColorClasses}
                        variant="default"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventHour === hour
      );
    });
  };

  return (
    <div className={cn(calendarSurfaceClass, "overflow-auto")}>
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b border-white/[0.06] last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-14 flex-shrink-0 border-r border-white/[0.06] p-2 text-xs text-white/35 sm:w-20 sm:p-3 sm:text-sm">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-white/[0.04] sm:min-h-20 sm:p-2">
                <div className="space-y-2">
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      getColorClasses={getColorClasses}
                      variant="detailed"
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  events,
  onEventClick,
  getColorClasses,
}: {
  events: Event[];
  onEventClick: (event: Event) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
}) {
  const sortedEvents = [...events].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  const groupedEvents = sortedEvents.reduce<Record<string, Event[]>>(
    (acc, event) => {
      const dateKey = event.startTime.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-xs font-semibold capitalize text-white/35 sm:text-sm">
            {date}
          </h3>
          <div className="space-y-2">
            {dateEvents.map((event) => {
              const colorClasses = getColorClasses(event.color);
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="group cursor-pointer rounded-2xl bg-white/[0.03] p-3 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-2 hover:bg-white/[0.06] sm:p-4"
                >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div
                        className={cn(
                          "mt-1 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3",
                          colorClasses.bg,
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-white/90 sm:text-base">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--ff-muted)] sm:text-sm">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {event.category && (
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--ff-muted)] sm:gap-4 sm:text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.startTime.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {event.endTime.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="h-4 text-[10px] sm:h-5 sm:text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {sortedEvents.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--ff-muted)] sm:text-base">
          Nenhum evento encontrado
        </div>
      )}
    </div>
  );
}

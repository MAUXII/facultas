"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  calendarColorsForManager,
  eventChipStyle,
  eventDotClass,
  eventDotStyle,
  toneIndexForDay,
} from "@/lib/calendar-colors";
import {
  GooeyMenuItem,
  GooeyMenuLabel,
  GooeyMenuSep,
  GooeyPopover,
} from "@/components/ui/gooey-popover";
import { EventCompose, type EventDraft } from "@/components/calendar/event-compose";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";
import {
  useFacultasEventDrag,
  type FacultasDragMode,
} from "@/hooks/use-facultas-event-drag";

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
  /** Data mora fora desta agenda: aviso da comunidade ou sessão com presença. */
  locked?: boolean;
  lockKind?: "aviso" | "sessao" | "aula";
  /** Sala de origem (aula/aviso) — ponte pro hub. */
  communityId?: string;
}

export interface EventManagerProps {
  events?: Event[];
  onEventCreate?: (event: Event) => void | Promise<void>;
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
  /** Ações na barra à direita (ex.: sincronizar calendário). */
  headerActions?: React.ReactNode;
  /** Tipos que só existem vindos de fora (aviso, sessão): filtram, mas não se criam. */
  lockedCategories?: string[];
  /** CTA quando a agenda filtrada está vazia. */
  onEmptyCreate?: () => void;
  /** Abrir a grade da sala a partir de uma aula travada. */
  onOpenGrade?: (communityId: string) => void;
}

type CalendarView = "month" | "week" | "day" | "list";

const CALENDAR_VIEWS: CalendarView[] = ["month", "week", "day", "list"];

function isCalendarView(value: string): value is CalendarView {
  return CALENDAR_VIEWS.includes(value as CalendarView);
}

const defaultColors = calendarColorsForManager();

const VIEW_TAB_ITEMS = [
  { value: "month", label: "Mês" },
  { value: "week", label: "Semana" },
  { value: "day", label: "Dia" },
  { value: "list", label: "Lista" },
] as const;

const PX_PER_HOUR = 48;
const DAY_START = 7;
const DAY_END = 22;

const flatFieldClass =
  "flex h-11 items-center gap-2.5 rounded-[8px] bg-white/[0.04] px-3.5 text-sm text-white/70 transition hover:bg-white/[0.06]";

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
  headerActions,
  lockedCategories = ["Aviso", "Sessão"],
  onEmptyCreate,
  onOpenGrade,
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(defaultView);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [peekEvent, setPeekEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const newEventRef = useRef<HTMLButtonElement>(null);
  const mobileDefaultApplied = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [createSeed, setCreateSeed] = useState<Partial<EventDraft> | null>(null);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    if (mobileDefaultApplied.current) return;
    mobileDefaultApplied.current = true;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 639px)").matches) {
      setView("list");
    }
  }, []);

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

      if (selectedColors.length > 0) {
        const key = /^#/.test(event.color) ? event.color.toLowerCase() : event.color;
        if (!selectedColors.includes(key) && !selectedColors.includes(event.color)) {
          return false;
        }
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

  const filterColors = useMemo(() => {
    const extras = new Map<string, { name: string; value: string; bg: string; text: string }>();
    for (const event of events) {
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(event.color)) continue;
      const value = event.color.toLowerCase();
      if (extras.has(value)) continue;
      extras.set(value, {
        name: value.toUpperCase(),
        value,
        bg: "",
        text: "text-white",
      });
    }
    return [...colors, ...extras.values()];
  }, [colors, events]);

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
    setSelectedEvent(null);
    setCreateSeed(null);
  };

  const openCreate = (seed?: Partial<EventDraft>) => {
    setSelectedEvent(null);
    setCreateSeed(seed ?? null);
    setIsDialogOpen(true);
    onEmptyCreate?.();
  };

  const openCreateAt = useCallback(
    (date: Date, hour: number) => {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setSelectedEvent(null);
      setCreateSeed({ startTime: start, endTime: end });
      setIsDialogOpen(true);
      onEmptyCreate?.();
    },
    [onEmptyCreate],
  );

  const submitEvent = useCallback(
    async (draft: EventDraft) => {
      if (selectedEvent) {
        if (selectedEvent.locked) return;
        const updated: Event = { ...selectedEvent, ...draft };
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        closeEventDialog();
        await onEventUpdate?.(updated.id, updated);
        return;
      }
      const event: Event = { id: crypto.randomUUID(), ...draft };
      setEvents((prev) => [...prev, event]);
      closeEventDialog();
      await onEventCreate?.(event);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedEvent, onEventCreate, onEventUpdate],
  );

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      const existing = events.find((e) => e.id === id);
      if (existing?.locked) return;
      setEvents((prev) => prev.filter((e) => e.id !== id));
      closeEventDialog();
      await onEventDelete?.(id, existing);
    },
    [onEventDelete, events],
  );

  const peekAnchorRef = useRef<HTMLElement | null>(null);
  const lastPressed = useRef<HTMLElement | null>(null);

  const openPeekEvent = (event: Event, anchor?: HTMLElement | null) => {
    const pressed = lastPressed.current;
    peekAnchorRef.current =
      anchor ??
      (pressed?.dataset.eventId === event.id
        ? pressed
        : document.querySelector<HTMLElement>(`[data-event-id="${event.id}"]`));
    setPeekEvent((current) => (current?.id === event.id ? null : event));
  };

  const closePeekEvent = () => {
    setPeekEvent(null);
  };

  const openEditEvent = (event: Event) => {
    if (event.locked) {
      setPeekEvent(event);
      return;
    }
    setPeekEvent(null);
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const editFromPeek = () => {
    if (!peekEvent || peekEvent.locked) return;
    openEditEvent(peekEvent);
  };

  const handleDragStart = useCallback((event: Event) => {
    if (event.locked) return;
    setDraggedEvent(event);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null);
  }, []);

  const handleDrop = useCallback(
    (date: Date, hour?: number, minute = 0) => {
      if (!draggedEvent || draggedEvent.locked) return;

      const duration =
        draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
      const newStartTime = new Date(date);
      if (hour !== undefined) {
        newStartTime.setHours(hour, minute, 0, 0);
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

  const handleEventMove = useCallback(
    (event: Event, start: Date, end: Date) => {
      if (event.locked) return;
      const updated: Event = { ...event, startTime: start, endTime: end };
      setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
      setPeekEvent((current) => (current?.id === event.id ? updated : current));
      void onEventUpdate?.(event.id, updated);
    },
    [onEventUpdate],
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

  const showEmpty = filteredEvents.length === 0;

  return (
    <div
      className={cn("flex min-h-0 flex-col gap-4", className)}
      onPointerDownCapture={(e) => {
        lastPressed.current = (e.target as HTMLElement).closest<HTMLElement>("[data-event-id]");
      }}
      onKeyDownCapture={(e) => {
        lastPressed.current = (e.target as HTMLElement).closest<HTMLElement>("[data-event-id]");
      }}
    >
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="min-w-0 text-[26px] font-semibold tracking-tight text-white sm:text-[28px]">
            {sentenceCase(headerTitle)}
          </h1>
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
            {headerActions}
            <Button
              ref={newEventRef}
              data-snd="select"
              onClick={() => openCreate()}
              className="ml-1 h-10 bg-white px-4 text-black shadow-none hover:bg-white/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo evento
            </Button>
          </div>
        </div>

        <MagneticTabs
          value={view}
          items={[...VIEW_TAB_ITEMS]}
          onChange={(value) => {
            if (isCalendarView(value)) setView(value);
          }}
          className="w-fit"
        />
      </div>

      <div className="flex shrink-0 gap-2">
        <label className={cn(flatFieldClass, "min-w-0 flex-1")}>
          <Search className="h-4 w-4 shrink-0 text-white/35" strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Buscar eventos..."
            data-ff-bare-input=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </label>
        <FiltersMenu
          colors={filterColors}
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
        />
      </div>

      {showEmpty ? (
        <CalendarEmpty onCreate={() => openCreate()} />
      ) : (
        <div
          className={cn(
            "min-h-0",
            view === "month"
              ? "flex flex-1 flex-col"
              : "flex-1 overflow-y-auto overscroll-contain pb-10",
          )}
        >
          {view === "month" && (
            <MonthView
              onDayOpen={(date) => {
                setCurrentDate(date);
                setView("day");
              }}
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={openPeekEvent}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              peekEventId={peekEvent?.id}
            />
          )}

          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={openPeekEvent}
              onEventMove={handleEventMove}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onSlotClick={openCreateAt}
              peekEventId={peekEvent?.id}
            />
          )}

          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={openPeekEvent}
              onEventMove={handleEventMove}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onSlotClick={openCreateAt}
              peekEventId={peekEvent?.id}
            />
          )}

          {view === "list" && (
            <ListView
              events={filteredEvents}
              onEventClick={openPeekEvent}
              peekEventId={peekEvent?.id}
            />
          )}
        </div>
      )}

      <EventDetail
        event={peekEvent}
        anchorRef={peekAnchorRef}
        onClose={closePeekEvent}
        onEdit={editFromPeek}
        onOpenGrade={onOpenGrade}
      />

      <EventCompose
        open={isDialogOpen}
        onClose={closeEventDialog}
        anchorRef={selectedEvent ? undefined : newEventRef}
        editing={
          selectedEvent
            ? {
                id: selectedEvent.id,
                title: selectedEvent.title,
                description: selectedEvent.description ?? "",
                startTime: selectedEvent.startTime,
                endTime: selectedEvent.endTime,
                color: selectedEvent.color,
                category: selectedEvent.category,
                tags: selectedEvent.tags ?? [],
              }
            : null
        }
        seed={selectedEvent ? null : createSeed}
        categories={categories.filter((c) => !lockedCategories.includes(c))}
        colors={colors}
        tags={availableTags}
        onSubmit={(draft) => void submitEvent(draft)}
        onDelete={(id) => void handleDeleteEvent(id)}
      />
    </div>
  );
}

function CalendarEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-base font-medium text-white">Nada nesta agenda</p>
      <p className="mt-1 max-w-sm text-sm text-white/40">
        Crie um evento ou espere a grade das suas salas aparecer aqui.
      </p>
      <button
        type="button"
        data-snd="select"
        onClick={onCreate}
        className="mt-5 rounded-[6px] bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-white/90"
      >
        Novo evento
      </button>
    </div>
  );
}

function formatPeekWhen(start: Date, end: Date) {
  const day = start.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const t0 = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const t1 = end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${t0} – ${t1}`;
}

function EventDetail({
  event,
  anchorRef,
  onClose,
  onEdit,
  onOpenGrade,
}: {
  event: Event | null;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onEdit: () => void;
  onOpenGrade?: (communityId: string) => void;
}) {
  const [shown, setShown] = useState<Event | null>(event);
  useEffect(() => {
    if (event) setShown(event);
  }, [event]);
  const e = event ?? shown;

  const kindLabel =
    e?.lockKind === "sessao"
      ? "Sessão"
      : e?.lockKind === "aviso"
        ? "Aviso da sala"
        : e?.lockKind === "aula"
          ? "Aula da grade"
          : e?.category || "Evento";
  const kindHint =
    e?.lockKind === "sessao"
      ? "Presença marcada. A data mora na sessão."
      : e?.lockKind === "aviso"
        ? "Para mudar, edite o aviso na sala."
        : e?.lockKind === "aula"
          ? "Toda semana. Para mudar, edite a grade da turma."
          : null;

  return (
    <GooeyPopover
      open={Boolean(event)}
      onClose={onClose}
      anchorRef={anchorRef}
      width={320}
      align="start"
      role="dialog"
      ariaLabel={e?.title ?? "Evento"}
    >
      {e ? (
        <div className="p-2">
          <div className="flex items-center gap-2 text-[12px] text-white/50">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                eventDotClass(e.color),
              )}
              style={eventDotStyle(e.color)}
            />
            {kindLabel}
          </div>
          <h2 className="mt-1.5 text-[15px] font-semibold leading-snug text-white">
            {e.title}
          </h2>
          <div className="mt-2 flex items-start gap-2 text-[13px] text-white/70">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
            <span>{formatPeekWhen(e.startTime, e.endTime)}</span>
          </div>
          {e.description ? (
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-white/60">
              {e.description}
            </p>
          ) : null}
          {e.tags && e.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {e.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[4px] bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {kindHint ? <p className="mt-3 text-[12px] text-white/40">{kindHint}</p> : null}
          {!e.locked ? (
            <button
              type="button"
              data-snd="select"
              onClick={onEdit}
              className="mt-3 w-full rounded-[6px] bg-white py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              Editar
            </button>
          ) : e.lockKind === "aula" && e.communityId && onOpenGrade ? (
            <button
              type="button"
              data-snd="select"
              onClick={() => onOpenGrade(e.communityId!)}
              className="mt-3 w-full rounded-[6px] bg-white py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              Abrir grade
            </button>
          ) : null}
        </div>
      ) : null}
    </GooeyPopover>
  );
}

const FILTERS_MENU_WIDTH = 260;

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
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const toggleIn = (
    value: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
  ) =>
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
        onClick={() => setOpen((v) => !v)}
        className={cn(flatFieldClass, "shrink-0")}
      >
        <Filter className="h-4 w-4" />
        Filtros
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-xs font-medium text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      <GooeyPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={FILTERS_MENU_WIDTH}
        ariaLabel="Filtros"
        className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]"
      >
        <GooeyMenuLabel>Tipo</GooeyMenuLabel>
        {categories.map((category) => (
          <GooeyMenuItem
            key={category}
            role="menuitemcheckbox"
            title={category}
            checked={selectedCategories.includes(category)}
            onClick={() => toggleIn(category, setSelectedCategories)}
          />
        ))}
        <GooeyMenuSep />
        <GooeyMenuLabel>Cor</GooeyMenuLabel>
        {colors.map((color) => (
          <GooeyMenuItem
            key={color.value}
            role="menuitemcheckbox"
            icon={
              <span
                className={cn("block h-3 w-3 rounded-full", color.bg)}
                style={
                  !color.bg && /^#/.test(color.value)
                    ? { backgroundColor: color.value }
                    : undefined
                }
              />
            }
            title={color.name}
            checked={selectedColors.includes(color.value)}
            onClick={() => toggleIn(color.value, setSelectedColors)}
          />
        ))}
        <GooeyMenuSep />
        <GooeyMenuLabel>Tags</GooeyMenuLabel>
        {tags.map((tag) => (
          <GooeyMenuItem
            key={tag}
            role="menuitemcheckbox"
            title={tag}
            checked={selectedTags.includes(tag)}
            onClick={() => toggleIn(tag, setSelectedTags)}
          />
        ))}
        {hasActiveFilters ? (
          <>
            <GooeyMenuSep />
            <GooeyMenuItem
              icon={<X strokeWidth={1.75} />}
              title="Limpar filtros"
              onClick={() => {
                clearFilters();
                setOpen(false);
              }}
            />
          </>
        ) : null}
      </GooeyPopover>
    </>
  );
}

/* ---------- Time grid helpers ---------- */

function rangeHours(events: Event[]) {
  let first = DAY_START;
  let last = DAY_END;
  for (const e of events) {
    first = Math.min(first, e.startTime.getHours());
    const endHour =
      e.endTime.getHours() + (e.endTime.getMinutes() > 0 ? 1 : 0);
    last = Math.max(last, Math.min(endHour, 24) - 1);
  }
  first = Math.min(first, DAY_START);
  last = Math.max(last, DAY_END);
  return { first, last, hours: Array.from({ length: last - first + 1 }, (_, i) => first + i) };
}

function minutesOf(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function clockOfMinutes(total: number) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type LaidOut = {
  event: Event;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  cluster: number;
};

type LaneOverflow = {
  key: string;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  events: Event[];
};

/** Empacota overlaps em lanes lado a lado; laneCount é o do cluster inteiro. */
function layoutDayEvents(events: Event[], dayStartHour: number): LaidOut[] {
  const startMin = dayStartHour * 60;
  const sorted = [...events].sort(
    (a, b) =>
      a.startTime.getTime() - b.startTime.getTime() ||
      b.endTime.getTime() - a.endTime.getTime(),
  );
  const active: { end: number; lane: number }[] = [];
  const out: LaidOut[] = [];
  const clusterLanes: number[] = [];
  let cluster = -1;
  let clusterEnd = -Infinity;

  for (const event of sorted) {
    const s = minutesOf(event.startTime);
    const e = Math.max(minutesOf(event.endTime), s + 15);
    if (s >= clusterEnd) {
      cluster += 1;
      clusterLanes[cluster] = 0;
      active.length = 0;
    }
    clusterEnd = Math.max(clusterEnd, e);
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].end <= s) active.splice(i, 1);
    }
    const used = new Set(active.map((a) => a.lane));
    let lane = 0;
    while (used.has(lane)) lane += 1;
    active.push({ end: e, lane });
    clusterLanes[cluster] = Math.max(clusterLanes[cluster], lane + 1);
    out.push({
      event,
      top: ((s - startMin) / 60) * PX_PER_HOUR,
      height: Math.max(((e - s) / 60) * PX_PER_HOUR, 22),
      lane,
      laneCount: 0,
      cluster,
    });
  }

  return out.map((item) => ({ ...item, laneCount: clusterLanes[item.cluster] }));
}

/**
 * Corta clusters largos em `maxLanes` faixas: a última vira um chip "+N"
 * cobrindo o intervalo dos eventos escondidos.
 */
function capLanes(laid: LaidOut[], maxLanes: number) {
  const visible: LaidOut[] = [];
  const overflow: LaneOverflow[] = [];
  const hiddenByCluster = new Map<number, LaidOut[]>();

  for (const item of laid) {
    if (item.laneCount <= maxLanes) {
      visible.push(item);
      continue;
    }
    if (item.lane < maxLanes - 1) {
      visible.push({ ...item, laneCount: maxLanes });
      continue;
    }
    const list = hiddenByCluster.get(item.cluster) ?? [];
    list.push(item);
    hiddenByCluster.set(item.cluster, list);
  }

  hiddenByCluster.forEach((items, cluster) => {
    const top = Math.min(...items.map((i) => i.top));
    const bottom = Math.max(...items.map((i) => i.top + i.height));
    overflow.push({
      key: `overflow-${cluster}`,
      top,
      height: Math.max(bottom - top, 22),
      lane: maxLanes - 1,
      laneCount: maxLanes,
      events: items
        .map((i) => i.event)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    });
  });

  return { visible, overflow };
}

function sameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function NowLine({ dayStartHour, day }: { dayStartHour: number; day: Date }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!sameDay(now, day)) return null;
  const mins = minutesOf(now);
  const start = dayStartHour * 60;
  if (mins < start || mins > (DAY_END + 1) * 60) return null;
  const top = ((mins - start) / 60) * PX_PER_HOUR;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 overflow-hidden"
      style={{ top }}
      aria-hidden
    >
      <div className="relative h-px bg-rose-400/80">
        <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-rose-400" />
      </div>
    </div>
  );
}

function TimedEventBlock({
  layout,
  onEventClick,
  peekEventId,
  dense,
  tone = 0,
  liveTop,
  liveHeight,
  liveRange,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  layout: LaidOut;
  onEventClick: (event: Event) => void;
  peekEventId?: string | null;
  dense?: boolean;
  tone?: number;
  liveTop?: number;
  liveHeight?: number;
  /** "19:15 – 20:30" enquanto arrasta. */
  liveRange?: string;
  dragging?: boolean;
  onPointerDown?: (
    e: React.PointerEvent,
    event: Event,
    layout: { top: number; height: number },
    mode?: FacultasDragMode,
  ) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
}) {
  const { event, top, height, lane, laneCount } = layout;
  const open = peekEventId === event.id;
  const widthPct = 100 / laneCount;
  const chip = eventChipStyle(event.color, tone);
  const renderTop = liveTop ?? top;
  const renderHeight = liveHeight ?? height;
  return (
    <div
      data-event-id={event.id}
      role="button"
      tabIndex={0}
      aria-label={`${event.title}, ${formatClock(event.startTime)}`}
      title={`${event.title} · ${formatClock(event.startTime)}`}
      aria-expanded={open}
      onPointerDown={(e) => onPointerDown?.(e, event, { top, height })}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={(e) => {
        // Clique sem drag: o hook decide via pointerup; evita double-fire.
        if (onPointerDown) {
          e.preventDefault();
          return;
        }
        onEventClick(event);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEventClick(event);
        }
      }}
      className={cn(
        "absolute overflow-hidden rounded-[5px] outline-none touch-none focus-visible:ring-2 focus-visible:ring-white/50",
        dragging ? "z-30 shadow-[0_8px_24px_rgba(0,0,0,0.35)] brightness-110" : "transition hover:brightness-110",
        event.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        open && "ring-2 ring-white/60",
      )}
      style={{
        top: renderTop,
        height: renderHeight,
        left: `calc(${lane * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        backgroundColor: chip.fill,
        color: chip.text,
      }}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0",
          event.locked ? "w-[2px] opacity-80" : "w-[3px]",
        )}
        style={{ backgroundColor: chip.bar }}
      />
      <div className={cn("pl-2.5 pr-1", dense ? "py-0.5" : "py-1")}>
        <div className="truncate text-[11px] font-medium leading-tight sm:text-[12px]">
          {event.title}
        </div>
        {liveRange ? (
          <div className="truncate text-[10px] font-medium tabular-nums opacity-90">
            {liveRange}
          </div>
        ) : !dense || height > 36 ? (
          <div className="truncate text-[10px] opacity-65">
            {formatClock(event.startTime)}
            {event.lockKind === "aula"
              ? " · grade"
              : event.lockKind === "aviso"
                ? " · aviso"
                : event.lockKind === "sessao"
                  ? " · sessão"
                  : ""}
          </div>
        ) : null}
      </div>
      {!event.locked && onPointerDown ? (
        <div
          aria-hidden
          onPointerDown={(e) => onPointerDown(e, event, { top, height }, "resize")}
          className="group/resize absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize items-end justify-center"
        >
          <span className="mb-[3px] h-[2px] w-5 rounded-full bg-current opacity-0 transition-opacity group-hover/resize:opacity-50" />
        </div>
      ) : null}
    </div>
  );
}

function MonthChip({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  peekEventId,
  tone = 0,
}: {
  event: Event;
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  peekEventId?: string | null;
  tone?: number;
}) {
  const open = peekEventId === event.id;
  const chip = eventChipStyle(event.color, tone);
  return (
    <div
      data-event-id={event.id}
      role="button"
      tabIndex={0}
      aria-label={`${event.title}, ${formatClock(event.startTime)}`}
      aria-expanded={open}
      draggable={!event.locked}
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEventClick(event);
        }
      }}
      className={cn(
        "flex h-[22px] shrink-0 items-center gap-1.5 truncate rounded-[5px] px-1.5 text-[11px] font-medium outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/50 sm:text-[12px]",
        event.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        open && "ring-2 ring-white/60",
      )}
      style={{ backgroundColor: chip.fill, color: chip.text }}
    >
      <span
        className="h-2.5 w-0.5 shrink-0 rounded-full"
        style={{ backgroundColor: chip.bar }}
      />
      <span className="shrink-0 tabular-nums opacity-70">
        {formatClock(event.startTime)}
      </span>
      <span className="min-w-0 truncate">{event.title}</span>
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
  peekEventId,
  onDayOpen,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date) => void;
  peekEventId?: string | null;
  onDayOpen?: (date: Date) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  // Só as semanas que tocam o mês — sem a 6ª linha vazia que forçava scroll.
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days: Date[] = [];
  const currentDay = new Date(startDate);
  while (currentDay <= endDate) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i);
    return d.toLocaleDateString("pt-BR", { weekday: "short" });
  });

  const getEventsForDay = (date: Date) =>
    events
      .filter((event) => sameDay(event.startTime, date))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const gridRef = useRef<HTMLDivElement>(null);
  const [chipLimit, setChipLimit] = useState(3);

  // Google/Apple: linhas iguais; quantos chips cabem = altura da célula.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const cell = el.firstElementChild as HTMLElement | null;
      if (!cell) return;
      const h = cell.getBoundingClientRect().height;
      const usable = h - 30 - 18; // data + "+N"
      const fit = Math.max(2, Math.min(5, Math.floor(usable / 24)));
      setChipLimit(fit);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [days.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-7 border-b border-white/[0.04]">
        {weekdayLabels.map((day) => (
          <div
            key={day}
            className="px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.06em] text-white/30 sm:px-2 sm:text-[11px]"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0).toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div
        ref={gridRef}
        className="grid min-h-0 flex-1 grid-cols-7"
        style={{ gridAutoRows: "1fr" }}
      >
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const extra = Math.max(0, dayEvents.length - chipLimit);

          return (
            <div
              key={index}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden border-b border-white/[0.04] p-1.5 transition-colors hover:bg-white/[0.03] sm:p-2",
                index % 7 !== 6 && "sm:border-r sm:border-white/[0.03]",
                !isCurrentMonth && "opacity-40",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
              onClick={(e) => {
                if (window.matchMedia("(min-width: 640px)").matches) {
                  if ((e.target as HTMLElement).closest("[data-event-id]")) return;
                  if (dayEvents.length > chipLimit) onDayOpen?.(day);
                  return;
                }
                if ((e.target as HTMLElement).closest("[data-event-id]")) return;
                onDayOpen?.(day);
              }}
            >
              <div
                className={cn(
                  "mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] sm:text-[13px]",
                  isToday && "bg-white font-semibold text-black",
                  !isToday && "text-white/80",
                )}
              >
                {day.getDate()}
              </div>
              {dayEvents.length > 0 ? (
                <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden" aria-hidden>
                  {dayEvents.slice(0, 5).map((event) => {
                    const tone = toneIndexForDay(dayEvents, event.id);
                    return (
                      <span
                        key={event.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          tone === 0 ? eventDotClass(event.color) : "",
                        )}
                        style={eventDotStyle(event.color, tone)}
                      />
                    );
                  })}
                </div>
              ) : null}
              <div className="hidden min-h-0 flex-1 flex-col gap-1 overflow-hidden sm:flex">
                {dayEvents.slice(0, chipLimit).map((event) => (
                  <MonthChip
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    peekEventId={peekEventId}
                    tone={toneIndexForDay(dayEvents, event.id)}
                  />
                ))}
                {extra > 0 && (
                  <button
                    type="button"
                    className="mt-auto shrink-0 px-1 text-left text-[11px] text-white/40 transition hover:text-white/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayOpen?.(day);
                    }}
                  >
                    +{extra} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const GRID_BOTTOM_PAD = 16;

function LaneOverflowChip({
  overflow,
  dayEvents,
  onEventClick,
}: {
  overflow: LaneOverflow;
  dayEvents: Event[];
  onEventClick: (event: Event, anchor?: HTMLElement | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const { top, height, lane, laneCount, events } = overflow;
  const widthPct = 100 / laneCount;
  return (
    <>
      <button
        ref={ref}
        type="button"
        data-event-id={overflow.key}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Mais ${events.length} eventos`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "absolute flex items-start justify-center rounded-[5px] border border-white/[0.08] bg-white/[0.05] pt-1 text-[11px] font-semibold text-white/75 outline-none transition hover:bg-white/[0.09] hover:text-white focus-visible:ring-2 focus-visible:ring-white/50",
          open && "bg-white/[0.1] text-white ring-1 ring-white/30",
        )}
        style={{
          top,
          height,
          left: `calc(${lane * widthPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
        }}
      >
        +{events.length}
      </button>
      <GooeyPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
        width={260}
        role="menu"
        ariaLabel="Eventos sobrepostos"
      >
        <GooeyMenuLabel>
          {events.length} {events.length === 1 ? "evento" : "eventos"} no mesmo horário
        </GooeyMenuLabel>
        {events.map((ev) => (
          <GooeyMenuItem
            key={ev.id}
            icon={
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={eventDotStyle(ev.color, toneIndexForDay(dayEvents, ev.id))}
              />
            }
            title={ev.title}
            description={`${formatClock(ev.startTime)} – ${formatClock(ev.endTime)}`}
            onClick={() => {
              setOpen(false);
              onEventClick(ev, ref.current);
            }}
          />
        ))}
      </GooeyPopover>
    </>
  );
}

function TimeGridColumn({
  day,
  events,
  hours,
  dayStartHour,
  onEventClick,
  onEventMove,
  onSlotClick,
  peekEventId,
  dense,
}: {
  day: Date;
  events: Event[];
  hours: number[];
  dayStartHour: number;
  onEventClick: (event: Event, anchor?: HTMLElement | null) => void;
  onEventMove: (event: Event, start: Date, end: Date) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  peekEventId?: string | null;
  dense?: boolean;
}) {
  const dayEvents = events.filter((e) => sameDay(e.startTime, day));
  const { visible: laid, overflow } = capLanes(
    layoutDayEvents(dayEvents, dayStartHour),
    dense ? 2 : 3,
  );
  const height = hours.length * PX_PER_HOUR + GRID_BOTTOM_PAD;

  const drag = useFacultasEventDrag({
    pxPerHour: PX_PER_HOUR,
    dayStartHour,
    hoursCount: hours.length,
    onClick: (e) => {
      const full = dayEvents.find((item) => item.id === e.id);
      if (full) onEventClick(full);
    },
    onMove: (e, start, end) => {
      const full = dayEvents.find((item) => item.id === e.id);
      if (full) onEventMove(full, start, end);
    },
  });

  return (
    <div
      className="relative overflow-hidden border-l border-white/[0.04]"
      style={{ height }}
      onClick={(e) => {
        if (!onSlotClick) return;
        // Cliques do popover "+N" (portal) borbulham pela árvore React até aqui.
        if (!e.currentTarget.contains(e.target as Node)) return;
        if ((e.target as HTMLElement).closest("[data-event-id]")) return;
        if (drag.live) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = dayStartHour + Math.floor(y / PX_PER_HOUR);
        if (hour < dayStartHour || hour > (hours[hours.length - 1] ?? dayStartHour)) return;
        onSlotClick(day, hour);
      }}
    >
      {hours.map((hour, i) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-white/[0.04]"
          style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}
        />
      ))}
      <NowLine dayStartHour={dayStartHour} day={day} />
      {laid.map((item) => {
        const isLive = drag.live?.id === item.event.id;
        return (
          <TimedEventBlock
            key={item.event.id}
            layout={item}
            onEventClick={onEventClick}
            peekEventId={peekEventId}
            dense={dense}
            tone={toneIndexForDay(dayEvents, item.event.id)}
            liveTop={isLive ? drag.live!.top : undefined}
            liveHeight={isLive ? drag.live!.height : undefined}
            liveRange={
              isLive
                ? `${clockOfMinutes(drag.live!.startMin)} – ${clockOfMinutes(drag.live!.endMin)}`
                : undefined
            }
            dragging={Boolean(isLive)}
            onPointerDown={drag.onPointerDown}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
          />
        );
      })}
      {overflow.map((o) => (
        <LaneOverflowChip
          key={o.key}
          overflow={o}
          dayEvents={dayEvents}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  onEventMove,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  onDrop: _onDrop,
  onSlotClick,
  peekEventId,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventMove: (event: Event, start: Date, end: Date) => void;
  onDragStart?: (event: Event) => void;
  onDragEnd?: () => void;
  onDrop?: (date: Date, hour: number) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  peekEventId?: string | null;
}) {
  void _onDragStart;
  void _onDragEnd;
  void _onDrop;
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });
  const weekEvents = events.filter((e) =>
    weekDays.some((d) => sameDay(e.startTime, d)),
  );
  const { first, hours } = rangeHours(weekEvents);
  const height = hours.length * PX_PER_HOUR + GRID_BOTTOM_PAD;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-white/[0.04] sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div />
          {weekDays.map((day) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={day.toISOString()}
                className="px-1 py-2 text-center text-[11px] text-white/40 sm:text-[12px]"
              >
                <div className="uppercase tracking-wide">
                  {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[13px]",
                    isToday
                      ? "bg-white font-semibold text-black"
                      : "text-white/80",
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div className="relative overflow-hidden" style={{ height }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute inset-x-0 pr-2 text-right text-[10px] leading-none text-white/30"
                style={{ top: i * PX_PER_HOUR + 2 }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {weekDays.map((day) => (
            <TimeGridColumn
              key={day.toISOString()}
              day={day}
              events={weekEvents}
              hours={hours}
              dayStartHour={first}
              onEventClick={onEventClick}
              onEventMove={onEventMove}
              onSlotClick={onSlotClick}
              peekEventId={peekEventId}
              dense
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  events,
  onEventClick,
  onEventMove,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  onDrop: _onDrop,
  onSlotClick,
  peekEventId,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventMove: (event: Event, start: Date, end: Date) => void;
  onDragStart?: (event: Event) => void;
  onDragEnd?: () => void;
  onDrop?: (date: Date, hour: number) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  peekEventId?: string | null;
}) {
  void _onDragStart;
  void _onDragEnd;
  void _onDrop;
  const dayEvents = events.filter((e) => sameDay(e.startTime, currentDate));
  const { first, hours } = rangeHours(dayEvents);
  const height = hours.length * PX_PER_HOUR + GRID_BOTTOM_PAD;

  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)] overflow-x-hidden sm:grid-cols-[56px_minmax(0,1fr)]">
      <div className="relative overflow-hidden" style={{ height }}>
        {hours.map((hour, i) => (
          <div
            key={hour}
            className="absolute inset-x-0 pr-2 text-right text-[10px] leading-none text-white/30 sm:text-[11px]"
            style={{ top: i * PX_PER_HOUR + 2 }}
          >
            {hour.toString().padStart(2, "0")}:00
          </div>
        ))}
      </div>
      <TimeGridColumn
        day={currentDate}
        events={dayEvents}
        hours={hours}
        dayStartHour={first}
        onEventClick={onEventClick}
        onEventMove={onEventMove}
        onSlotClick={onSlotClick}
        peekEventId={peekEventId}
      />
    </div>
  );
}

function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ListView({
  events,
  onEventClick,
  peekEventId,
}: {
  events: Event[];
  onEventClick: (event: Event) => void;
  peekEventId?: string | null;
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
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-white/35">
            {sentenceCase(date)}
          </h3>
          <div className="divide-y divide-white/[0.04]">
            {dateEvents.map((event) => {
              const tone = toneIndexForDay(dateEvents, event.id);
              return (
                <div
                  key={event.id}
                  data-event-id={event.id}
                  role="button"
                  tabIndex={0}
                  aria-expanded={peekEventId === event.id}
                  onClick={() => onEventClick(event)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onEventClick(event);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 py-3 outline-none transition hover:bg-white/[0.03] focus-visible:bg-white/[0.04]",
                    peekEventId === event.id && "bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      tone === 0 ? eventDotClass(event.color) : "",
                    )}
                    style={eventDotStyle(event.color, tone)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="truncate text-[14px] font-medium text-white">
                        {event.title}
                      </h4>
                      <span className="shrink-0 tabular-nums text-[12px] text-white/40">
                        {formatClock(event.startTime)}
                      </span>
                    </div>
                    {event.description ? (
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-white/40">
                        {event.description}
                      </p>
                    ) : null}
                    {event.category || (event.tags && event.tags.length > 0) ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-white/35">
                        {event.category ? <span>{event.category}</span> : null}
                        {event.tags?.map((tag) => (
                          <span key={tag}>· {tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

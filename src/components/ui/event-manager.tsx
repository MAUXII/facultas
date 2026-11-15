"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  GooeyMenuItem,
  GooeyMenuLabel,
  GooeyMenuSep,
  GooeyPopover,
} from "@/components/ui/gooey-popover";
import { EventCompose, type EventDraft } from "@/components/calendar/event-compose";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";

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
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(defaultView);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [peekEvent, setPeekEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const newEventRef = useRef<HTMLButtonElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    setSelectedEvent(null);
  };

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

  // O detalhe nasce do cartão clicado (o mesmo evento pode aparecer em vários dias).
  const peekAnchorRef = useRef<HTMLElement | null>(null);
  const lastPressed = useRef<HTMLElement | null>(null);

  const openPeekEvent = (event: Event) => {
    const pressed = lastPressed.current;
    peekAnchorRef.current =
      pressed?.dataset.eventId === event.id
        ? pressed
        : document.querySelector<HTMLElement>(`[data-event-id="${event.id}"]`);
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
    (date: Date, hour?: number) => {
      if (!draggedEvent || draggedEvent.locked) return;

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
    <div
      className={cn("flex flex-col gap-8", className)}
      onPointerDownCapture={(e) => {
        lastPressed.current = (e.target as HTMLElement).closest<HTMLElement>("[data-event-id]");
      }}
      onKeyDownCapture={(e) => {
        lastPressed.current = (e.target as HTMLElement).closest<HTMLElement>("[data-event-id]");
      }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="min-w-0 text-[28px] font-semibold tracking-tight text-white">
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
              onClick={() => {
                setSelectedEvent(null);
                setIsDialogOpen(true);
              }}
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
              data-ff-bare-input=""
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
        />
      </div>

      {/* Visualizações do calendário */}
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
          getColorClasses={getColorClasses}
          peekEventId={peekEvent?.id}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={openPeekEvent}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
          peekEventId={peekEvent?.id}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={openPeekEvent}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
          peekEventId={peekEvent?.id}
        />
      )}

      {view === "list" && (
        <ListView
          events={filteredEvents}
          onEventClick={openPeekEvent}
          getColorClasses={getColorClasses}
          peekEventId={peekEvent?.id}
        />
      )}

      <EventDetail
        event={peekEvent}
        anchorRef={peekAnchorRef}
        getColorClasses={getColorClasses}
        onClose={closePeekEvent}
        onEdit={editFromPeek}
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
        categories={categories.filter((c) => !lockedCategories.includes(c))}
        colors={colors}
        tags={availableTags}
        onSubmit={(draft) => void submitEvent(draft)}
        onDelete={(id) => void handleDeleteEvent(id)}
      />
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
  getColorClasses,
  onClose,
  onEdit,
}: {
  event: Event | null;
  anchorRef: React.RefObject<HTMLElement | null>;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
  onClose: () => void;
  onEdit: () => void;
}) {
  // Mantém o último evento enquanto o painel fecha.
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
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", getColorClasses(e.color).bg)} />
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
                  className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-white/60"
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

  const label = (
    <span className="inline-flex h-12 items-center gap-2 px-4 text-sm">
      <Filter className="h-4 w-4" />
      Filtros
      {activeFilterCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-xs font-medium text-white">
          {activeFilterCount}
        </span>
      )}
    </span>
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
        className="shrink-0 rounded-2xl border-0 bg-transparent p-0 text-white/70 outline-none transition hover:text-white"
      >
        <LiquidGlass className="rounded-2xl">{label}</LiquidGlass>
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
            icon={<span className={cn("block h-3 w-3 rounded-full", color.bg)} />}
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

/** Horas da grade: 7h–22h, esticando se algum evento sair disso. */
function visibleHours(events: Event[]) {
  let first = 7;
  let last = 22;
  for (const e of events) {
    first = Math.min(first, e.startTime.getHours());
    const endHour = e.endTime.getHours() + (e.endTime.getMinutes() > 0 ? 1 : 0);
    last = Math.max(last, Math.min(endHour, 24) - 1);
  }
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
  peekEventId,
}: {
  event: Event;
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
  variant?: "default" | "compact" | "detailed";
  peekEventId?: string | null;
}) {
  const colorClasses = getColorClasses(event.color);
  const open = peekEventId === event.id;
  const common = {
    "data-event-id": event.id,
    role: "button",
    tabIndex: 0,
    "aria-label": `${event.title}, ${formatClock(event.startTime)}`,
    "aria-expanded": open,
    draggable: !event.locked,
    onDragStart: () => onDragStart(event),
    onDragEnd,
    onClick: () => onEventClick(event),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onEventClick(event);
      }
    },
  } as const;

  if (variant === "detailed") {
    return (
      <div
        {...common}
        className={cn(
          "cursor-pointer rounded-[12px] p-3 text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60",
          colorClasses.bg,
          open && "ring-2 ring-white/70",
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description ? (
          <div className="mt-1 line-clamp-2 text-sm opacity-90">{event.description}</div>
        ) : null}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {formatClock(event.startTime)} – {formatClock(event.endTime)}
        </div>
      </div>
    );
  }

  return (
    <div
      {...common}
      className={cn(
        "cursor-pointer truncate rounded-[8px] font-medium text-white shadow-sm outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60",
        variant === "compact" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs",
        colorClasses.bg,
        open && "ring-2 ring-white/70",
      )}
    >
      {event.title}
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
  peekEventId,
  onDayOpen,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
  peekEventId?: string | null;
  /** Celular: tocar no dia abre a visão do dia. */
  onDayOpen?: (date: Date) => void;
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
              onClick={(e) => {
                // Só no celular, onde os cartões viram bolinhas.
                if (window.matchMedia("(min-width: 640px)").matches) return;
                if ((e.target as HTMLElement).closest("[data-event-id]")) return;
                onDayOpen?.(day);
              }}
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
              {dayEvents.length > 0 ? (
                <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden" aria-hidden>
                  {dayEvents.slice(0, 4).map((event) => (
                    <span
                      key={event.id}
                      className={cn("h-1.5 w-1.5 rounded-full", getColorClasses(event.color).bg)}
                    />
                  ))}
                </div>
              ) : null}
              <div className="hidden space-y-1 sm:block">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                    peekEventId={peekEventId}
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
  peekEventId,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
  peekEventId?: string | null;
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = visibleHours(events);

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
                        peekEventId={peekEventId}
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
  peekEventId,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
  peekEventId?: string | null;
}) {
  const hours = visibleHours(events);

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
                      peekEventId={peekEventId}
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

function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ListView({
  events,
  onEventClick,
  getColorClasses,
  peekEventId,
}: {
  events: Event[];
  onEventClick: (event: Event) => void;
  getColorClasses: (color: string) => { bg: string; text: string; name: string };
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
          <h3 className="text-xs font-semibold text-white/55 sm:text-sm">
            {sentenceCase(date)}
          </h3>
          <div className="space-y-2">
            {dateEvents.map((event) => {
              const colorClasses = getColorClasses(event.color);
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
                    "group cursor-pointer rounded-2xl bg-white/[0.03] p-3 outline-none transition-colors duration-200 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/40 sm:p-4",
                    peekEventId === event.id && "bg-white/[0.07]",
                  )}
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

// apps/frontend/src/components/ui/DatePicker.tsx
// Shared German-convention date picker. Replaces the native <input type="date"> (which renders
// in the browser locale — US MM/DD/YYYY, Sunday-first) with a controlled popover calendar that:
//   • displays TT.MM.JJJJ and accepts typed German input,
//   • starts the week on Monday (Mo–So) with an ISO Kalenderwoche (KW) column,
//   • dims weekends, marks today, supports min/max, Heute + Löschen,
//   • keeps the SAME value contract as the native input: value/onChange are "YYYY-MM-DD"
//     (or "" when cleared), so it drops into existing forms with no payload changes.
//
// One component, two themes via `variant`: "admin" (slate) and "public" (cream/gold).
// UI language is switchable via `locale` ("de" default, "en" for the English admin chrome):
// it translates month/weekday names, the week-number header, Today/Clear and aria text. The
// DD.MM.YYYY date ORDER stays the same in both languages so it matches the German invoices/PDFs.

"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export type DatePickerVariant = "admin" | "public";
export type DatePickerLocale = "de" | "en";

export interface DatePickerProps {
  /** Controlled value, ISO "YYYY-MM-DD" or "" when empty. */
  value: string;
  /** Emits "YYYY-MM-DD" on selection, or "" when cleared. */
  onChange: (value: string) => void;
  variant?: DatePickerVariant;
  /** Inclusive lower bound, "YYYY-MM-DD". */
  min?: string;
  /** Inclusive upper bound, "YYYY-MM-DD". */
  max?: string;
  /** Show the ISO week-number (KW) column. Default true (Option A). */
  showWeekNumbers?: boolean;
  /** Show the quick-preset rail (Heute / Morgen / this & next week). Default false. */
  presets?: boolean;
  /** UI language for month/weekday names, buttons and aria text. Default "de". Date order stays DD.MM.YYYY. */
  locale?: DatePickerLocale;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  /** Marks the field invalid (red border). */
  invalid?: boolean;
  /** Wrapper className. */
  className?: string;
}

interface Strings {
  months: string[];
  monthsShort: string[];
  dow: string[];          // Monday-first weekday headers
  week: string;           // week-number column header
  placeholder: string;
  today: string;
  clear: string;
  openCalendar: string;
  chooseDate: string;
  prevMonth: string; nextMonth: string;
  prevYear: string; nextYear: string;
  prevDecade: string; nextDecade: string;
  presets: { today: string; tomorrow: string; thisWeek: string; nextWeek: string; in30: string };
  dayLabel: (d: Date, monthName: string) => string;
}

const STRINGS: Record<DatePickerLocale, Strings> = {
  de: {
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    dow: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    week: "KW",
    placeholder: "TT.MM.JJJJ",
    today: "Heute",
    clear: "Löschen",
    openCalendar: "Kalender öffnen",
    chooseDate: "Datum wählen",
    prevMonth: "Vorheriger Monat", nextMonth: "Nächster Monat",
    prevYear: "Vorheriges Jahr", nextYear: "Nächstes Jahr",
    prevDecade: "Vorheriges Jahrzehnt", nextDecade: "Nächstes Jahrzehnt",
    presets: { today: "Heute", tomorrow: "Morgen", thisWeek: "Diese Woche", nextWeek: "Nächste Woche", in30: "In 30 Tagen" },
    dayLabel: (d, m) => `${d.getDate()}. ${m} ${d.getFullYear()}`,
  },
  en: {
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    dow: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    week: "Wk",
    placeholder: "DD.MM.YYYY",
    today: "Today",
    clear: "Clear",
    openCalendar: "Open calendar",
    chooseDate: "Choose date",
    prevMonth: "Previous month", nextMonth: "Next month",
    prevYear: "Previous year", nextYear: "Next year",
    prevDecade: "Previous decade", nextDecade: "Next decade",
    presets: { today: "Today", tomorrow: "Tomorrow", thisWeek: "This week", nextWeek: "Next week", in30: "In 30 days" },
    dayLabel: (d, m) => `${m} ${d.getDate()}, ${d.getFullYear()}`,
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatDE = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

function fromISO(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parse flexible German input: 15.06.2026, 15.6.26, 15/6/2026. Returns null if invalid. */
function parseDE(str: string): Date | null {
  const m = /^(\d{1,2})[.\/\-\s](\d{1,2})[.\/\-\s](\d{2,4})$/.exec(str.trim());
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  let y = Number(m[3]);
  if (m[3].length === 2) y = 2000 + y;
  const d = new Date(y, mm - 1, dd);
  if (Number.isNaN(d.getTime()) || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

/** ISO 8601 week number (weeks start Monday; week 1 contains the year's first Thursday). */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const ftDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ftDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
}

const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
/** First year of the decade containing `year` (e.g. 2026 → 2020). */
const decadeStart = (year: number) => Math.floor(year / 10) * 10;
/** Advance the header view by one unit: month (days), year (months), or decade (years). */
function stepView(d: Date, view: "days" | "months" | "years", dir: 1 | -1): Date {
  if (view === "days") return new Date(d.getFullYear(), d.getMonth() + dir, 1);
  if (view === "months") return new Date(d.getFullYear() + dir, d.getMonth(), 1);
  return new Date(d.getFullYear() + dir * 10, d.getMonth(), 1);
}

interface Theme {
  field: string; icon: string; pop: string; navBtn: string; title: string;
  dow: string; weekendDow: string; kw: string; day: string; weekendDay: string;
  outside: string; selected: string; today: string; disabled: string;
  foot: string; footBtn: string; preset: string; monthBtn: string; monthSel: string;
  cell: number; popW: number; fieldH: string; fieldText: string;
}

const THEMES: Record<DatePickerVariant, Theme> = {
  admin: {
    field: "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-within:border-slate-900",
    fieldH: "h-9", fieldText: "text-[13px]",
    icon: "text-slate-400",
    pop: "border-slate-200 bg-white",
    navBtn: "border-slate-200 text-slate-600 hover:bg-slate-50",
    title: "text-slate-900 hover:bg-slate-100",
    dow: "text-slate-500", weekendDow: "text-slate-400", kw: "text-slate-400",
    day: "text-slate-900 hover:bg-slate-100", weekendDay: "text-slate-400 hover:bg-slate-100",
    outside: "text-slate-300 hover:bg-slate-50",
    selected: "bg-slate-900 text-white hover:bg-slate-900",
    today: "ring-1 ring-inset ring-slate-300",
    disabled: "text-slate-200 cursor-not-allowed hover:bg-transparent",
    foot: "border-slate-200", footBtn: "text-slate-600 hover:text-slate-900",
    preset: "border-slate-200 text-slate-700 hover:bg-slate-50",
    monthBtn: "text-slate-700 hover:bg-slate-100", monthSel: "bg-slate-900 text-white hover:bg-slate-900",
    cell: 34, popW: 300,
  },
  public: {
    field: "border-line bg-cream text-ink placeholder:text-mute-soft focus-within:border-gold-deep",
    fieldH: "h-11", fieldText: "text-[15px]",
    icon: "text-mute",
    pop: "border-line bg-paper",
    navBtn: "border-line text-mute hover:bg-cream",
    title: "text-ink hover:bg-cream",
    dow: "text-mute", weekendDow: "text-mute-soft", kw: "text-mute-soft",
    day: "text-ink hover:bg-cream", weekendDay: "text-mute hover:bg-cream",
    outside: "text-mute-soft hover:bg-cream",
    selected: "bg-gold-deep text-cream hover:bg-gold-deep",
    today: "ring-1 ring-inset ring-gold-deep/40",
    disabled: "text-line cursor-not-allowed hover:bg-transparent",
    foot: "border-line", footBtn: "text-gold-deep hover:opacity-80",
    preset: "border-line text-ink hover:bg-cream",
    monthBtn: "text-ink hover:bg-cream", monthSel: "bg-gold-deep text-cream hover:bg-gold-deep",
    cell: 38, popW: 320,
  },
};

export function DatePicker({
  value, onChange, variant = "public", min, max,
  showWeekNumbers = true, presets = false, locale = "de", placeholder,
  disabled, id, name, invalid, className, ...aria
}: DatePickerProps) {
  const t = THEMES[variant];
  const s = STRINGS[locale];
  const ph = placeholder ?? s.placeholder;
  const reactId = useId();
  const inputId = id ?? `dp-${reactId}`;
  const ariaLabel = aria["aria-label"];

  const selected = useMemo(() => fromISO(value), [value]);
  const minD = useMemo(() => fromISO(min), [min]);
  const maxD = useMemo(() => fromISO(max), [max]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [viewDate, setViewDate] = useState<Date>(() => firstOfMonth(selected ?? today));
  const [focusDate, setFocusDate] = useState<Date>(() => selected ?? today);
  const [text, setText] = useState<string>(() => (selected ? formatDE(selected) : ""));
  // Edge-aware popover placement: flip horizontally / open upward near viewport edges.
  const [placement, setPlacement] = useState<{ alignRight: boolean; openUp: boolean }>({ alignRight: false, openUp: false });

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Keep the displayed text and view in sync when the value changes from outside.
  useEffect(() => {
    setText(selected ? formatDE(selected) : "");
    if (selected) { setViewDate(firstOfMonth(selected)); setFocusDate(selected); }
  }, [selected]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Measure available space and flip the popover so it never clips off-screen
  // (e.g. the date field sitting in the right-hand column of a form).
  useLayoutEffect(() => {
    if (!open) return;
    const field = rootRef.current?.getBoundingClientRect();
    const pop = popRef.current?.getBoundingClientRect();
    if (!field) return;
    const popW = pop?.width ?? (t.popW + (presets ? 132 : 0));
    const popH = pop?.height ?? 340;
    const margin = 8;
    const alignRight = field.left + popW + margin > window.innerWidth && field.right - popW >= margin;
    const openUp = field.bottom + popH + margin > window.innerHeight && field.top - popH - margin >= 0;
    setPlacement((prev) => (prev.alignRight === alignRight && prev.openUp === openUp ? prev : { alignRight, openUp }));
  }, [open, view, presets, t.popW]);

  const isDisabled = useCallback(
    (d: Date) => (minD != null && startOfDay(d) < minD) || (maxD != null && startOfDay(d) > maxD),
    [minD, maxD],
  );

  const commit = useCallback((d: Date) => {
    onChange(toISO(d));
    setText(formatDE(d));
  }, [onChange]);

  const openCalendar = useCallback((focusGrid: boolean) => {
    setView("days");
    const base = selected ?? today;
    setViewDate(firstOfMonth(base));
    setFocusDate(base);
    setOpen(true);
    if (focusGrid) {
      requestAnimationFrame(() => {
        gridRef.current?.querySelector<HTMLElement>(`[data-iso="${toISO(base)}"]`)?.focus();
      });
    }
  }, [selected, today]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) inputRef.current?.focus();
  }, []);

  const moveFocus = useCallback((d: Date) => {
    if (d.getMonth() !== viewDate.getMonth() || d.getFullYear() !== viewDate.getFullYear()) {
      setViewDate(firstOfMonth(d));
    }
    setFocusDate(d);
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>(`[data-iso="${toISO(d)}"]`)?.focus();
    });
  }, [viewDate]);

  // Commit typed text on blur / Enter.
  const commitText = useCallback(() => {
    const raw = text.trim();
    if (raw === "") { onChange(""); return; }
    const parsed = parseDE(raw);
    if (parsed && !isDisabled(parsed)) { commit(parsed); }
    else { setText(selected ? formatDE(selected) : ""); } // revert invalid / out-of-range
  }, [text, onChange, isDisabled, commit, selected]);

  // 6-week grid for the displayed month (stable height).
  const weeks = useMemo(() => {
    const first = firstOfMonth(viewDate);
    const lead = (first.getDay() + 6) % 7; // Monday-first offset
    const gridStart = addDays(first, -lead);
    const rows: { kw: number; days: Date[] }[] = [];
    for (let w = 0; w < 6; w++) {
      const rowStart = addDays(gridStart, w * 7);
      const days = Array.from({ length: 7 }, (_, i) => addDays(rowStart, i));
      rows.push({ kw: isoWeek(rowStart), days });
    }
    return rows;
  }, [viewDate]);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(focusDate, -1); break;
      case "ArrowRight": next = addDays(focusDate, 1); break;
      case "ArrowUp": next = addDays(focusDate, -7); break;
      case "ArrowDown": next = addDays(focusDate, 7); break;
      case "Home": next = addDays(focusDate, -((focusDate.getDay() + 6) % 7)); break;
      case "End": next = addDays(focusDate, 6 - ((focusDate.getDay() + 6) % 7)); break;
      case "PageUp": next = new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, focusDate.getDate()); break;
      case "PageDown": next = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, focusDate.getDate()); break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isDisabled(focusDate)) { commit(focusDate); close(); }
        return;
      case "Escape": e.preventDefault(); close(); return;
      default: return;
    }
    if (next) { e.preventDefault(); moveFocus(next); }
  };

  const applyPreset = (d: Date) => { if (!isDisabled(d)) { commit(d); close(); } };

  const gridCols = showWeekNumbers ? `28px repeat(7, ${t.cell}px)` : `repeat(7, ${t.cell}px)`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Field */}
      <div
        className={cn(
          "flex w-full items-center border transition-colors",
          t.fieldH, t.field,
          invalid && "border-rose-400 focus-within:border-rose-500",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          placeholder={ph}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => !disabled && openCalendar(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && open) { e.preventDefault(); moveFocus(focusDate); }
            else if (e.key === "Enter") { e.preventDefault(); commitText(); close(); }
            else if (e.key === "Escape") { setOpen(false); }
          }}
          onBlur={() => { if (!rootRef.current?.contains(document.activeElement)) commitText(); }}
          className={cn("h-full w-full bg-transparent px-3 tabular-nums focus:outline-none", t.fieldText)}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={s.openCalendar}
          onClick={() => (open ? close(false) : openCalendar(true))}
          className={cn("flex h-full items-center px-2.5", t.icon)}
        >
          <Calendar className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>

      {/* Popover */}
      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label={s.chooseDate}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); close(); } }}
          className={cn(
            "absolute z-40 flex gap-2 border p-3 shadow-lg",
            placement.alignRight ? "right-0" : "left-0",
            placement.openUp ? "bottom-full mb-1" : "top-full mt-1",
            t.pop,
          )}
        >
          <div>
            {/* Header — arrows step by month / year / decade; title drills days → months → years. */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button" aria-label={view === "days" ? s.prevMonth : view === "months" ? s.prevYear : s.prevDecade}
                onClick={() => setViewDate(stepView(viewDate, view, -1))}
                className={cn("grid h-7 w-7 place-items-center border", t.navBtn)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView(view === "days" ? "months" : view === "months" ? "years" : "months")}
                className={cn("px-2 py-1 text-[13px] font-semibold", t.title)}
              >
                {view === "days"
                  ? `${s.months[viewDate.getMonth()]} ${viewDate.getFullYear()}`
                  : view === "months"
                    ? viewDate.getFullYear()
                    : `${decadeStart(viewDate.getFullYear())} – ${decadeStart(viewDate.getFullYear()) + 9}`}
              </button>
              <button
                type="button" aria-label={view === "days" ? s.nextMonth : view === "months" ? s.nextYear : s.nextDecade}
                onClick={() => setViewDate(stepView(viewDate, view, 1))}
                className={cn("grid h-7 w-7 place-items-center border", t.navBtn)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {view === "days" ? (
              <>
                {/* Weekday header */}
                <div className="grid gap-0.5" style={{ gridTemplateColumns: gridCols }}>
                  {showWeekNumbers && (
                    <div className={cn("py-1 text-center text-[10px] font-semibold", t.kw)}>{s.week}</div>
                  )}
                  {s.dow.map((d, i) => (
                    <div key={d} className={cn("py-1 text-center text-[11px] font-semibold", i >= 5 ? t.weekendDow : t.dow)}>{d}</div>
                  ))}
                </div>
                {/* Day grid */}
                <div ref={gridRef} role="grid" onKeyDown={onGridKeyDown} className="grid gap-0.5" style={{ gridTemplateColumns: gridCols }}>
                  {weeks.map((wk) => (
                    <div key={wk.kw + "-" + toISO(wk.days[0])} role="row" className="contents">
                      {showWeekNumbers && (
                        <div className={cn("flex items-center justify-center text-[10px] tabular-nums", t.kw)} style={{ height: t.cell }}>{wk.kw}</div>
                      )}
                      {wk.days.map((day, i) => {
                        const inMonth = day.getMonth() === viewDate.getMonth();
                        const isSel = sameDay(day, selected);
                        const isToday = sameDay(day, today);
                        const dis = isDisabled(day);
                        const weekend = i >= 5;
                        const isFocus = sameDay(day, focusDate);
                        return (
                          <button
                            key={toISO(day)}
                            type="button"
                            role="gridcell"
                            data-iso={toISO(day)}
                            tabIndex={isFocus ? 0 : -1}
                            aria-selected={isSel}
                            aria-disabled={dis || undefined}
                            aria-label={s.dayLabel(day, s.months[day.getMonth()])}
                            disabled={dis}
                            onClick={() => { if (!dis) { commit(day); close(); } }}
                            className={cn(
                              "flex items-center justify-center text-[13px] tabular-nums transition-colors",
                              dis ? t.disabled
                                : isSel ? t.selected
                                  : !inMonth ? t.outside
                                    : weekend ? t.weekendDay : t.day,
                              isToday && !isSel && t.today,
                            )}
                            style={{ height: t.cell }}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className={cn("mt-2 flex justify-between border-t pt-2", t.foot)}>
                  <button type="button" onClick={() => { onChange(""); setText(""); close(); }} className={cn("px-1 text-[12px]", t.footBtn)}>
                    {s.clear}
                  </button>
                  <button
                    type="button"
                    disabled={isDisabled(today)}
                    onClick={() => applyPreset(today)}
                    className={cn("px-1 text-[12px] disabled:opacity-40", t.footBtn)}
                  >
                    {s.today}
                  </button>
                </div>
              </>
            ) : view === "months" ? (
              // Month picker
              <div className="grid grid-cols-3 gap-1" style={{ width: t.popW - 24 }}>
                {s.monthsShort.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setView("days"); }}
                    className={cn("py-2 text-[13px] transition-colors", i === viewDate.getMonth() ? t.monthSel : t.monthBtn)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : (
              // Year picker — a 12-cell decade grid (with one leading + one trailing year).
              <div className="grid grid-cols-3 gap-1" style={{ width: t.popW - 24 }}>
                {Array.from({ length: 12 }, (_, i) => decadeStart(viewDate.getFullYear()) - 1 + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewDate(new Date(y, viewDate.getMonth(), 1)); setView("months"); }}
                    className={cn(
                      "py-2 text-[13px] tabular-nums transition-colors",
                      y === viewDate.getFullYear() ? t.monthSel : t.monthBtn,
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-preset rail (Option C) */}
          {presets && view === "days" && (
            <div className={cn("flex flex-col gap-1.5 border-l pl-2", t.foot)}>
              {([
                [s.presets.today, today],
                [s.presets.tomorrow, addDays(today, 1)],
                [s.presets.thisWeek, addDays(today, 6 - ((today.getDay() + 6) % 7))],
                [s.presets.nextWeek, addDays(today, 7)],
                [s.presets.in30, addDays(today, 30)],
              ] as [string, Date][]).map(([label, d]) => (
                <button
                  key={label}
                  type="button"
                  disabled={isDisabled(d)}
                  onClick={() => applyPreset(d)}
                  className={cn("whitespace-nowrap border px-2.5 py-1.5 text-left text-[12px] disabled:opacity-40", t.preset)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

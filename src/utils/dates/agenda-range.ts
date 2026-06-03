export type AgendaViewMode = 'day' | 'week' | 'month';

export interface AgendaRangeDay {
  date: Date;
  isoDate: string;
  weekdayLabel: string;
  dayLabel: string;
  isToday: boolean;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDateParts(isoDate: string): Date | null {
  const trimmed = isoDate.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = parts;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return normalizeDate(parsed);
}

function getStartOfWeek(referenceDate: Date): Date {
  const normalized = normalizeDate(referenceDate);
  const dayOfWeek = normalized.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(normalized, diffToMonday);
}

function getStartOfMonth(referenceDate: Date): Date {
  const normalized = normalizeDate(referenceDate);
  return new Date(normalized.getFullYear(), normalized.getMonth(), 1);
}

function getDaysInMonth(referenceDate: Date): number {
  const normalized = normalizeDate(referenceDate);
  return new Date(normalized.getFullYear(), normalized.getMonth() + 1, 0).getDate();
}

function toAgendaRangeDay(date: Date, todayIsoDate: string): AgendaRangeDay {
  const normalized = normalizeDate(date);
  const isoDate = formatIsoDate(normalized);

  return {
    date: normalized,
    isoDate,
    weekdayLabel: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(normalized).replace('.', ''),
    dayLabel: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(normalized),
    isToday: isoDate === todayIsoDate,
  };
}

export function getReferenceDate(isoDate?: string | null): Date {
  if (typeof isoDate !== 'string') {
    return normalizeDate(new Date());
  }

  const parsed = parseIsoDateParts(isoDate);
  return parsed ?? normalizeDate(new Date());
}

export function toIsoDate(date: Date): string {
  return formatIsoDate(normalizeDate(date));
}

export function buildAgendaRange(referenceDate: Date, mode: AgendaViewMode): AgendaRangeDay[] {
  const todayIsoDate = formatIsoDate(normalizeDate(new Date()));
  if (mode === 'day') {
    return [toAgendaRangeDay(referenceDate, todayIsoDate)];
  }

  if (mode === 'month') {
    const start = getStartOfMonth(referenceDate);
    const totalDays = getDaysInMonth(referenceDate);
    return Array.from({ length: totalDays }, (_, index) => toAgendaRangeDay(addDays(start, index), todayIsoDate));
  }

  const start = getStartOfWeek(referenceDate);
  return Array.from({ length: 7 }, (_, index) => toAgendaRangeDay(addDays(start, index), todayIsoDate));
}

export function getAgendaInterval(referenceDate: Date, mode: AgendaViewMode): { start: Date; end: Date } {
  if (mode === 'day') {
    const start = normalizeDate(referenceDate);
    return {
      start,
      end: addDays(start, 1),
    };
  }

  if (mode === 'month') {
    const start = getStartOfMonth(referenceDate);
    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
    };
  }

  const start = getStartOfWeek(referenceDate);
  return {
    start,
    end: addDays(start, 7),
  };
}

export function isIsoDateWithinAgendaRange(isoDate: string, referenceDate: Date, mode: AgendaViewMode): boolean {
  const target = parseIsoDateParts(isoDate);
  if (!target) {
    return false;
  }

  if (mode === 'day') {
    return formatIsoDate(target) === formatIsoDate(normalizeDate(referenceDate));
  }

  if (mode === 'month') {
    const start = getStartOfMonth(referenceDate);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return target.getTime() >= start.getTime() && target.getTime() < end.getTime();
  }

  const start = getStartOfWeek(referenceDate);
  const end = addDays(start, 6);
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
}

export function getAgendaPeriodLabel(referenceDate: Date, mode: AgendaViewMode): string {
  if (mode === 'day') {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(referenceDate);
  }

  if (mode === 'month') {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(referenceDate);
  }

  const range = buildAgendaRange(referenceDate, 'week');
  const firstDay = range[0];
  const lastDay = range[range.length - 1];
  if (!firstDay || !lastDay) {
    return '';
  }

  const firstLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(firstDay.date);
  const lastLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(lastDay.date);
  return `${firstLabel} a ${lastLabel}`;
}

import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Appointment } from '@/schemas/appointments/appointment.schema';
import type { Command, CommandPaymentMethod } from '@/schemas/commands/command.schema';
import { listAppointments } from '@/services/appointments';
import { listClosedCommandsByPeriod } from '@/services/commands/commandsService';
import { listUsers, type UserProfile } from '@/services/users/userService';

export const DEFAULT_PROFESSIONAL_PAYOUT_RATE = 0.6;

type PaymentBreakdownMethod = CommandPaymentMethod | 'unknown';

export type FinancialSummaryGranularity = 'day' | 'week' | 'month';

export interface FinancialDateRange {
  start: Date;
  end: Date;
}

export interface FinancialPaymentBreakdownItem {
  method: PaymentBreakdownMethod;
  label: string;
  amount: number;
  count: number;
}

export interface FinancialSummaryTotals {
  grossRevenue: number;
  salonRevenue: number;
  professionalPayout: number;
  closedCommandsCount: number;
  appointmentsCount: number;
  completedAppointmentsCount: number;
  averageTicket: number;
  paymentBreakdown: FinancialPaymentBreakdownItem[];
}

export interface ProfessionalFinancialSummary extends FinancialSummaryTotals {
  professionalId: string;
  professionalName: string;
  professionalEmail: string | null;
  googleCalendarConnected: boolean;
  latestClosedAt: Date | null;
}

export interface FinancialTimelinePoint extends FinancialSummaryTotals {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export interface SalonFinancialSummary {
  range: FinancialDateRange;
  granularity: FinancialSummaryGranularity;
  split: {
    professionalPayoutRate: number;
    salonShareRate: number;
    professionalPayoutPercentage: number;
    salonSharePercentage: number;
  };
  totals: FinancialSummaryTotals & {
    professionalsCount: number;
    activeProfessionalsCount: number;
  };
  professionals: ProfessionalFinancialSummary[];
  timeline: FinancialTimelinePoint[];
  generatedAt: Date;
}

export interface BuildSalonFinancialSummaryParams {
  range: FinancialDateRange;
  commands: Command[];
  appointments: Appointment[];
  professionals: UserProfile[];
  professionalIds?: string[];
  professionalPayoutRate?: number;
  granularity?: FinancialSummaryGranularity;
  includeZeroRevenueProfessionals?: boolean;
}

export interface GetSalonFinancialSummaryParams {
  salonId: string;
  range: FinancialDateRange;
  professionalIds?: string[];
  professionalPayoutRate?: number;
  granularity?: FinancialSummaryGranularity;
  includeZeroRevenueProfessionals?: boolean;
  commandsLimitCount?: number;
  appointmentsLimitCount?: number;
  professionalsLimitCount?: number;
}

interface FinancialAccumulator {
  grossRevenue: number;
  salonRevenue: number;
  professionalPayout: number;
  closedCommandsCount: number;
  appointmentsCount: number;
  completedAppointmentsCount: number;
  paymentBreakdown: Record<PaymentBreakdownMethod, { amount: number; count: number }>;
}

interface RevenueSplit {
  salonRevenue: number;
  professionalPayout: number;
}

interface ProfessionalDescriptor {
  professionalId: string;
  professionalName: string;
  professionalEmail: string | null;
  googleCalendarConnected: boolean;
}

const PAYMENT_BREAKDOWN_ORDER: PaymentBreakdownMethod[] = [
  'cash',
  'pix',
  'credit',
  'debit',
  'unknown',
];

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateFinancialDateRange(range: FinancialDateRange): FinancialDateRange {
  if (range.end <= range.start) {
    throw new Error('Intervalo financeiro inválido.');
  }

  return range;
}

function normalizeProfessionalPayoutRate(value: number | undefined): number {
  const rate = value ?? DEFAULT_PROFESSIONAL_PAYOUT_RATE;

  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error('Percentual de repasse inválido.');
  }

  return rate;
}

function normalizeProfessionalIds(professionalIds: string[] | undefined): string[] | null {
  if (!professionalIds?.length) {
    return null;
  }

  const normalized = Array.from(
    new Set(professionalIds.map((professionalId) => professionalId.trim()).filter(Boolean)),
  );

  return normalized.length > 0 ? normalized : null;
}

function buildEmptyPaymentBreakdown(): FinancialAccumulator['paymentBreakdown'] {
  return {
    cash: { amount: 0, count: 0 },
    pix: { amount: 0, count: 0 },
    credit: { amount: 0, count: 0 },
    debit: { amount: 0, count: 0 },
    unknown: { amount: 0, count: 0 },
  };
}

function createAccumulator(): FinancialAccumulator {
  return {
    grossRevenue: 0,
    salonRevenue: 0,
    professionalPayout: 0,
    closedCommandsCount: 0,
    appointmentsCount: 0,
    completedAppointmentsCount: 0,
    paymentBreakdown: buildEmptyPaymentBreakdown(),
  };
}

function createDescriptorMap(professionals: UserProfile[]): Map<string, ProfessionalDescriptor> {
  const entries = new Map<string, ProfessionalDescriptor>();

  for (const professional of professionals) {
    entries.set(professional.uid, {
      professionalId: professional.uid,
      professionalName: professional.displayName,
      professionalEmail: professional.email,
      googleCalendarConnected: professional.googleCalendarConnected,
    });
  }

  return entries;
}

function resolveProfessionalDescriptor(
  descriptorMap: Map<string, ProfessionalDescriptor>,
  professionalId: string,
): ProfessionalDescriptor {
  const descriptor = descriptorMap.get(professionalId);
  if (descriptor) {
    return descriptor;
  }

  return {
    professionalId,
    professionalName: 'Profissional sem cadastro',
    professionalEmail: null,
    googleCalendarConnected: false,
  };
}

function resolveCommandClosedAt(command: Command): Date | null {
  return command.closedAt ?? command.updatedAt ?? command.createdAt;
}

function isWithinDateRange(value: Date | null, range: FinancialDateRange): boolean {
  if (!value) {
    return false;
  }

  return value >= range.start && value < range.end;
}

function resolveGranularity(range: FinancialDateRange, granularity: FinancialSummaryGranularity | undefined) {
  if (granularity) {
    return granularity;
  }

  const totalDays = Math.ceil((range.end.getTime() - range.start.getTime()) / 86_400_000);
  if (totalDays <= 31) {
    return 'day' as const;
  }

  if (totalDays <= 120) {
    return 'week' as const;
  }

  return 'month' as const;
}

function startOfGranularity(date: Date, granularity: FinancialSummaryGranularity): Date {
  if (granularity === 'day') {
    return startOfDay(date);
  }

  if (granularity === 'week') {
    return startOfWeek(date, { weekStartsOn: 1 });
  }

  return startOfMonth(date);
}

function addGranularity(date: Date, granularity: FinancialSummaryGranularity): Date {
  if (granularity === 'day') {
    return addDays(date, 1);
  }

  if (granularity === 'week') {
    return addWeeks(date, 1);
  }

  return addMonths(date, 1);
}

function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  if (date < minDate) {
    return minDate;
  }

  if (date > maxDate) {
    return maxDate;
  }

  return date;
}

function formatTimelineLabel(
  start: Date,
  end: Date,
  granularity: FinancialSummaryGranularity,
): string {
  const visibleEnd = new Date(end.getTime() - 1);

  if (granularity === 'day') {
    return format(start, 'dd/MM', { locale: ptBR });
  }

  if (granularity === 'week') {
    return `${format(start, 'dd/MM', { locale: ptBR })} - ${format(visibleEnd, 'dd/MM', {
      locale: ptBR,
    })}`;
  }

  return format(start, 'MMM/yy', { locale: ptBR });
}

function listTimelineBuckets(
  range: FinancialDateRange,
  granularity: FinancialSummaryGranularity,
): { key: string; label: string; start: Date; end: Date }[] {
  const buckets: { key: string; label: string; start: Date; end: Date }[] = [];

  let cursor = startOfGranularity(range.start, granularity);
  while (cursor < range.end) {
    const nextCursor = addGranularity(cursor, granularity);
    const bucketStart = clampDate(cursor, range.start, range.end);
    const bucketEnd = clampDate(nextCursor, range.start, range.end);

    if (bucketEnd > bucketStart) {
      buckets.push({
        key: `${granularity}:${cursor.toISOString()}`,
        label: formatTimelineLabel(bucketStart, bucketEnd, granularity),
        start: bucketStart,
        end: bucketEnd,
      });
    }

    cursor = nextCursor;
  }

  return buckets;
}

function resolvePaymentMethodLabel(method: PaymentBreakdownMethod): string {
  if (method === 'cash') {
    return 'Dinheiro';
  }

  if (method === 'pix') {
    return 'Pix';
  }

  if (method === 'credit') {
    return 'Cartão de crédito';
  }

  if (method === 'debit') {
    return 'Cartão de débito';
  }

  return 'Não informado';
}

function materializePaymentBreakdown(
  paymentBreakdown: FinancialAccumulator['paymentBreakdown'],
): FinancialPaymentBreakdownItem[] {
  return PAYMENT_BREAKDOWN_ORDER.map((method) => ({
    method,
    label: resolvePaymentMethodLabel(method),
    amount: roundCurrency(paymentBreakdown[method].amount),
    count: paymentBreakdown[method].count,
  }));
}

function accumulatePaymentMethod(
  accumulator: FinancialAccumulator,
  amount: number,
  method: CommandPaymentMethod | null,
): void {
  const key = method ?? 'unknown';
  accumulator.paymentBreakdown[key].amount = roundCurrency(
    accumulator.paymentBreakdown[key].amount + amount,
  );
  accumulator.paymentBreakdown[key].count += 1;
}

function splitRevenue(amount: number, professionalPayoutRate: number): RevenueSplit {
  const professionalPayout = roundCurrency(amount * professionalPayoutRate);
  return {
    professionalPayout,
    salonRevenue: roundCurrency(amount - professionalPayout),
  };
}

function toFinancialSummaryTotals(accumulator: FinancialAccumulator): FinancialSummaryTotals {
  return {
    grossRevenue: roundCurrency(accumulator.grossRevenue),
    salonRevenue: roundCurrency(accumulator.salonRevenue),
    professionalPayout: roundCurrency(accumulator.professionalPayout),
    closedCommandsCount: accumulator.closedCommandsCount,
    appointmentsCount: accumulator.appointmentsCount,
    completedAppointmentsCount: accumulator.completedAppointmentsCount,
    averageTicket:
      accumulator.closedCommandsCount > 0
        ? roundCurrency(accumulator.grossRevenue / accumulator.closedCommandsCount)
        : 0,
    paymentBreakdown: materializePaymentBreakdown(accumulator.paymentBreakdown),
  };
}

export function buildSalonFinancialSummary(
  params: BuildSalonFinancialSummaryParams,
): SalonFinancialSummary {
  const range = validateFinancialDateRange(params.range);
  const professionalPayoutRate = normalizeProfessionalPayoutRate(params.professionalPayoutRate);
  const salonShareRate = roundCurrency(1 - professionalPayoutRate);
  const granularity = resolveGranularity(range, params.granularity);
  const scopedProfessionalIds = normalizeProfessionalIds(params.professionalIds);
  const allowedProfessionalIds = scopedProfessionalIds ? new Set(scopedProfessionalIds) : null;
  const descriptorMap = createDescriptorMap(params.professionals);

  const filteredCommands = params.commands.filter((command) => {
    if (command.status !== 'closed') {
      return false;
    }

    if (allowedProfessionalIds && !allowedProfessionalIds.has(command.manicureId)) {
      return false;
    }

    return isWithinDateRange(resolveCommandClosedAt(command), range);
  });

  const filteredAppointments = params.appointments.filter((appointment) => {
    if (allowedProfessionalIds && !allowedProfessionalIds.has(appointment.manicureId)) {
      return false;
    }

    return isWithinDateRange(appointment.startTime, range);
  });

  const overallAccumulator = createAccumulator();
  const professionalAccumulators = new Map<string, FinancialAccumulator>();
  const latestClosedAtByProfessional = new Map<string, Date | null>();

  const getProfessionalAccumulator = (professionalId: string) => {
    const existing = professionalAccumulators.get(professionalId);
    if (existing) {
      return existing;
    }

    const created = createAccumulator();
    professionalAccumulators.set(professionalId, created);
    return created;
  };

  for (const command of filteredCommands) {
    const currentClosedAt = resolveCommandClosedAt(command);
    const accumulator = getProfessionalAccumulator(command.manicureId);
    const currentSplit = splitRevenue(command.total, professionalPayoutRate);

    overallAccumulator.grossRevenue = roundCurrency(overallAccumulator.grossRevenue + command.total);
    overallAccumulator.salonRevenue = roundCurrency(
      overallAccumulator.salonRevenue + currentSplit.salonRevenue,
    );
    overallAccumulator.professionalPayout = roundCurrency(
      overallAccumulator.professionalPayout + currentSplit.professionalPayout,
    );
    overallAccumulator.closedCommandsCount += 1;
    accumulatePaymentMethod(overallAccumulator, command.total, command.paymentMethod);

    accumulator.grossRevenue = roundCurrency(accumulator.grossRevenue + command.total);
    accumulator.salonRevenue = roundCurrency(accumulator.salonRevenue + currentSplit.salonRevenue);
    accumulator.professionalPayout = roundCurrency(
      accumulator.professionalPayout + currentSplit.professionalPayout,
    );
    accumulator.closedCommandsCount += 1;
    accumulatePaymentMethod(accumulator, command.total, command.paymentMethod);

    const previousClosedAt = latestClosedAtByProfessional.get(command.manicureId) ?? null;
    if (!previousClosedAt || (currentClosedAt && currentClosedAt > previousClosedAt)) {
      latestClosedAtByProfessional.set(command.manicureId, currentClosedAt);
    }
  }

  for (const appointment of filteredAppointments) {
    if (appointment.status === 'cancelled') {
      continue;
    }

    overallAccumulator.appointmentsCount += 1;
    if (appointment.status === 'completed') {
      overallAccumulator.completedAppointmentsCount += 1;
    }

    const accumulator = getProfessionalAccumulator(appointment.manicureId);
    accumulator.appointmentsCount += 1;
    if (appointment.status === 'completed') {
      accumulator.completedAppointmentsCount += 1;
    }
  }

  const professionalIds = new Set<string>();
  if (allowedProfessionalIds) {
    for (const professionalId of allowedProfessionalIds) {
      professionalIds.add(professionalId);
    }
  } else {
    for (const professional of params.professionals) {
      professionalIds.add(professional.uid);
    }

    for (const command of filteredCommands) {
      professionalIds.add(command.manicureId);
    }

    for (const appointment of filteredAppointments) {
      professionalIds.add(appointment.manicureId);
    }
  }

  const professionals = Array.from(professionalIds)
    .map((professionalId) => {
      const descriptor = resolveProfessionalDescriptor(descriptorMap, professionalId);
      const accumulator = professionalAccumulators.get(professionalId) ?? createAccumulator();

      return {
        professionalId,
        professionalName: descriptor.professionalName,
        professionalEmail: descriptor.professionalEmail,
        googleCalendarConnected: descriptor.googleCalendarConnected,
        latestClosedAt: latestClosedAtByProfessional.get(professionalId) ?? null,
        ...toFinancialSummaryTotals(accumulator),
      } satisfies ProfessionalFinancialSummary;
    })
    .filter((professional) => {
      if (params.includeZeroRevenueProfessionals !== false) {
        return true;
      }

      return professional.grossRevenue > 0 || professional.appointmentsCount > 0;
    })
    .sort((left, right) => {
      if (right.grossRevenue !== left.grossRevenue) {
        return right.grossRevenue - left.grossRevenue;
      }

      return left.professionalName.localeCompare(right.professionalName, 'pt-BR');
    });

  const timeline = listTimelineBuckets(range, granularity).map((bucket) => {
    const bucketAccumulator = createAccumulator();

    for (const command of filteredCommands) {
      const currentClosedAt = resolveCommandClosedAt(command);
      if (!isWithinDateRange(currentClosedAt, bucket)) {
        continue;
      }

      const currentSplit = splitRevenue(command.total, professionalPayoutRate);
      bucketAccumulator.grossRevenue = roundCurrency(bucketAccumulator.grossRevenue + command.total);
      bucketAccumulator.salonRevenue = roundCurrency(
        bucketAccumulator.salonRevenue + currentSplit.salonRevenue,
      );
      bucketAccumulator.professionalPayout = roundCurrency(
        bucketAccumulator.professionalPayout + currentSplit.professionalPayout,
      );
      bucketAccumulator.closedCommandsCount += 1;
      accumulatePaymentMethod(bucketAccumulator, command.total, command.paymentMethod);
    }

    for (const appointment of filteredAppointments) {
      if (appointment.status === 'cancelled') {
        continue;
      }

      if (!isWithinDateRange(appointment.startTime, bucket)) {
        continue;
      }

      bucketAccumulator.appointmentsCount += 1;
      if (appointment.status === 'completed') {
        bucketAccumulator.completedAppointmentsCount += 1;
      }
    }

    return {
      key: bucket.key,
      label: bucket.label,
      start: bucket.start,
      end: bucket.end,
      ...toFinancialSummaryTotals(bucketAccumulator),
    } satisfies FinancialTimelinePoint;
  });

  const activeProfessionalsCount = professionals.filter(
    (professional) => professional.grossRevenue > 0 || professional.appointmentsCount > 0,
  ).length;

  return {
    range,
    granularity,
    split: {
      professionalPayoutRate,
      salonShareRate,
      professionalPayoutPercentage: roundCurrency(professionalPayoutRate * 100),
      salonSharePercentage: roundCurrency(salonShareRate * 100),
    },
    totals: {
      professionalsCount: professionals.length,
      activeProfessionalsCount,
      ...toFinancialSummaryTotals(overallAccumulator),
    },
    professionals,
    timeline,
    generatedAt: new Date(),
  };
}

export async function getSalonFinancialSummary(
  params: GetSalonFinancialSummaryParams,
): Promise<SalonFinancialSummary> {
  const range = validateFinancialDateRange(params.range);
  const normalizedProfessionalIds = normalizeProfessionalIds(params.professionalIds);
  const scopedManicureId =
    normalizedProfessionalIds && normalizedProfessionalIds.length === 1
      ? normalizedProfessionalIds[0]
      : undefined;

  const [commands, appointments, professionals] = await Promise.all([
    listClosedCommandsByPeriod({
      salonId: params.salonId,
      start: range.start,
      end: range.end,
      manicureId: scopedManicureId,
      limitCount: params.commandsLimitCount ?? 1000,
    }),
    listAppointments({
      salonId: params.salonId,
      start: range.start,
      end: range.end,
      manicureId: scopedManicureId,
      limitCount: params.appointmentsLimitCount ?? 1000,
    }),
    listUsers({
      salonId: params.salonId,
      roles: ['nail_technician'],
      limitCount: params.professionalsLimitCount ?? 300,
    }),
  ]);

  return buildSalonFinancialSummary({
    range,
    commands,
    appointments,
    professionals,
    professionalIds: normalizedProfessionalIds ?? undefined,
    professionalPayoutRate: params.professionalPayoutRate,
    granularity: params.granularity,
    includeZeroRevenueProfessionals: params.includeZeroRevenueProfessionals,
  });
}

export function selectProfessionalFinancialSummary(
  summary: SalonFinancialSummary | undefined,
  professionalId: string | undefined,
): ProfessionalFinancialSummary | null {
  const parsedProfessionalId = professionalId?.trim() ?? '';
  if (!summary || !parsedProfessionalId) {
    return null;
  }

  return summary.professionals.find((professional) => professional.professionalId === parsedProfessionalId) ?? null;
}

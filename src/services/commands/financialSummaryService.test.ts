import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/schemas/appointments/appointment.schema';
import type { Command } from '@/schemas/commands/command.schema';
import {
  buildSalonFinancialSummary,
  selectProfessionalFinancialSummary,
} from '@/services/commands/financialSummaryService';
import type { UserProfile } from '@/services/users/userService';

function atLocal(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
) {
  return new Date(year, month, day, hours, minutes, seconds);
}

const range = {
  start: atLocal(2026, 5, 1),
  end: atLocal(2026, 5, 8),
};

const professionals: UserProfile[] = [
  {
    uid: 'pro-1',
    email: 'carla@nailflow.test',
    displayName: 'Carla Mendes',
    role: 'nail_technician',
    salonId: 'salon-1',
    secondFactorRequired: false,
    phone: null,
    photoURL: null,
    googleCalendarConnected: true,
    createdAt: atLocal(2026, 4, 1, 10),
  },
  {
    uid: 'pro-2',
    email: 'bruna@nailflow.test',
    displayName: 'Bruna Silva',
    role: 'nail_technician',
    salonId: 'salon-1',
    secondFactorRequired: false,
    phone: null,
    photoURL: null,
    googleCalendarConnected: false,
    createdAt: atLocal(2026, 4, 1, 10),
  },
];

const commands: Command[] = [
  {
    id: 'command-1',
    salonId: 'salon-1',
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    manicureId: 'pro-1',
    items: [{ service: 'Blindagem', price: 120, quantity: 1 }],
    total: 120,
    paymentMethod: 'pix',
    status: 'closed',
    closedAt: atLocal(2026, 5, 2, 11),
    createdAt: atLocal(2026, 5, 2, 9),
    updatedAt: atLocal(2026, 5, 2, 11),
  },
  {
    id: 'command-2',
    salonId: 'salon-1',
    appointmentId: 'appointment-2',
    clientId: 'client-2',
    manicureId: 'pro-1',
    items: [{ service: 'Spa dos pes', price: 80, quantity: 1 }],
    total: 80,
    paymentMethod: 'cash',
    status: 'closed',
    closedAt: atLocal(2026, 5, 3, 14, 30),
    createdAt: atLocal(2026, 5, 3, 12),
    updatedAt: atLocal(2026, 5, 3, 14, 30),
  },
  {
    id: 'command-3',
    salonId: 'salon-1',
    appointmentId: 'appointment-3',
    clientId: 'client-3',
    manicureId: 'pro-2',
    items: [{ service: 'Esmaltacao', price: 100, quantity: 1 }],
    total: 100,
    paymentMethod: 'credit',
    status: 'closed',
    closedAt: atLocal(2026, 5, 5, 18),
    createdAt: atLocal(2026, 5, 5, 16),
    updatedAt: atLocal(2026, 5, 5, 18),
  },
  {
    id: 'command-4',
    salonId: 'salon-1',
    appointmentId: 'appointment-4',
    clientId: 'client-4',
    manicureId: 'pro-2',
    items: [{ service: 'Alongamento', price: 150, quantity: 1 }],
    total: 150,
    paymentMethod: 'debit',
    status: 'open',
    closedAt: null,
    createdAt: atLocal(2026, 5, 6, 10),
    updatedAt: atLocal(2026, 5, 6, 10),
  },
  {
    id: 'command-5',
    salonId: 'salon-1',
    appointmentId: 'appointment-5',
    clientId: 'client-5',
    manicureId: 'pro-2',
    items: [{ service: 'Banho de gel', price: 90, quantity: 1 }],
    total: 90,
    paymentMethod: 'cash',
    status: 'closed',
    closedAt: atLocal(2026, 4, 30, 10),
    createdAt: atLocal(2026, 4, 30, 8),
    updatedAt: atLocal(2026, 4, 30, 10),
  },
];

const appointments: Appointment[] = [
  {
    id: 'appointment-1',
    salonId: 'salon-1',
    manicureId: 'pro-1',
    clientId: 'client-1',
    status: 'completed',
    startTime: atLocal(2026, 5, 2, 10),
    endTime: atLocal(2026, 5, 2, 11),
    notes: '',
    priceCents: 12000,
    syncStatus: 'synced',
    syncUpdatedAt: atLocal(2026, 5, 2, 11),
    syncErrorMessage: undefined,
    googleEventId: undefined,
    createdAt: atLocal(2026, 5, 1, 8),
    updatedAt: atLocal(2026, 5, 2, 11),
  },
  {
    id: 'appointment-2',
    salonId: 'salon-1',
    manicureId: 'pro-1',
    clientId: 'client-2',
    status: 'confirmed',
    startTime: atLocal(2026, 5, 3, 13, 30),
    endTime: atLocal(2026, 5, 3, 14, 30),
    notes: '',
    priceCents: 8000,
    syncStatus: 'synced',
    syncUpdatedAt: atLocal(2026, 5, 3, 14, 30),
    syncErrorMessage: undefined,
    googleEventId: undefined,
    createdAt: atLocal(2026, 5, 1, 8),
    updatedAt: atLocal(2026, 5, 3, 14, 30),
  },
  {
    id: 'appointment-3',
    salonId: 'salon-1',
    manicureId: 'pro-2',
    clientId: 'client-3',
    status: 'completed',
    startTime: atLocal(2026, 5, 5, 17),
    endTime: atLocal(2026, 5, 5, 18),
    notes: '',
    priceCents: 10000,
    syncStatus: 'synced',
    syncUpdatedAt: atLocal(2026, 5, 5, 18),
    syncErrorMessage: undefined,
    googleEventId: undefined,
    createdAt: atLocal(2026, 5, 1, 8),
    updatedAt: atLocal(2026, 5, 5, 18),
  },
  {
    id: 'appointment-4',
    salonId: 'salon-1',
    manicureId: 'pro-2',
    clientId: 'client-4',
    status: 'cancelled',
    startTime: atLocal(2026, 5, 6, 10),
    endTime: atLocal(2026, 5, 6, 11),
    notes: '',
    priceCents: 15000,
    syncStatus: 'synced',
    syncUpdatedAt: atLocal(2026, 5, 6, 11),
    syncErrorMessage: undefined,
    googleEventId: undefined,
    createdAt: atLocal(2026, 5, 1, 8),
    updatedAt: atLocal(2026, 5, 6, 11),
  },
];

describe('financialSummaryService', () => {
  it('agrega faturamento do salao e detalha por profissional', () => {
    const summary = buildSalonFinancialSummary({
      range,
      commands,
      appointments,
      professionals,
      granularity: 'day',
    });

    expect(summary.totals.grossRevenue).toBe(300);
    expect(summary.totals.professionalPayout).toBe(180);
    expect(summary.totals.salonRevenue).toBe(120);
    expect(summary.totals.closedCommandsCount).toBe(3);
    expect(summary.totals.appointmentsCount).toBe(3);
    expect(summary.totals.completedAppointmentsCount).toBe(2);
    expect(summary.totals.averageTicket).toBe(100);
    expect(summary.totals.activeProfessionalsCount).toBe(2);
    expect(summary.totals.paymentBreakdown.find((item) => item.method === 'cash')).toMatchObject({
      amount: 80,
      count: 1,
    });

    expect(summary.professionals).toHaveLength(2);
    expect(summary.professionals[0]).toMatchObject({
      professionalId: 'pro-1',
      professionalName: 'Carla Mendes',
      grossRevenue: 200,
      professionalPayout: 120,
      salonRevenue: 80,
      closedCommandsCount: 2,
      appointmentsCount: 2,
      completedAppointmentsCount: 1,
      googleCalendarConnected: true,
    });
    expect(summary.professionals[1]).toMatchObject({
      professionalId: 'pro-2',
      grossRevenue: 100,
      professionalPayout: 60,
      salonRevenue: 40,
      closedCommandsCount: 1,
      appointmentsCount: 1,
      completedAppointmentsCount: 1,
    });

    expect(summary.timeline).toHaveLength(7);
    expect(summary.timeline.find((item) => item.label === '02/06')).toMatchObject({
      grossRevenue: 120,
      appointmentsCount: 1,
      completedAppointmentsCount: 1,
    });
  });

  it('permite filtrar o resumo para um unico profissional', () => {
    const summary = buildSalonFinancialSummary({
      range,
      commands,
      appointments,
      professionals,
      professionalIds: ['pro-2'],
      includeZeroRevenueProfessionals: false,
      granularity: 'week',
    });

    expect(summary.totals.grossRevenue).toBe(100);
    expect(summary.professionals).toHaveLength(1);
    expect(summary.professionals[0]?.professionalId).toBe('pro-2');
    expect(summary.timeline).toHaveLength(1);
    expect(summary.timeline[0]).toMatchObject({
      grossRevenue: 100,
      professionalPayout: 60,
      salonRevenue: 40,
    });
  });

  it('inclui placeholder quando ha comanda sem perfil carregado', () => {
    const baseCommand = commands[0]!;

    const summary = buildSalonFinancialSummary({
      range,
      commands: [
        {
          ...baseCommand,
          id: 'command-missing',
          manicureId: 'ghost-pro',
          total: 50,
          closedAt: atLocal(2026, 5, 7, 10),
          updatedAt: atLocal(2026, 5, 7, 10),
          createdAt: atLocal(2026, 5, 7, 9),
        },
      ],
      appointments: [],
      professionals: [],
      granularity: 'day',
      includeZeroRevenueProfessionals: false,
    });

    expect(summary.professionals).toHaveLength(1);
    expect(summary.professionals[0]).toMatchObject({
      professionalId: 'ghost-pro',
      professionalName: 'Profissional sem cadastro',
      grossRevenue: 50,
      professionalPayout: 30,
      salonRevenue: 20,
    });
  });

  it('seleciona resumo individual a partir do consolidado', () => {
    const summary = buildSalonFinancialSummary({
      range,
      commands,
      appointments,
      professionals,
      granularity: 'day',
    });

    expect(selectProfessionalFinancialSummary(summary, 'pro-1')).toMatchObject({
      professionalId: 'pro-1',
      grossRevenue: 200,
    });
    expect(selectProfessionalFinancialSummary(summary, 'inexistente')).toBeNull();
    expect(selectProfessionalFinancialSummary(undefined, 'pro-1')).toBeNull();
  });
});

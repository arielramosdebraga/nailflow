import { useMemo } from 'react';

import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useCommands } from '@/hooks/commands/useCommands';
import { useSessionStore } from '@/stores/sessionStore';

export type ReportPeriod = 'week' | 'month';

interface ReportMetric {
  label: string;
  value: string;
  helper: string;
}

interface StatusBreakdownItem {
  label: string;
  value: number;
}

export function useNailTechnicianReports(period: ReportPeriod) {
  const userId = useSessionStore((state) => state.userId);

  const interval = useMemo(() => {
    const now = new Date();

    if (period === 'month') {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'Este mês',
      };
    }

    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
      label: 'Esta semana',
    };
  }, [period]);

  const appointmentsQuery = useAppointments({
    start: interval.start,
    end: interval.end,
    manicureId: userId ?? undefined,
    limitCount: 300,
    enabled: Boolean(userId),
  });

  const commandsQuery = useCommands({
    status: 'closed',
    manicureId: userId ?? undefined,
    limitCount: 300,
    enabled: Boolean(userId),
  });

  const summary = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const closedCommands = (commandsQuery.data ?? []).filter((command) => {
      const referenceDate = command.closedAt ?? command.createdAt;
      if (!referenceDate) {
        return false;
      }

      return referenceDate >= interval.start && referenceDate <= interval.end;
    });

    const revenue = closedCommands.reduce((acc, command) => acc + command.total, 0);
    const completedAppointments = appointments.filter((appointment) => appointment.status === 'completed').length;
    const uniqueClients = new Set(appointments.map((appointment) => appointment.clientId)).size;
    const averageTicket = closedCommands.length > 0 ? revenue / closedCommands.length : 0;
    const completionRate = appointments.length > 0 ? Math.round((completedAppointments / appointments.length) * 100) : 0;

    const metrics: ReportMetric[] = [
      {
        label: 'Atendimentos',
        value: String(appointments.length),
        helper: interval.label,
      },
      {
        label: 'Concluídos',
        value: String(completedAppointments),
        helper: `${completionRate}% de conclusão`,
      },
      {
        label: 'Faturamento',
        value: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(revenue),
        helper: `${closedCommands.length} comandas fechadas`,
      },
      {
        label: 'Ticket médio',
        value: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(averageTicket),
        helper: `${uniqueClients} cliente(s) atendido(s)`,
      },
    ];

    const statusBreakdown: StatusBreakdownItem[] = [
      {
        label: 'Agendados',
        value: appointments.filter((appointment) => appointment.status === 'scheduled').length,
      },
      {
        label: 'Confirmados',
        value: appointments.filter((appointment) => appointment.status === 'confirmed').length,
      },
      {
        label: 'Concluídos',
        value: completedAppointments,
      },
      {
        label: 'Cancelados',
        value: appointments.filter((appointment) => appointment.status === 'cancelled').length,
      },
    ];

    const recentClosedCommands = [...closedCommands]
      .sort((left, right) => {
        const leftTime = (left.closedAt ?? left.createdAt)?.getTime() ?? 0;
        const rightTime = (right.closedAt ?? right.createdAt)?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, 3);

    return {
      metrics,
      statusBreakdown,
      recentClosedCommands,
    };
  }, [appointmentsQuery.data, commandsQuery.data, interval.end, interval.label, interval.start]);

  return {
    intervalLabel: interval.label,
    isLoading: appointmentsQuery.isLoading || commandsQuery.isLoading,
    error: appointmentsQuery.error ?? commandsQuery.error ?? null,
    ...summary,
  };
}

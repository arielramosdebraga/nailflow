import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  DEFAULT_PROFESSIONAL_PAYOUT_RATE,
  getSalonFinancialSummary,
  type FinancialSummaryGranularity,
} from '@/services/commands';
import { useSessionStore } from '@/stores/sessionStore';

export interface UseSalonFinancialSummaryOptions {
  start: Date;
  end: Date;
  professionalIds?: string[];
  professionalPayoutRate?: number;
  granularity?: FinancialSummaryGranularity;
  includeZeroRevenueProfessionals?: boolean;
  enabled?: boolean;
}

function normalizeProfessionalIds(professionalIds: string[] | undefined): string[] | undefined {
  if (!professionalIds?.length) {
    return undefined;
  }

  const normalized = Array.from(
    new Set(professionalIds.map((professionalId) => professionalId.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));

  return normalized.length > 0 ? normalized : undefined;
}

export function useSalonFinancialSummary(options: UseSalonFinancialSummaryOptions) {
  const sessionStatus = useSessionStore((state) => state.status);
  const salonId = useSessionStore((state) => state.salonId);
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);

  const scopedProfessionalIds = useMemo(() => {
    if (role === 'nail_technician') {
      return userId ? [userId] : undefined;
    }

    return normalizeProfessionalIds(options.professionalIds);
  }, [options.professionalIds, role, userId]);

  const professionalsKey = useMemo(
    () => (scopedProfessionalIds ? scopedProfessionalIds.join('|') : ''),
    [scopedProfessionalIds],
  );

  const shouldEnable = useMemo(() => {
    if (options.enabled === false) {
      return false;
    }

    if (sessionStatus !== 'authenticated') {
      return false;
    }

    if (!salonId) {
      return false;
    }

    if (role === 'nail_technician' && !userId) {
      return false;
    }

    return true;
  }, [options.enabled, role, salonId, sessionStatus, userId]);

  return useQuery({
    queryKey: [
      'commands',
      'financial-summary',
      salonId,
      options.start.toISOString(),
      options.end.toISOString(),
      options.granularity ?? 'auto',
      options.professionalPayoutRate ?? DEFAULT_PROFESSIONAL_PAYOUT_RATE,
      professionalsKey,
      options.includeZeroRevenueProfessionals ?? true,
    ],
    enabled: shouldEnable,
    queryFn: async () => {
      if (!salonId) {
        throw new Error('Salão atual não encontrado.');
      }

      return getSalonFinancialSummary({
        salonId,
        range: {
          start: options.start,
          end: options.end,
        },
        professionalIds: scopedProfessionalIds,
        professionalPayoutRate: options.professionalPayoutRate,
        granularity: options.granularity,
        includeZeroRevenueProfessionals: options.includeZeroRevenueProfessionals,
      });
    },
  });
}

import { useMemo } from 'react';

import { selectProfessionalFinancialSummary } from '@/services/commands';
import { useSessionStore } from '@/stores/sessionStore';

import {
  useSalonFinancialSummary,
  type UseSalonFinancialSummaryOptions,
} from '@/hooks/commands/useSalonFinancialSummary';

export interface UseProfessionalFinancialSummaryOptions
  extends Omit<UseSalonFinancialSummaryOptions, 'professionalIds'> {
  professionalId?: string;
}

export function useProfessionalFinancialSummary(
  options: UseProfessionalFinancialSummaryOptions,
) {
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);

  const resolvedProfessionalId = role === 'nail_technician' ? (userId ?? undefined) : options.professionalId;

  const summaryQuery = useSalonFinancialSummary({
    ...options,
    professionalIds: resolvedProfessionalId ? [resolvedProfessionalId] : undefined,
  });

  const data = useMemo(
    () => selectProfessionalFinancialSummary(summaryQuery.data, resolvedProfessionalId),
    [resolvedProfessionalId, summaryQuery.data],
  );

  return {
    ...summaryQuery,
    data,
    professionalId: resolvedProfessionalId,
  };
}

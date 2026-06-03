import { afterEach, describe, expect, it, vi } from 'vitest';

import { computeRetryDelayMs, normalizeErrorMessage } from './sync-queue';

describe('google sync queue helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes explicit error messages', () => {
    expect(normalizeErrorMessage(new Error('Falha especifica'))).toBe('Falha especifica');
  });

  it('falls back to a safe error message when input is empty', () => {
    expect(normalizeErrorMessage(new Error('   '))).toBe(
      'Falha ao processar tarefa da fila de sincronizacao Google.'
    );
    expect(normalizeErrorMessage(null)).toBe('Falha ao processar tarefa da fila de sincronizacao Google.');
  });

  it('keeps retry delay within expected jitter bounds on first attempt', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(computeRetryDelayMs(1)).toBe(1200);

    vi.spyOn(Math, 'random').mockReturnValue(1);
    expect(computeRetryDelayMs(1)).toBe(1800);
  });

  it('caps retry delay growth on later attempts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(computeRetryDelayMs(10)).toBe(30000);
  });
});

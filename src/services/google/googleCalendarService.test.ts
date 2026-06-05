import { describe, expect, it } from 'vitest';

import { deriveGoogleSyncIndicator } from '@/services/google/googleCalendarService';

describe('deriveGoogleSyncIndicator', () => {
  it('deve retornar error quando syncStatus for error', () => {
    expect(
      deriveGoogleSyncIndicator({
        connected: true,
        syncStatus: 'error',
      })
    ).toBe('error');
  });

  it('deve retornar connected quando conectado', () => {
    expect(
      deriveGoogleSyncIndicator({
        connected: true,
        syncStatus: 'pending',
      })
    ).toBe('connected');
  });

  it('deve retornar connected quando syncStatus for synced', () => {
    expect(
      deriveGoogleSyncIndicator({
        connected: false,
        syncStatus: 'synced',
      })
    ).toBe('connected');
  });

  it('deve retornar pending para status idle sem conexao', () => {
    expect(
      deriveGoogleSyncIndicator({
        connected: false,
        syncStatus: 'idle',
      })
    ).toBe('pending');
  });
});

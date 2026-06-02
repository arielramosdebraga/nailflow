import { describe, expect, it } from 'vitest';

import { assertCanReopenCommand, canReopenCommand } from '@/services/commands/commandsService';

describe('command reopen policy', () => {
  it('bloqueia reabertura de comanda fechada para nail_technician', () => {
    expect(
      canReopenCommand({
        currentStatus: 'closed',
        nextStatus: 'open',
        actorRole: 'nail_technician',
      }),
    ).toBe(false);
  });

  it('permite reabertura de comanda fechada para salon_owner', () => {
    expect(
      canReopenCommand({
        currentStatus: 'closed',
        nextStatus: 'open',
        actorRole: 'salon_owner',
      }),
    ).toBe(true);
  });

  it('permite reabertura de comanda fechada para super_admin', () => {
    expect(
      canReopenCommand({
        currentStatus: 'closed',
        nextStatus: 'open',
        actorRole: 'super_admin',
      }),
    ).toBe(true);
  });

  it('permite atualizacoes que nao sejam reabertura', () => {
    expect(
      canReopenCommand({
        currentStatus: 'open',
        nextStatus: 'closed',
        actorRole: 'nail_technician',
      }),
    ).toBe(true);
  });

  it('lanca erro quando perfil sem privilegio tenta reabrir', () => {
    expect(() =>
      assertCanReopenCommand({
        currentStatus: 'closed',
        nextStatus: 'open',
        actorRole: 'nail_technician',
      }),
    ).toThrow(/perfil/i);
  });
});

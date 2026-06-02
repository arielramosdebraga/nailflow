import { describe, expect, it } from 'vitest';

import { calculateCommandTotals } from '@/services/commands/command-totals';

describe('calculateCommandTotals', () => {
  it('deve calcular subtotal/total e total de itens', () => {
    const totals = calculateCommandTotals([
      { price: 89.9, quantity: 1 },
      { price: 35.5, quantity: 2 },
    ]);

    expect(totals).toEqual({
      subtotal: 160.9,
      total: 160.9,
      totalItems: 3,
    });
  });

  it('deve arredondar valores monetarios para duas casas', () => {
    const totals = calculateCommandTotals([
      { price: 19.995, quantity: 1 },
      { price: 2.335, quantity: 1 },
    ]);

    expect(totals).toEqual({
      subtotal: 22.34,
      total: 22.34,
      totalItems: 2,
    });
  });

  it('deve falhar quando nao houver itens', () => {
    expect(() => calculateCommandTotals([])).toThrowError(
      'A comanda precisa de ao menos um item para calcular total.'
    );
  });

  it('deve falhar para quantidade invalida', () => {
    expect(() => calculateCommandTotals([{ price: 10, quantity: 0 }])).toThrowError(
      'Quantidade invalida para calculo de comanda.'
    );
  });

  it('deve falhar para valor monetario invalido', () => {
    expect(() => calculateCommandTotals([{ price: -1, quantity: 1 }])).toThrowError(
      'Valor monetario invalido para calculo de comanda.'
    );
  });
});

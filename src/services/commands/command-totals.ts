import type { CommandItem } from '@/schemas/commands/command.schema';

export interface CommandTotals {
  subtotal: number;
  total: number;
  totalItems: number;
}

function roundToCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertMoney(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Valor monetario invalido para calculo de comanda.');
  }
}

function assertQuantity(value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Quantidade invalida para calculo de comanda.');
  }
}

export function calculateCommandTotals(
  items: readonly Pick<CommandItem, 'price' | 'quantity'>[]
): CommandTotals {
  if (!items.length) {
    throw new Error('A comanda precisa de ao menos um item para calcular total.');
  }

  let subtotal = 0;
  let totalItems = 0;

  for (const item of items) {
    assertMoney(item.price);
    assertQuantity(item.quantity);

    subtotal += roundToCurrency(item.price * item.quantity);
    totalItems += item.quantity;
  }

  const normalizedSubtotal = roundToCurrency(subtotal);

  return {
    subtotal: normalizedSubtotal,
    total: normalizedSubtotal,
    totalItems,
  };
}

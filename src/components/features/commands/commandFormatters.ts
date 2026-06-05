import { type CommandPaymentMethod, type CommandStatus } from '@/schemas/commands/command.schema';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(value);
}

export function formatCommandStatus(status: CommandStatus): string {
  if (status === 'closed') {
    return 'Fechada';
  }

  return 'Aberta';
}

export function formatCommandPaymentMethod(paymentMethod: CommandPaymentMethod | null): string {
  if (!paymentMethod) {
    return 'Nao informado';
  }

  if (paymentMethod === 'cash') {
    return 'Dinheiro';
  }

  if (paymentMethod === 'pix') {
    return 'Pix';
  }

  if (paymentMethod === 'credit') {
    return 'Cartao de credito';
  }

  return 'Cartao de debito';
}

export function formatDateTime(value: Date | null): string {
  if (!value) {
    return 'Nao informado';
  }

  return value.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(value: Date | null): string {
  if (!value) {
    return '--:--';
  }

  return value.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

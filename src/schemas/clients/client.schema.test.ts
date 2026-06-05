import { describe, expect, it } from 'vitest';

import { ClientFormSchema, mapClientFormToUpsertInput } from '@/schemas/clients/client-form.schema';
import { UpsertClientSchema } from '@/schemas/clients/client.schema';

describe('client schemas', () => {
  it('deve validar e transformar form em payload de upsert', () => {
    const parsedForm = ClientFormSchema.parse({
      name: '  Maria Clara  ',
      phone: ' 11999998888 ',
      email: '  MARIA@EMAIL.COM ',
      notes: ' Cliente VIP ',
      tags: 'vip, recorrente,  alergia',
    });

    const payload = mapClientFormToUpsertInput(parsedForm);

    expect(payload).toEqual({
      name: 'Maria Clara',
      phone: '11999998888',
      email: 'maria@email.com',
      notes: 'Cliente VIP',
      tags: ['vip', 'recorrente', 'alergia'],
      birthDate: null,
      lastVisit: null,
    });
  });

  it('deve converter e-mail vazio para null no schema de upsert', () => {
    const parsed = UpsertClientSchema.parse({
      salonId: 'salon-001',
      name: 'Cliente Teste',
      phone: '11999999999',
      email: '',
      notes: '',
      tags: [],
      birthDate: null,
      lastVisit: null,
    });

    expect(parsed.email).toBeNull();
  });
});

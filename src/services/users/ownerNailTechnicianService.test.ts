import { FirebaseError } from 'firebase/app';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const functionsMock = vi.hoisted(() => ({
  getFunctions: vi.fn(() => ({ id: 'functions-instance' })),
  httpsCallable: vi.fn(),
}));

const firebaseMock = vi.hoisted(() => ({
  assertFirebaseConfigured: vi.fn(),
  firebaseApp: { name: 'nailflow-app' },
}));

vi.mock('firebase/functions', () => functionsMock);
vi.mock('@/services/firebase', () => firebaseMock);

let createOwnerNailTechnician: typeof import('@/services/users/ownerNailTechnicianService').createOwnerNailTechnician;

describe('ownerNailTechnicianService', () => {
  beforeAll(async () => {
    const service = await import('@/services/users/ownerNailTechnicianService');
    createOwnerNailTechnician = service.createOwnerNailTechnician;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    functionsMock.getFunctions.mockReturnValue({ id: 'functions-instance' });
  });

  it('inicia o cadastro com a primeira callable compativel encontrada', async () => {
    functionsMock.httpsCallable.mockImplementation((_functions: unknown, name: string) => {
      if (name === 'createNailTechnician') {
        return vi.fn().mockResolvedValue({
          data: {
            uid: 'tech-123',
            salonId: 'salon-123',
            status: 'created',
            message: 'Conta criada com seguranca.',
          },
        });
      }

      return vi.fn().mockRejectedValue(new FirebaseError('functions/not-found', 'not found'));
    });

    await expect(
      createOwnerNailTechnician({
        displayName: 'Maria das Unhas',
        email: 'maria@nailflow.app',
        phone: '(11) 99999-0000',
      })
    ).resolves.toEqual({
      uid: 'tech-123',
      salonId: 'salon-123',
      status: 'created',
      message: 'Conta criada com seguranca.',
    });

    expect(functionsMock.getFunctions).toHaveBeenCalledWith(firebaseMock.firebaseApp, 'southamerica-east1');
    expect(functionsMock.httpsCallable).toHaveBeenCalledWith(
      { id: 'functions-instance' },
      'createNailTechnician'
    );
  });

  it('retorna mensagem clara quando nenhuma callable de cadastro seguro existe', async () => {
    functionsMock.httpsCallable.mockImplementation(() =>
      vi.fn().mockRejectedValue(new FirebaseError('functions/not-found', 'not found'))
    );

    await expect(
      createOwnerNailTechnician({
        displayName: 'Maria das Unhas',
        email: 'maria@nailflow.app',
        phone: null,
      })
    ).rejects.toThrow(
      'O backend seguro para cadastro de profissionais ainda nao esta disponivel nesta versao.'
    );
  });
});

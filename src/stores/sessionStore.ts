import { create } from 'zustand';

import type { UserRole } from '@/schemas/users/user.schema';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'pending_2fa';

interface SessionState {
  status: AuthStatus;
  userId: string | null;
  role: UserRole | null;
  salonId: string | null;
  secondFactorRequired: boolean;
  secondFactorVerified: boolean;
  lastActivityAt: number | null;
  setLoading: () => void;
  touchActivity: () => void;
  signIn: (params: {
    userId: string;
    role: UserRole;
    salonId: string | null;
    secondFactorRequired?: boolean;
  }) => void;
  completeSecondFactor: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'anonymous',
  userId: null,
  role: null,
  salonId: null,
  secondFactorRequired: false,
  secondFactorVerified: false,
  lastActivityAt: null,
  setLoading: () => {
    set({ status: 'loading' });
  },
  touchActivity: () => {
    set((state) => {
      if (!state.userId) {
        return state;
      }

      return {
        ...state,
        lastActivityAt: Date.now(),
      };
    });
  },
  signIn: ({ userId, role, salonId, secondFactorRequired: nextSecondFactorRequired }) => {
    set((state) => {
      const secondFactorRequired = Boolean(nextSecondFactorRequired);
      const secondFactorVerified =
        !secondFactorRequired || (state.userId === userId && state.secondFactorVerified);

      return {
        status: secondFactorRequired && !secondFactorVerified ? 'pending_2fa' : 'authenticated',
        userId,
        role,
        salonId,
        secondFactorRequired,
        secondFactorVerified,
        lastActivityAt: Date.now(),
      };
    });
  },
  completeSecondFactor: () => {
    set((state) => {
      if (!state.userId || !state.secondFactorRequired) {
        return state;
      }

      return {
        ...state,
        status: 'authenticated',
        secondFactorVerified: true,
        lastActivityAt: Date.now(),
      };
    });
  },
  signOut: () => {
    set({
      status: 'anonymous',
      userId: null,
      role: null,
      salonId: null,
      secondFactorRequired: false,
      secondFactorVerified: false,
      lastActivityAt: null,
    });
  },
}));

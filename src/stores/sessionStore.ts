import { create } from 'zustand';

import type { UserRole } from '@/schemas/users/user.schema';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'pending_2fa';

function shouldRequireSecondFactor(role: UserRole): boolean {
  return role === 'super_admin' || role === 'salon_owner';
}

interface SessionState {
  status: AuthStatus;
  userId: string | null;
  role: UserRole | null;
  salonId: string | null;
  secondFactorRequired: boolean;
  secondFactorVerified: boolean;
  setLoading: () => void;
  signIn: (params: { userId: string; role: UserRole; salonId: string | null }) => void;
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
  setLoading: () => {
    set({ status: 'loading' });
  },
  signIn: ({ userId, role, salonId }) => {
    set((state) => {
      const secondFactorRequired = shouldRequireSecondFactor(role);
      const secondFactorVerified =
        !secondFactorRequired || (state.userId === userId && state.secondFactorVerified);

      return {
        status: secondFactorRequired && !secondFactorVerified ? 'pending_2fa' : 'authenticated',
        userId,
        role,
        salonId,
        secondFactorRequired,
        secondFactorVerified,
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
    });
  },
}));

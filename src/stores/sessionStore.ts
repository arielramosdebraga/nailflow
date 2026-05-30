import { create } from 'zustand';

import type { UserRole } from '@/schemas/users/user.schema';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  status: AuthStatus;
  userId: string | null;
  role: UserRole | null;
  salonId: string | null;
  setLoading: () => void;
  signIn: (params: { userId: string; role: UserRole; salonId: string | null }) => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'anonymous',
  userId: null,
  role: null,
  salonId: null,
  setLoading: () => {
    set({ status: 'loading' });
  },
  signIn: ({ userId, role, salonId }) => {
    set({
      status: 'authenticated',
      userId,
      role,
      salonId,
    });
  },
  signOut: () => {
    set({
      status: 'anonymous',
      userId: null,
      role: null,
      salonId: null,
    });
  },
}));

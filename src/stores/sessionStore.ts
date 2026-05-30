import { create } from 'zustand';

import type { UserRole } from '@/schemas/users/user.schema';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  status: AuthStatus;
  userId: string | null;
  role: UserRole | null;
  setLoading: () => void;
  signIn: (params: { userId: string; role: UserRole }) => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'anonymous',
  userId: null,
  role: null,
  setLoading: () => {
    set({ status: 'loading' });
  },
  signIn: ({ userId, role }) => {
    set({
      status: 'authenticated',
      userId,
      role,
    });
  },
  signOut: () => {
    set({
      status: 'anonymous',
      userId: null,
      role: null,
    });
  },
}));

import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  avatar?: string | null
  isActive?: boolean
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isRestoring: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
  logout: () => Promise<void>
  restoreAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isRestoring: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearUser: () => set({ user: null, isAuthenticated: false }),

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    set({ user: null, isAuthenticated: false, isLoading: false, isRestoring: false })
  },

  restoreAuth: async () => {
    try {
      const res: any = await apiFetch('/api/auth/me')
      if (res?.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false, isRestoring: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, isRestoring: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, isRestoring: false })
    }
  },
}))

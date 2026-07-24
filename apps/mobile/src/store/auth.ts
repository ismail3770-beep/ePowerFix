import * as SecureStore from 'expo-secure-store';
import create from 'zustand';
import { authApi, setApiToken } from '@epowerfix/api-client';

const TOKEN_KEY = 'epowerfix.mobile.session.token';
const TOKEN_EXPIRY_KEY = 'epowerfix.mobile.session.expiry';

// Session timeout: 7 days (match API JWT expiry)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  name: string;
  nameBn?: string | null;
  email: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

type ProfileUpdate = Partial<Pick<
  AuthUser,
  'name' | 'nameBn' | 'phone' | 'avatar' | 'email' | 'address' | 'area' | 'city' | 'postalCode'
>> & {
  currentPassword?: string;
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    name: string;
    nameBn?: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<AuthUser>;
  updateProfile: (data: ProfileUpdate) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthUser>;
  return Boolean(
    typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.email === 'string'
  );
}

async function removeStoredToken(): Promise<void> {
  setApiToken(null);
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  } catch {
    // A failed local cleanup should not leave the in-memory session active.
  }
}

async function isTokenExpired(): Promise<boolean> {
  try {
    const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiry) return false;
    return Date.now() > Number(expiry);
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  loading: false,
  error: null,

  hydrate: async () => {
    if (get().hydrated || get().loading) return;

    set({ loading: true, error: null });
    try {
      // Check if token has expired locally
      if (await isTokenExpired()) {
        await removeStoredToken();
        set({ user: null, token: null });
        return;
      }

      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ user: null, token: null });
        return;
      }

      setApiToken(token);
      const response = await authApi.me();
      if (!isAuthUser(response.data)) {
        throw new Error('Invalid session response');
      }

      set({ user: response.data, token });
    } catch {
      await removeStoredToken();
      set({ user: null, token: null });
    } finally {
      set({ hydrated: true, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.login(email.trim().toLowerCase(), password);
      const token = response.data?.token;
      const user = response.data?.user;

      if (!token || !isAuthUser(user)) {
        throw new Error('The server did not return a valid session.');
      }

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
      setApiToken(token);
      set({ user, token, hydrated: true, error: null });
      return user;
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      await authApi.register({
        ...data,
        name: data.name.trim(),
        nameBn: data.nameBn?.trim() || undefined,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
      });

      // The API intentionally returns a safe user but no token on registration.
      // Sign in immediately so the mobile session is ready for the user.
      return await get().login(data.email, data.password);
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.updateProfile(data);
      if (!isAuthUser(response.data)) {
        throw new Error('The server did not return the updated profile.');
      }
      set({ user: response.data, error: null });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to update profile');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      await authApi.changePassword(currentPassword, newPassword);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to change password');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await authApi.logout();
    } catch {
      // The local session must still be cleared if the network is unavailable.
    } finally {
      await removeStoredToken();
      set({ user: null, token: null, hydrated: true, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

export type User = { id: number; name: string; email: string; phone?: string; role: 'USER' | 'ADMIN' | 'CAB_DRIVER'; verified: boolean; enabled?: boolean };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function readUser() {
  const raw = localStorage.getItem('cabxpress_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem('cabxpress_user');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem('cabxpress_token'));
  const [user, setUser] = useState<User | null>(readUser);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem('cabxpress_token');
    localStorage.removeItem('cabxpress_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('cabxpress_token');
    if (!currentToken) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('cabxpress_user', JSON.stringify(data));
      setToken(currentToken);
      setUser(data);
      return data as User;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cabxpress_token', data.token);
    localStorage.setItem('cabxpress_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user as User;
  }

  useEffect(() => {
    refreshUser();
    window.addEventListener('cabxpress:unauthorized', logout);
    return () => window.removeEventListener('cabxpress:unauthorized', logout);
  }, [refreshUser, logout]);

  const value = useMemo(() => ({ user, token, loading, login, refreshUser, logout }), [user, token, loading, refreshUser, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

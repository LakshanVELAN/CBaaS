import { createContext, useContext, useState, useCallback } from 'react';
import type { SuperAdminUser } from '../api';
import * as api from '../api';

interface SuperAdminAuthState {
  user: SuperAdminUser | null;
  loading: boolean;
  error: string | null;
}

interface SuperAdminAuthContextType extends SuperAdminAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | null>(null);

export function SuperAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SuperAdminAuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.superAdminLogin(email, password);
      setState({ user: res.user, loading: false, error: null });
    } catch (err: any) {
      setState({ user: null, loading: false, error: err.message });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearSuperAdminTokens();
    setState({ user: null, loading: false, error: null });
  }, []);

  return (
    <SuperAdminAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) throw new Error('useSuperAdminAuth must be inside SuperAdminAuthProvider');
  return ctx;
}

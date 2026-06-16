import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TenantProfile } from './api';
import * as api from './api';

interface AuthState {
  tenant: TenantProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ raw_key: string } | void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    tenant: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setState({ tenant: null, loading: false, error: null });
      return;
    }
    try {
      const tenant = await api.getProfile();
      setState({ tenant, loading: false, error: null });
    } catch {
      api.clearTokens();
      setState({ tenant: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.login({ email, password });
      setState({ tenant: res.tenant, loading: false, error: null });
    } catch (err: any) {
      setState({ tenant: null, loading: false, error: err.message });
      throw err;
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.register({ name, email, password });
        setState({ tenant: res.tenant, loading: false, error: null });
        return { raw_key: res.api_key.raw_key };
      } catch (err: any) {
        setState({ tenant: null, loading: false, error: err.message });
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    api.clearTokens();
    setState({ tenant: null, loading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

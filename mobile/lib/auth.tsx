import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSession, login as apiLogin, logout as apiLogout } from './api';

type User = {
  id: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  org: { id: string; name: string; role: string } | null;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await getSession();
    if (res.ok && res.data.user) {
      const u = res.data.user;
      const m = u.memberships[0];
      setUser({
        id: u.id,
        email: u.email,
        name: u.name,
        isSuperAdmin: u.isSuperAdmin,
        org: m ? { id: m.organization.id, name: m.organization.name, role: m.role } : null,
      });
    } else {
      setUser(null);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    if (!res.ok) return { ok: false, error: res.error };
    // Token is saved inside apiLogin; now load the user from /api/auth/session with Bearer auth
    await refresh();
    return { ok: true };
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

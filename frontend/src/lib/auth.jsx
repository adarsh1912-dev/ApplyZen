import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, apiEnabled, ApiError } from './api';

const AuthCtx = createContext({ user: null, loading: true, online: false });
export const useAuth = () => useContext(AuthCtx);

// When no backend is configured, auth stays logged-out and pages keep their
// localStorage behavior. When VITE_API_URL is set, this provides real sessions.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(apiEnabled());
  const online = apiEnabled();

  useEffect(() => {
    if (!online) return;
    api.me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [online]);

  const login = useCallback(async (email, password) => {
    const d = await api.login({ email, password });
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const d = await api.register({ name, email, password });
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch (e) { if (!(e instanceof ApiError)) throw e; }
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, online, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

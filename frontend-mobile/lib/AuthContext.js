import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  api,
  decodeToken,
  isTokenExpired,
  getToken,
  setToken,
  clearToken,
  setSessionExpiredHandler,
} from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, full_name, role }
  const [loading, setLoading] = useState(true);

  const loadFromStorage = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const payload = decodeToken(token);
    if (!payload || isTokenExpired(payload) || payload.role !== "usuario") {
      await clearToken();
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data);
    } catch {
      setUser({ id: payload.sub, role: payload.role, email: "", full_name: "" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFromStorage();
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, [loadFromStorage]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    const payload = decodeToken(data.access_token);
    if (!payload || payload.role !== "usuario") {
      throw new Error(
        "Esta cuenta es de administrador. Usa el panel de administración web, no la app móvil."
      );
    }
    await setToken(data.access_token);
    const userData = await api.getMe().catch(() => null);
    setUser(userData || { id: payload.sub, role: payload.role, full_name: "" });
    return true;
  };

  const register = async ({ email, password, full_name }) => {
    await api.register({ email, password, full_name });
    return login(email, password);
  };

  const logout = async () => {
    await api.logout();
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadFromStorage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

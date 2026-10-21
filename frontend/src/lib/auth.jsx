import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return setReady(true);
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, [logout]);

  const startSession = ({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
  };

  const login = async (email, password) =>
    startSession(await api("/auth/login", { method: "POST", body: { email, password } }));

  const register = async (form) =>
    startSession(await api("/auth/register", { method: "POST", body: form }));

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

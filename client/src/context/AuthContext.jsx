import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";
const Ctx = createContext();
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("eh-token")) return setReady(true);
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("eh-token")).finally(() => setReady(true));
  }, []);
  const authenticate = (data) => { localStorage.setItem("eh-token", data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem("eh-token"); setUser(null); };
  return <Ctx.Provider value={{ user, setUser, ready, authenticate, logout }}>{children}</Ctx.Provider>;
}

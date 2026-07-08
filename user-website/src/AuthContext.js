import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  // "checking" until the initial whoami() call resolves, so routes don't
  // flash a login screen before we know a session cookie is still valid.
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    api
      .whoami()
      .then((res) => {
        setUsername(res.username);
        setCsrfToken(res.csrf_token);
        setStatus("loggedIn");
      })
      .catch(() => setStatus("loggedOut"));
  }, []);

  const login = useCallback(async (u, p) => {
    const res = await api.login(u, p);
    setUsername(res.username);
    setCsrfToken(res.csrf_token);
    setStatus("loggedIn");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUsername(null);
      setCsrfToken(null);
      setStatus("loggedOut");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ username, csrfToken, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}

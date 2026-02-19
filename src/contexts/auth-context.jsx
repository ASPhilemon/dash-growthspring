import React, { createContext, useContext, useMemo, useState } from "react";

// Put your Postman token here (or leave null to set later)
const INITIAL_TOKEN = "PASTE_YOUR_TOKEN_HERE";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    userId: "658fbda97695ba5ae6b937b5", // replace if needed
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NThmYmRhODc2OTViYTVhZTZiOTM3YjIiLCJmdWxsTmFtZSI6Ik13ZWJlIEJsYWlzZSBBZHJpYW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3NzE0NDU5MDMsImV4cCI6MTc3NDkwMTkwM30.NnukDGIXsLfS_LqSTq9L3i03xBxWvCduxCQK8senyDE"  });

  const value = useMemo(
    () => ({
      ...auth,
      setAuth: (next) => setAuth(next),
      clearAuth: () => setAuth({ userId: null, token: null }),
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

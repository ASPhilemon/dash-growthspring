import React, { createContext, useContext, useMemo, useState } from "react";

// Put your Postman token here (or leave null to set later)
const INITIAL_TOKEN = "PASTE_YOUR_TOKEN_HERE";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    userId: "658fbda97695ba5ae6b937b5", // replace if needed
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NThmYmRhODc2OTViYTVhZTZiOTM3YjEiLCJmdWxsTmFtZSI6IkFyaWtvIFN0ZXBoZW4gUGhpbGVtb24iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3NTg2MTgxNzAsImV4cCI6MTc2MjA3NDE3MH0.eGSI4CHRDYNnKQMx7y8kPNSljwBe1sS9vIPiJ3_3CLA"  });

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

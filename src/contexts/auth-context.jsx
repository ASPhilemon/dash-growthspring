import React, { createContext, useContext, useMemo, useState } from "react";

// Put your Postman token here (or leave null to set later)
const INITIAL_TOKEN = "PASTE_YOUR_TOKEN_HERE";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    userId: "658fbda97695ba5ae6b937b5", // replace if needed
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTk0ZmM0OTVlMjliNWQwNDFkM2YwM2IiLCJmdWxsTmFtZSI6IkF0dWhhaXJ3ZSBNYXJ5IiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTc1ODQ2MTY0OSwiZXhwIjoxNzYxOTE3NjQ5fQ.BppE-7S9AjVNNWokEje8yCJJ100Bkgh326AoQQcdPt4"  });

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

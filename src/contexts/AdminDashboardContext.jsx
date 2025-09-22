import React, { createContext, useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { useMemberDashboard } from "./MemberDashboardContext";
import { API_BASE } from "../../config";


// same fetch helper style as member context
async function api(path, { token, ...options } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  const json = await res.json();

  if (json?.error) throw new Error(json.error);
  return json?.data;
}

const AdminDashboardContext = createContext(null);

export function AdminDashboardProvider({ children }) {
  const { token } = useAuth();
  const { memberDashboard, isLoading: memberLoading } = useMemberDashboard();
  const queryClient = useQueryClient();

  // 🔹 We only block on member load ONCE. After first successful admin load,
  // we let this provider run independently.
  const bootstrappedRef = useRef(false);

  const isAdmin = !!memberDashboard?.user?.isAdmin;

  // Enabled rules:
  //  - Before bootstrap: wait until member has loaded AND is admin.
  //  - After bootstrap: just require token.
  const enabled = !!token && (bootstrappedRef.current ? true : (!memberLoading && isAdmin));

  const {
    data,
    isLoading,
    error,
    refetch,
    isSuccess,
  } = useQuery({
    queryKey: ["adminDashboard"],
    enabled,
    queryFn: () => api("/users/me/admin-dashboard", { token }), // adjust to your real route
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10_000, 
    refetchIntervalInBackground: true,
  });

  // Once we’ve successfully loaded admin data once, flip the flag.
  useEffect(() => {
    if (isSuccess && !bootstrappedRef.current) {
      bootstrappedRef.current = true;
      // You could optionally warm more admin queries here via queryClient.prefetchQuery(...)
    }
  }, [isSuccess]);

  // Optimistic local setter for fast UI tweaks
  function setAdminDashboardOptimistic(updater) {
    queryClient.setQueryData(["adminDashboard"], (cur) => {
      if (!cur) return cur;
      return updater(cur);
    });
  }

  const value = {
    adminDashboard: data ?? null,
    isLoading,
    error: error || null,
    refresh: () => refetch(),
    setAdminDashboardOptimistic,
    // Expose whether we’re bootstrapped, for debugging if you want
    _bootstrapped: bootstrappedRef.current,
  };

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboard() {
  const ctx = useContext(AdminDashboardContext);
  if (!ctx) throw new Error("useAdminDashboard must be used within <AdminDashboardProvider>");
  return ctx;
}

import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { API_BASE } from "../../config";

// Fetch helper: unwraps { error, data }
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

const MemberDashboardContext = createContext(null);

export function MemberDashboardProvider({ children }) {
  const { userId, token } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isSuccess,
  } = useQuery({
    queryKey: ["memberDashboard"],
    enabled: !!token, // cookie mode? change to isAuthenticated; for bearer, keep token
    queryFn: () => api("/users/me/dashboard", { token }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true, 
    refetchOnReconnect: true,
  });

  // 🔹 Optimistic local setter — use the SAME key you queried with.
  function setMemberDashboardOptimistic(updater) {
    queryClient.setQueryData(["memberDashboard"], (cur) => {
      if (!cur) return cur;
      return updater(cur);
    });
  }

  // 🔹 After member dashboard loads and user is admin, prefetch admin dashboard once.
  useEffect(() => {
    if (!isSuccess || !data) return;
    const isAdmin = !!data?.user?.isAdmin;
    if (!isAdmin) return;

    // Prefetch to make the admin page instant the first time after sign-in.
    queryClient.prefetchQuery({
      queryKey: ["adminDashboard"],
      queryFn: () => api("/admin/me/dashboard", { token }), // adjust path if needed
      staleTime: 0,
    });
  }, [isSuccess, data, token, queryClient]);

  const value = {
    memberDashboard: data ?? null,
    isLoading,
    error: error || null,
    refresh: () => refetch(),
    setMemberDashboardOptimistic,
  };

  return (
    <MemberDashboardContext.Provider value={value}>
      {children}
    </MemberDashboardContext.Provider>
  );
}

export function useMemberDashboard() {
  const ctx = useContext(MemberDashboardContext);
  if (!ctx) throw new Error("useMemberDashboard must be used within <MemberDashboardProvider>");
  return ctx;
}

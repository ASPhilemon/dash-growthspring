// src/components/GlobalLoadingOverlayController.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useDashboardSwitch } from "../contexts/DashboardSwitchContext";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";
import { useAdminDashboard } from "../contexts/AdminDashboardContext";

/**
 * Shows "Loading dashboard…" on hard navigations / reloads,
 * not on background refetches. Keeps it visible for at least `minShowMs`.
 */
export default function GlobalLoadingOverlayController({ minShowMs = 2000 }) {
  const { pathname } = useLocation();
  const { show, hide } = useDashboardSwitch();

  const { isLoading: memberLoading, memberDashboard } = useMemberDashboard();
  const { isLoading: adminLoading } = useAdminDashboard();

  const shownForPathRef = React.useRef(new Set());
  const tRef = React.useRef(null);
  const startTsRef = React.useRef(0);

  const isAdmin = !!memberDashboard?.user?.isAdmin;

  // cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (tRef.current) {
        clearTimeout(tRef.current);
        tRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    // If overlay already shown for this path, never show again until full reload
    if (shownForPathRef.current.has(pathname)) return;

    const waitingForInitialLoad = memberLoading || (isAdmin && adminLoading);

    if (waitingForInitialLoad) {
      // start overlay and remember the start time
      show("Loading dashboard…", minShowMs);
      startTsRef.current = Date.now();
      return () => {
        // cleanup pending hide timer if any on path change
        if (tRef.current) {
          clearTimeout(tRef.current);
          tRef.current = null;
        }
      };
    }

    // initial load completed: ensure overlay stays up for at least minShowMs
    // (React Query v4: isLoading is false for refetches, so this won't re-trigger)
    if (!waitingForInitialLoad) {
      const elapsed = Date.now() - (startTsRef.current || 0);
      const wait = Math.max(0, minShowMs - elapsed);
      tRef.current = setTimeout(() => {
        hide();
        shownForPathRef.current.add(pathname);
        tRef.current = null;
      }, wait);
    }

    return () => {
      if (tRef.current) {
        clearTimeout(tRef.current);
        tRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, memberLoading, adminLoading, isAdmin]);

  return null;
}

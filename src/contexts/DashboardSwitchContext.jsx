// src/contexts/DashboardSwitchContext.jsx
import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import DashboardSwitchOverlay from "../components/animations/DashboardSwitchOverlay";

const Ctx = createContext(null);

export function DashboardSwitchProvider({ children } = {}) {
  const [label, setLabel] = useState(null);
  const [progressMs, setProgressMs] = useState(2000);
  const [animKey, setAnimKey] = useState(0);

  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Show a generic overlay (e.g., on page load)
  const show = useCallback((labelText, ms = 2000) => {
    clearTimer();
    setLabel(labelText || "Loading…");
    setProgressMs(Math.max(0, ms));
    setAnimKey((k) => k + 1); // restart bar
  }, []);

  // Hide overlay
  const hide = useCallback(() => {
    clearTimer();
    setLabel(null);
  }, []);

  // Switching with delayed navigation
  const switchTo = useCallback(
    ({ to, label: lbl, delayMs }) => {
      clearTimer();
      const delay = typeof delayMs === "number" ? delayMs : 2000;

      setLabel(lbl || "selected dashboard");
      setProgressMs(Math.max(0, delay));
      setAnimKey((k) => k + 1); // restart bar

      timerRef.current = setTimeout(() => {
        navigate(to);
        // allow new page to mount & fade a touch
        const hideDelay = reduce ? 0 : 250;
        setTimeout(() => {
          setLabel(null);
          clearTimer();
        }, hideDelay);
      }, delay);
    },
    [navigate, reduce]
  );

  const value = {
    isActive: Boolean(label),
    label,
    progressMs,
    animKey,
    show,
    hide,
    switchTo,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <DashboardSwitchOverlay
        visible={Boolean(label)}
        label={label || ""}
        progressMs={progressMs}
        animKey={animKey}
      />
    </Ctx.Provider>
  );
}

export const useDashboardSwitch = () => useContext(Ctx);

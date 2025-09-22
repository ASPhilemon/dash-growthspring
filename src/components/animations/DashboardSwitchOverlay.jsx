// src/components/animations/DashboardSwitchOverlay.jsx
import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { THEME } from "../../theme";

const { colors: THEME_COLORS } = THEME;

export default function DashboardSwitchOverlay({
  label,
  visible,
  progressMs = 2000,
  animKey = 0,
}) {
  const reduce = useReducedMotion();

  const lower = (label || "").toLowerCase();
  const isLoading = lower.startsWith("loading");
  const title = isLoading ? label : `Switching to ${label}…`;

  // bar anim duration in seconds
  const barDuration = reduce ? 0 : Math.max(0, progressMs) / 1000;

  // force the inner bar to remount and restart its animation
  const barKey = `${visible}-${progressMs}-${animKey}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="switch-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4000,
            background: "rgba(6, 10, 24, 0.55)",
            backdropFilter: "blur(6px) saturate(115%)",
            WebkitBackdropFilter: "blur(6px) saturate(115%)",
            display: "grid",
            placeItems: "center",
            pointerEvents: "auto",
          }}
        >
          {/* CARD (no scaling here; only fade-in handled above) */}
          <motion.div
            initial={{ opacity: reduce ? 1 : 0.95, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
            style={{
              width: "min(92vw, 720px)",
              borderRadius: 16,
              padding: "28px 24px",
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
              boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: THEME_COLORS.white,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 12,
                color: THEME_COLORS.gold,
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 14,
                opacity: 0.9,
                color: THEME_COLORS.white,
                marginBottom: 18,
              }}
            >
              Please hold on a moment
            </div>

            {/* Track */}
            <div
              style={{
                height: 6,
                width: "100%",
                background: "rgba(255,255,255,0.15)",
                borderRadius: 9999,
                overflow: "hidden",
              }}
              aria-hidden
            >
              {/* Fill (starts empty; fills to 100% over progressMs) */}
              <motion.div
                key={barKey}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: barDuration, ease: "linear" }
                }
                style={{
                  height: "100%",
                  width: "100%",
                  willChange: "transform",
                  transformOrigin: "0% 50%",
                  background: THEME_COLORS.gold,
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

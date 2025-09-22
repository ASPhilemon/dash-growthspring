// src/components/animations/PageFade.jsx
import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Wrap each route (or page) with <PageFade> to get a small fade transition.
 * Usage in your Router: element={<PageFade><YourPage /></PageFade>}
 */
export default function PageFade({ children }) {
  const reduce = useReducedMotion();

  const variants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };

  const transition = reduce ? { duration: 0 } : { duration: 0.20, ease: "easeOut" }; // 200ms

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={transition}
      style={{ height: "100%" }} // keep layout
    >
      {children}
    </motion.div>
  );
}

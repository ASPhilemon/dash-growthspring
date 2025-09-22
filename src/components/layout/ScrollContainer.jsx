import React from "react";
import { THEME } from "../../theme";

const { spacing } = THEME;

// This version now correctly applies padding for both mobile and desktop views.
function ScrollContainer({ isMobile, innerHeight, children }) {
  return (
    <div style={{ 
        padding: isMobile ? spacing.pagePadding : 20, // Corrected padding
        boxSizing: "border-box", 
        overflow: "hidden", 
        flex: 1 
      }}
    >
      <div
        style={{
          height: innerHeight,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.gap }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default ScrollContainer;
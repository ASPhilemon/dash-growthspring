// src/components/layout/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { THEME } from "../../theme";

const { colors, sizes } = THEME;

/**
 * Header
 * Props:
 * - isMobile: boolean
 * - onToggle: fn (hamburger)
 * - headerRef: ref
 * - dashboard: string key of the active dashboard ("member" | "temporary" | "admin")
 */
function Header({ isMobile, onToggle, headerRef, dashboard = "member" }) {
  // central dashboard registry — edit labels / home routes here
  const DASHBOARDS = {
    member: { label: "Permanent Savings", home: "/home" },
    temporary: { label: "Temporary Savings", home: "/temporary-savings" },
    admin: { label: "Admin Dashboard", home: "/admin" },
  };

  const { label: currentLabel = "Permanent Savings", home: currentHome = "/home" } =
    DASHBOARDS[dashboard] || DASHBOARDS.member;

  return (
    <header
      ref={headerRef}
      style={{
        backgroundColor: colors.gold,
        color: colors.navy,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "12px 3vw" : "16px 3vw",
        fontWeight: 700,
        fontSize: isMobile ? 18 : 20,
        height: sizes.headerHeight,
        boxSizing: "border-box",
        zIndex: 50,
      }}
    >
      {isMobile && (
        <button
          onClick={onToggle}
          aria-label="Open menu"
          style={{
            background: "none",
            border: "none",
            fontSize: 26,
            color: colors.navy,
            cursor: "pointer",
            padding: 6,
            marginRight: 8,
          }}
        >
          &#9776;
        </button>
      )}

      {/* Clickable brand + dashboard label */}
      <Link to={currentHome} style={{ textDecoration: "none", marginLeft: "auto" }} aria-label={`Go to ${currentLabel} home`}>
        <div style={{ marginLeft: isMobile ? "auto" : 0, fontWeight: 800 }}>
          <span style={{ color: colors.navy, fontWeight: 700 }}>{currentLabel}</span>
        </div>
      </Link>

      {/* spacer for desktop — keep header balanced */}
      <div style={{ width: 28 }} aria-hidden />
    </header>
  );
}

export default Header;

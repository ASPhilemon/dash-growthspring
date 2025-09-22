// src/components/layout/Sidebar.jsx
import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { THEME } from "../../theme";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useAdminDashboard } from "../../contexts/AdminDashboardContext";
import ProfileModal from "./ProfileModal";
import { useDashboardSwitch } from "../../contexts/DashboardSwitchContext";


const { colors: THEME_COLORS, sizes } = THEME;

/* Scoped CSS */
const SidebarScrollStyle = () => (
  <style>{`
    .gs-sidebar::-webkit-scrollbar { width: 0; height: 0; }
    .gs-sidebar { -ms-overflow-style: none; scrollbar-width: none; }
    .gs-sidebar a:focus, .gs-sidebar button:focus { outline: 2px solid rgba(212,175,55,0.25); outline-offset: 2px; }
    .gs-modal-backdrop { position: fixed; inset: 0; }
  `}</style>
);

const DASHBOARDS = [
  { name: "member", label: "Permanent Savings", to: "/home" },
  { name: "temporary", label: "Temporary Savings", to: "/temporary-savings" },
  { name: "admin", label: "Admin Dashboard", to: "/admin" },
];

function NavLinkItem({ text, to = "#", onClick }) {
  const { pathname } = useLocation();

  const isActiveLink = (to, pathname) => {
    if (!to) return false;

    // Home aliases
    if (to === "/home" || to === "/") {
      return pathname === "/" || pathname === "/home";
    }
    // Temporary savings aliases (parent should NOT be active on children)
    if (to === "/temporary-savings") {
      return pathname === "/temporary-savings" || pathname === "/temporary/home";
    }
    // Admin aliases (parent should NOT be active on children)
    if (to === "/admin") {
      return pathname === "/admin" || pathname === "/admin/home";
    }

    // Default: exact or child route is active
    return pathname === to || pathname.startsWith(to + "/");
  };

  // Parents that should only match exactly (no descendant matching)
  const endMatch =
    to === "/" || to === "/home" || to === "/temporary-savings" || to === "/admin";

  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={endMatch}
      style={{ textDecoration: "none", width: "100%" }}
    >
      {({ isActive }) => {
        const active = isActive || isActiveLink(to, pathname);

        return (
          <div
            style={{
              padding: "1.5vh 16px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              color: active ? THEME_COLORS.navy : "rgba(255,255,255,0.75)",
              backgroundColor: active ? THEME_COLORS.gold : "transparent",
              fontSize: 14,
              fontWeight: active ? 800 : 600,
              borderRadius: "5vw 0 0 5vw",
              margin: "0.7vh 0",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              width: "calc(100% - 28px)",
              marginLeft: 28,
            }}
          >
            {text}
          </div>
        );
      }}
    </NavLink>
  );
}


function SidebarAction({ text, to, onClose }) {
  const { switchTo } = useDashboardSwitch();

  const handleClick = () => {
    // Optional: close the drawer first on mobile
    if (typeof onClose === "function") onClose();

    if (to) {
      // Trigger the animated overlay + delayed navigation
      switchTo({ to, label: text });
    }
  };

  return (
    <div style={{ padding: "10px 28px 0 28px", boxSizing: "border-box" }}>
      <button
        onClick={handleClick}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
        aria-label={`Switch to ${text}`}
      >
        <div
          style={{
            width: "100%",
            backgroundColor: THEME_COLORS.gold,
            color: THEME_COLORS.navy,
            padding: "10px 12px",
            borderRadius: 6,
            fontWeight: 700,
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          {text}
        </div>
      </button>
    </div>
  );
}


/* ProfileHeader clickable - placed at very top with small padding and closer to left */
function ProfileHeader({ profile, onOpenProfile }) {
  const name = profile?.user?.displayName || profile?.user?.fullName || "Mwebe";
  const avatar = profile?.user?.photoURL || "https://via.placeholder.com/80";

  return (
    <div
      onClick={onOpenProfile}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpenProfile(); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",   // small padding and closer to left
        marginTop: 12,
        width: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
      }}
    >
      <img
        src={avatar}
        alt={`${name} avatar`}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2px solid ${THEME_COLORS.gold}`,
          display: "block",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: THEME_COLORS.gold, fontWeight: 700, fontSize: 16 }}>{name}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{profile?.user?.email ?? ""}</div>
      </div>
    </div>
  );
}

function Sidebar({
  dashboard = "member",
  navLinks = null,
  isMobile,
  isOpen, 
  onClose,
  transform,
  onLogout,
  onProfileSave,
}) {
  const location = useLocation();
  const { memberDashboard, setMemberDashboard } = useMemberDashboard() || {};
  const { adminDashboard, setAdminDashboard } = useAdminDashboard() || {};
  const profile = memberDashboard || adminDashboard || {};
  const isAdmin = !!memberDashboard?.user?.isAdmin;


  const defaultNavLinks = [
    { text: "Home", to: "/home" },
    { text: "Your Deposits", to: "/deposits" },
    { text: "Your Earnings", to: "/earnings" },
    { text: "Your Points", to: "/points" },
    { text: "Your Loans", to: "/loans" },
    { text: "Club Deposits", to: "/club-deposits" },
    { text: "Club Earnings", to: "/club-earnings" },
  ];

  const linksToRender = Array.isArray(navLinks) && navLinks.length > 0 ? navLinks : defaultNavLinks;

const actionsToRender = DASHBOARDS
  .filter((d) => d.name !== dashboard)                // don’t show the current dashboard button
  .filter((d) => (isAdmin ? true : d.name !== "admin")) // hide Admin for non-admins
  .map((d) => ({ text: d.label, to: d.to }));

  const isActiveLink = (to) => {
    if (!to) return false;
    if (to === "/home") return location.pathname === "/home";
    if (to === "/temporary-savings") return location.pathname === "/temporary-savings" || location.pathname === "/temporary/home";
    if (to === "/admin") return location.pathname === "/admin" || location.pathname === "/admin/home";
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const setProfileInContext = (updated) => {
    if (typeof setMemberDashboard === "function") setMemberDashboard(updated);
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    try { localStorage.removeItem("authToken"); } catch (e) {}
    console.log("Logged out (no handler provided).");
  };

  const sidebarStyleBase = {
    width: sizes.sidebarWidth,
    backgroundColor: THEME_COLORS.navy,
    color: THEME_COLORS.white,
    paddingTop: 8, // small top padding so avatar is near top
    paddingBottom: 16,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    minHeight: "100vh",
    /* IMPORTANT: prevent the whole sidebar from scrolling; only links scroll */
    overflow: "hidden",
  };

  return (
    <>
      <SidebarScrollStyle />
      <aside
        className="gs-sidebar"
        style={{
          ...sidebarStyleBase,
          position: isMobile ? "fixed" : "static",
          top: 0,
          left: 0,
          height: isMobile ? "100%" : "100vh",
          transform: isMobile ? transform : "none",
          transition: isMobile ? "transform 320ms cubic-bezier(.2,.9,.3,1)" : "none",
          zIndex: isMobile ? 1000 : "auto",
        }}
        aria-label="Main sidebar"
      >
        {/* Fixed profile at top */}
        <ProfileHeader profile={profile} onOpenProfile={() => setProfileModalOpen(true)} />

        {/* Middle area: ONLY links scroll */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <nav style={{ width: "100%", paddingTop: 8, flex: 1, overflowY: "auto" }}>
            {linksToRender.map((link) => (
              <NavLinkItem
                key={link.to || link.text}
                text={link.text}
                to={link.to}
                onClick={onClose}
                isActive={isActiveLink(link.to)}
              />
            ))}
          </nav>

          {/* Footer: fixed actions + logout near bottom */}
          <div style={{ paddingTop: 8 , marginBottom: isMobile ? "9vh" : 0}}>
            {actionsToRender.map((btn, idx) => (
              <SidebarAction key={idx} text={btn.text} to={btn.to} onClose={onClose} />
            ))}

            {/* small spacer between buttons and logout */}
            <div style={{ height: isMobile ? "4vh" : "1.3vh" }} />

            <div style={{ padding: "0 28px 12px 28px", boxSizing: "border-box" }}>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  width: "100%",
                  padding: 8,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M16 17L21 12L16 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12H9" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div style={{ color: THEME_COLORS.white, fontWeight: 700 }}>Log Out</div>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        setProfileInContext={setProfileInContext}
        onSaveRemote={onProfileSave}
      />
    </>
  );
}

export default Sidebar;

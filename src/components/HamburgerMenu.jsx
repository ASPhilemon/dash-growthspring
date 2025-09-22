import React from "react";

export default function HamburgerMenu({ toggleSidebar, isSidebarOpen }) {
  return (
    <button
      className="hamburger-menu"
      onClick={toggleSidebar}
      style={{ display: isSidebarOpen ? "none" : "block" }}
    >
      &#9776;
    </button>
  );
}

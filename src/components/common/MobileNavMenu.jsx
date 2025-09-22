import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import { THEME } from "../../theme";

const { colors } = THEME;

// The items prop now expects an array of objects: { text: 'Display Name', to: '/url-path' }
function MobileNavMenu({ items, activeItem }) {
  const scrollRef = useRef(null);

  // This effect scrolls the active tab into the center of the view
  useEffect(() => {
    const activeElement = scrollRef.current?.querySelector(".active-nav-item");
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeItem]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        maxWidth: "98vw",
        overflowX: "auto", // This makes the container scrollable horizontally
        padding: "8px  12px",
        gap: 10,
        scrollbarWidth: "none", // Hide scrollbar for Firefox
        msOverflowStyle: "none", // Hide scrollbar for IE/Edge
      }}
    >
      <style>{`
        /* Hide scrollbar for Chrome, Safari, and Opera */
        .mobile-nav-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {items.map((item) => {
        let correctText = "";
        if (activeItem == "Temporary Deposits & Withdrawals"){
          correctText = "Deposits & Withdrawals"
        }
        if (activeItem == "Temporary Loans"){
          correctText = "Loans"
        }
        if (activeItem == "Total Temporary Savings"){
          correctText = "The Club"
        }
        let isActive = item.text === activeItem || item.text === correctText;
        return (
          <Link
            key={item.text}
            to={item.to}
            className={isActive ? 'active-nav-item' : ''}
            style={{ textDecoration: 'none' }}
          >
<div
  style={{
    flexShrink: 0,
    padding: "8px 16px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: isActive ? colors.navy : colors.white,
    color: isActive ? colors.gold : colors.navy,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    textAlign: "center",
    transition: "all 200ms ease-in-out",
    whiteSpace: "nowrap",   // ✅ prevents wrapping
  }}
>
  {item.text}
</div>

          </Link>
        );
      })}
    </div>
  );
}

export default MobileNavMenu;
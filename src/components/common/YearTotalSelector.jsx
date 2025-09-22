import React, { useState, useEffect, useRef } from "react";
import { THEME } from "../../theme";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";

const { colors, divider } = THEME;

function YearTotalSelector({ selectedYear, total, years, onYearChange }) {
  const { memberDashboard, isLoading, error } = useMemberDashboard();
  const dashboardAppearance = memberDashboard?.dashboardAppearance ?? { layoutStyle: "stacked", colorTheme: "gold" };
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleSelect = (year) => {
    onYearChange({ target: { value: year } });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  return (
    <div style={{ position: "relative" }} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: colors.navy, 
          padding: "10px 16px", // Increased padding for better text spacing
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
          minHeight: 48, // Ensure minimum height for visibility
          boxSizing: "border-box",
        }}
      >
        <span style={{ padding: "2px 0", whiteSpace: "nowrap", color: dashboardAppearance.color == "blue" ? "rgb(70,130,180)": colors.gold, }}>{selectedYear}</span>
        <span style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", color: dashboardAppearance.color == "blue" ? "rgb(70,130,180)": colors.gold, }}>
          {total}
          <span
            style={{
              marginLeft: 12,
              fontSize: 16,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
              color: dashboardAppearance.color == "blue" ? "rgb(70,130,180)": colors.gold, // Ensure icon matches text color
            }}
          >
            &#x25BE; {/* Non-filled dropdown arrow */}
          </span>
        </span>
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "105%",
            left: 0,
            right: 0,
            backgroundColor: colors.white,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: `1px solid ${divider}`,
            zIndex: 10,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {years.map((year) => (
            <div
              key={year}
              onClick={() => handleSelect(year)}
              style={{
                padding: "12px 14px",
                color: colors.navy,
                cursor: "pointer",
                borderBottom: `1px solid ${divider}`,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.lightGray)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.white)}
            >
              {year}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YearTotalSelector;
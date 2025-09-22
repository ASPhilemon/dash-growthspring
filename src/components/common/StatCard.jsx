import React from "react";
import { THEME } from "../../theme";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";

const { colors, spacing } = THEME;

// Style adjustments for the stat card
const statCardBase = {
  backgroundColor: colors.navy,
  borderRadius: 10,
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "3vh 5vh",
  flexShrink: 0, // still needed for mobile scroll
};


function StatCard({ title, value }) 
{const { memberDashboard, isLoading, error } = useMemberDashboard();
const dashboardAppearance =
  memberDashboard?.dashboardAppearance ?? { layoutStyle: "stacked", colorTheme: "gold" };

  return (
    <div style={statCardBase}>
      <div style={{ fontSize: 14, fontWeight: "bold", color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: dashboardAppearance.color == "gold" ? colors.gold : "rgb(70,130,180)" }}>
        {value}
      </div>
    </div>
  );
}

export default StatCard;
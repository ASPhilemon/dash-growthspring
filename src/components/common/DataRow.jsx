import React from "react";
import { THEME } from "../../theme";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";

const { colors, mobileRowBg } = THEME;

function DataRow({ label, value, index = 0, small = false, rowSize = "small"}) {
  const { memberDashboard } = useMemberDashboard();
  const { dashboardAppearance } = memberDashboard;

  const navRow = index % 2 === 0;
  const rowBg = navRow ? mobileRowBg.navy : dashboardAppearance.color === "gold" ? mobileRowBg.gold : "rgb(70,130,180, 0.2)";
  const rightColor = navRow && dashboardAppearance.color === "gold" ? colors.gold : navRow && dashboardAppearance.color === "blue" ? colors.white : colors.navy;
  const leftColor = navRow ? colors.white : colors.navy; 
  const paddingSz = rowSize == "Big" ? "2.7vh" : "1.5vh";
  const fontSz = rowSize == "Big" ? 18 : 16;


  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: paddingSz,
        backgroundColor: rowBg,
        borderRadius: 6,
        marginBottom: "0.8vh",
        animation: "rowFade 420ms ease both",
      }}
    >
      <div style={{ color: leftColor, fontWeight: 600, fontSize: small ? 15 : fontSz }}>
        {label}
      </div>
      <div style={{ color: rightColor, fontWeight: 600, fontSize: fontSz }}>
        {value}
      </div>
    </div>
  );
}

export default DataRow;
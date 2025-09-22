import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function PointsDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.home?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.home?.memberOverviewGroups || [];

  const pageName = "Your Points";
  const statTitle = "Your Points";
  const statValue =
    memberStats.find((t) => t.title === "Your Points")?.value ?? "-";

  const overviewGroup =
    memberOverviewGroups.find((t) => t.title === "Points") ?? {
      title: "Points",
      rows: [],
    };

  const tableHeaders = ["Date", "Points", "Activity"];
  const allTransactions = memberDashboard?.pointsRecords ?? [];

  return (
    <BaseDetailsPage
      pageName={pageName}
      statTitle={statTitle}
      statValue={statValue}
      overviewGroup={overviewGroup}
      tableHeaders={tableHeaders}
      allTransactions={allTransactions}
      formatTotal={(total) => `${total.toLocaleString()} pts`}
    />
  );
}

export default PointsDetailsPage;

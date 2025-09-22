import React from 'react';
import { Outlet } from 'react-router-dom';
import { MemberDashboardProvider } from '../../contexts/MemberDashboardContext';

export default function MemberLayout() {
  return (
    <MemberDashboardProvider>
      {/* The Outlet component renders the matching child route, e.g., MemberDashboard */}
      <Outlet />
    </MemberDashboardProvider>
  );
}
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminDashboardProvider } from '../../contexts/AdminDashboardContext';

export default function AdminLayout() {
  return (
    <AdminDashboardProvider>
      {/* The Outlet component renders the matching child route, e.g., AdminHomePage */}
      <Outlet />
    </AdminDashboardProvider>
  );
}
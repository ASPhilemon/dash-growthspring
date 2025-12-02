// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import AdminLayout from "./components/layout/AdminLayout";
import MemberLayout from "./components/layout/MemberLayout";

import PageFade from "./components/animations/PageFade";
import { DashboardSwitchProvider } from "./contexts/DashboardSwitchContext";

import { AuthProvider } from "./contexts/auth-context";
import { MemberDashboardProvider } from "./contexts/MemberDashboardContext";
import { AdminDashboardProvider } from "./contexts/AdminDashboardContext";
import GlobalLoadingOverlayController from "./components/GlobalLoadingOverlayController";


import MemberDashboard from "./pages/MemberDashboard";
import SavingsDashboard from "./pages/TemporarySavingsDashboard";
import LoansDetailsPage from "./pages/LoansDetailsPage";
import DepositsDetailsPage from "./pages/DepositsDetailsPage";
import TemporaryDepositsDetailsPage from "./pages/TemporaryDepositsDetailsPage";
import TemporaryLoansDetailsPage from "./pages/TemporaryLoansDetailsPage";
import TemporaryClubDetailsPage from "./pages/TemporaryClubDetailsPage";
import EarningsDetailsPage from "./pages/EarningsDetailsPage";
import PointsDetailsPage from "./pages/PointsDetailsPage";
import DiscountsDetailsPage from "./pages/DiscountsDetailsPage";
import ClubDepositsDetailsPage from "./pages/ClubDepositsDetailsPage";
import ClubEarningsDetailsPage from "./pages/ClubEarningsDetailsPage";
import AdminHomePage from "./pages/Admin pages/AdminHomePage";
import AdminDepositsPage from "./pages/Admin pages/AdminDepositsPage";
import AdminLoansPage from "./pages/Admin pages/AdminLoansPage";
import AdminFundTransactionsPage from "./pages/Admin pages/ClubFundTransactions";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Admin routes (now covered by AdminDashboardProvider above) */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<PageFade><AdminHomePage /></PageFade>} />
          <Route path="/admin/deposits" element={<PageFade><AdminDepositsPage /></PageFade>} />
          <Route path="/admin/loans" element={<PageFade><AdminLoansPage /></PageFade>} />
          <Route path="/admin/fundTransactions" element={<PageFade><AdminFundTransactionsPage /></PageFade>} />
        </Route>

        {/* Member routes */}
        <Route element={<MemberLayout />}>
          <Route path="/home" element={<PageFade><MemberDashboard /></PageFade>} />
          <Route path="/temporary-savings" element={<PageFade><SavingsDashboard /></PageFade>} />
          <Route path="/loans" element={<PageFade><LoansDetailsPage /></PageFade>} />
          <Route path="/temporary-savings/loans" element={<PageFade><TemporaryLoansDetailsPage /></PageFade>} />
          <Route path="/deposits" element={<PageFade><DepositsDetailsPage /></PageFade>} />
          <Route path="/temporary-savings/transactions" element={<PageFade><TemporaryDepositsDetailsPage /></PageFade>} />
          <Route path="/earnings" element={<PageFade><EarningsDetailsPage /></PageFade>} />
          <Route path="/points" element={<PageFade><PointsDetailsPage /></PageFade>} />
          <Route path="/discounts" element={<PageFade><DiscountsDetailsPage /></PageFade>} />
          <Route path="/club-deposits" element={<PageFade><ClubDepositsDetailsPage /></PageFade>} />
          <Route path="/club-earnings" element={<PageFade><ClubEarningsDetailsPage /></PageFade>} />
          <Route path="/temporary-savings/club" element={<PageFade><TemporaryClubDetailsPage /></PageFade>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemberDashboardProvider>
          <AdminDashboardProvider>
          <Router>
          <DashboardSwitchProvider>
            {/* Shows overlay on refresh, route change, and while queries fetch */}
            <GlobalLoadingOverlayController minShowMs={2000}/>
            <AnimatedRoutes />
          </DashboardSwitchProvider>
        </Router>
          </AdminDashboardProvider>
        </MemberDashboardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

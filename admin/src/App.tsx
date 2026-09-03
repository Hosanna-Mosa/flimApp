import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import VerificationRequestsPage from "@/pages/VerificationRequestsPage";
import VerificationDetailPage from "@/pages/VerificationDetailPage";
import UsersPage from "@/pages/Users";
import ExpertBoostHub from "@/pages/ExpertBoostHub";
import UserDetailPage from "@/pages/UserDetailPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import AppUpdatesPage from "@/pages/AppUpdatesPage";
import ReportsPage from "@/pages/ReportsPage";
import ReportDetailPage from "@/pages/ReportDetailPage";
import SupportPage from "@/pages/SupportPage";
import SupportDetailPage from "@/pages/SupportDetailPage";
import PaymentsPage from "@/pages/PaymentsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ErrorsPage from "@/pages/ErrorsPage";
import NotFound from "@/pages/NotFound";
import { ADMIN_ROLES } from "@/types";

const queryClient = new QueryClient();

/** Verification and operations staff. */
const ReviewersOnly = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute roles={[ADMIN_ROLES.VERIFICATION, ADMIN_ROLES.OPERATIONS]}>{children}</ProtectedRoute>
);

/** Super admin only. ProtectedRoute grants super every role list, so an empty
    list admits nobody else. */
const SuperOnly = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute roles={[]}>{children}</ProtectedRoute>
);

/** Operations staff only - document reviewers do not see these. */
const OperationsOnly = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute roles={[ADMIN_ROLES.OPERATIONS]}>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Redirect root to requests */}
            <Route path="/" element={<Navigate to="/requests" replace />} />

            {/* Protected admin routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Role gates mirror the server guards in routes/admin*.routes.js.
                  These only hide screens - the API is what enforces access. */}
              <Route path="/reports" element={<OperationsOnly><ReportsPage /></OperationsOnly>} />
              <Route path="/reports/:id" element={<OperationsOnly><ReportDetailPage /></OperationsOnly>} />
              <Route path="/support" element={<OperationsOnly><SupportPage /></OperationsOnly>} />
              <Route path="/support/:id" element={<OperationsOnly><SupportDetailPage /></OperationsOnly>} />
              <Route path="/requests" element={<ReviewersOnly><VerificationRequestsPage /></ReviewersOnly>} />
              <Route path="/requests/:id" element={<ReviewersOnly><VerificationDetailPage /></ReviewersOnly>} />
              <Route path="/management-hub" element={<OperationsOnly><ExpertBoostHub /></OperationsOnly>} />
              <Route path="/subscriptions" element={<Navigate to="/management-hub" replace />} />
              <Route path="/boost-subscriptions" element={<Navigate to="/management-hub" replace />} />
              <Route path="/users" element={<OperationsOnly><UsersPage /></OperationsOnly>} />
              <Route path="/users/:id" element={<OperationsOnly><UserDetailPage /></OperationsOnly>} />
              <Route path="/payments" element={<SuperOnly><PaymentsPage /></SuperOnly>} />
              <Route path="/analytics" element={<OperationsOnly><AnalyticsPage /></OperationsOnly>} />
              <Route path="/errors" element={<OperationsOnly><ErrorsPage /></OperationsOnly>} />
              <Route path="/logs" element={<OperationsOnly><AuditLogsPage /></OperationsOnly>} />
              <Route path="/app-updates" element={<OperationsOnly><AppUpdatesPage /></OperationsOnly>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

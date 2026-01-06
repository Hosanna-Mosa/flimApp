import { Toaster } from "@/components/ui/toaster";
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
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
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
              <Route path="/requests" element={<VerificationRequestsPage />} />
              <Route path="/requests/:id" element={<VerificationDetailPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/logs" element={<AuditLogsPage />} />
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

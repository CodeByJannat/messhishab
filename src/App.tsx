import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
// Static Pages
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import RefundPage from "./pages/RefundPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
// Manager Dashboard
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import MembersPage from "./pages/dashboard/MembersPage";
import MealsPage from "./pages/dashboard/MealsPage";
import BazarPage from "./pages/dashboard/BazarPage";
import DepositsPage from "./pages/dashboard/DepositsPage";
import BalancePage from "./pages/dashboard/BalancePage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import PinRecordsPage from "./pages/dashboard/PinRecordsPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import PaymentPage from "./pages/dashboard/PaymentPage";
import ManagerHelpDeskPage from "./pages/dashboard/ManagerHelpDeskPage";
// Member Dashboard
import MemberDashboard from "./pages/member/MemberDashboard";
import MemberBazarPage from "./pages/member/MemberBazarPage";
import MemberNotificationsPage from "./pages/member/MemberNotificationsPage";
import MemberContactPage from "./pages/member/MemberContactPage";
// Admin Dashboard
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubscriptionPage from "./pages/admin/AdminSubscriptionPage";
import AdminMessPage from "./pages/admin/AdminMessPage";
import AdminCouponPage from "./pages/admin/AdminCouponPage";
import AdminHelpDeskPage from "./pages/admin/AdminHelpDeskPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/refund" element={<RefundPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* Manager Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/members" element={<ProtectedRoute requiredRole="manager"><MembersPage /></ProtectedRoute>} />
                  <Route path="/dashboard/meals" element={<ProtectedRoute requiredRole="manager"><MealsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/bazar" element={<ProtectedRoute requiredRole="manager"><BazarPage /></ProtectedRoute>} />
                  <Route path="/dashboard/deposits" element={<ProtectedRoute requiredRole="manager"><DepositsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/balance" element={<ProtectedRoute requiredRole="manager"><BalancePage /></ProtectedRoute>} />
                  <Route path="/dashboard/notifications" element={<ProtectedRoute requiredRole="manager"><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/pins" element={<ProtectedRoute requiredRole="manager"><PinRecordsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/subscription" element={<ProtectedRoute requiredRole="manager"><SubscriptionPage /></ProtectedRoute>} />
                  <Route path="/dashboard/payment" element={<ProtectedRoute requiredRole="manager"><PaymentPage /></ProtectedRoute>} />
                  <Route path="/dashboard/helpdesk" element={<ProtectedRoute requiredRole="manager"><ManagerHelpDeskPage /></ProtectedRoute>} />
                  {/* Member Dashboard Routes */}
                  <Route path="/member" element={<ProtectedRoute requiredRole="member"><MemberDashboard /></ProtectedRoute>} />
                  <Route path="/member/bazar" element={<ProtectedRoute requiredRole="member"><MemberBazarPage /></ProtectedRoute>} />
                  <Route path="/member/notifications" element={<ProtectedRoute requiredRole="member"><MemberNotificationsPage /></ProtectedRoute>} />
                  <Route path="/member/contact" element={<ProtectedRoute requiredRole="member"><MemberContactPage /></ProtectedRoute>} />
                  {/* Admin Dashboard Routes */}
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/subscription" element={<ProtectedRoute requiredRole="admin"><AdminSubscriptionPage /></ProtectedRoute>} />
                  <Route path="/admin/mess" element={<ProtectedRoute requiredRole="admin"><AdminMessPage /></ProtectedRoute>} />
                  <Route path="/admin/coupon" element={<ProtectedRoute requiredRole="admin"><AdminCouponPage /></ProtectedRoute>} />
                  <Route path="/admin/helpdesk" element={<ProtectedRoute requiredRole="admin"><AdminHelpDeskPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

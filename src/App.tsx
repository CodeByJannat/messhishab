import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MemberAuthProvider } from "@/contexts/MemberAuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MemberProtectedRoute } from "@/components/auth/MemberProtectedRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Static Pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const RefundPage = lazy(() => import("./pages/RefundPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));

// Manager Dashboard
const ManagerDashboard = lazy(() => import("./pages/dashboard/ManagerDashboard"));
const MembersPage = lazy(() => import("./pages/dashboard/MembersPage"));
const MealsPage = lazy(() => import("./pages/dashboard/MealsPage"));
const BazarPage = lazy(() => import("./pages/dashboard/BazarPage"));
const DepositsPage = lazy(() => import("./pages/dashboard/DepositsPage"));
const BalancePage = lazy(() => import("./pages/dashboard/BalancePage"));
const AdditionalCostsPage = lazy(() => import("./pages/dashboard/AdditionalCostsPage"));
const NotificationsPage = lazy(() => import("./pages/dashboard/NotificationsPage"));

const SubscriptionPage = lazy(() => import("./pages/dashboard/SubscriptionPage"));
const PaymentPage = lazy(() => import("./pages/dashboard/PaymentPage"));
const PaymentHistoryPage = lazy(() => import("./pages/dashboard/PaymentHistoryPage"));
const ManagerHelpDeskPage = lazy(() => import("./pages/dashboard/ManagerHelpDeskPage"));

// Member Dashboard
const MemberDashboard = lazy(() => import("./pages/member/MemberDashboard"));
const MemberMealsPage = lazy(() => import("./pages/member/MemberMealsPage"));
const MemberBazarPage = lazy(() => import("./pages/member/MemberBazarPage"));
const MemberDepositsPage = lazy(() => import("./pages/member/MemberDepositsPage"));
const MemberNotificationsPage = lazy(() => import("./pages/member/MemberNotificationsPage"));
const MemberContactPage = lazy(() => import("./pages/member/MemberContactPage"));

// Admin Dashboard
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSubscriptionPage = lazy(() => import("./pages/admin/AdminSubscriptionPage"));
const AdminMessPage = lazy(() => import("./pages/admin/AdminMessPage"));
const AdminCouponPage = lazy(() => import("./pages/admin/AdminCouponPage"));
const AdminHelpDeskPage = lazy(() => import("./pages/admin/AdminHelpDeskPage"));
const AdminMessagesPage = lazy(() => import("./pages/admin/AdminMessagesPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback - skeletons handle the real loading UX
const PageLoader = () => (
  <div className="min-h-screen bg-background" />
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <MemberAuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <Suspense fallback={<PageLoader />}>
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
                      <Route path="/manager/dashboard" element={<ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>} />
                      <Route path="/manager/members" element={<ProtectedRoute requiredRole="manager"><MembersPage /></ProtectedRoute>} />
                      <Route path="/manager/meals" element={<ProtectedRoute requiredRole="manager"><MealsPage /></ProtectedRoute>} />
                      <Route path="/manager/bazar" element={<ProtectedRoute requiredRole="manager"><BazarPage /></ProtectedRoute>} />
                      <Route path="/manager/deposits" element={<ProtectedRoute requiredRole="manager"><DepositsPage /></ProtectedRoute>} />
                      <Route path="/manager/balance" element={<ProtectedRoute requiredRole="manager"><BalancePage /></ProtectedRoute>} />
                      <Route path="/manager/notifications" element={<ProtectedRoute requiredRole="manager"><NotificationsPage /></ProtectedRoute>} />
                      <Route path="/manager/additional-costs" element={<ProtectedRoute requiredRole="manager"><AdditionalCostsPage /></ProtectedRoute>} />
                      <Route path="/manager/subscription" element={<ProtectedRoute requiredRole="manager"><SubscriptionPage /></ProtectedRoute>} />
                      <Route path="/manager/payment" element={<ProtectedRoute requiredRole="manager"><PaymentPage /></ProtectedRoute>} />
                      <Route path="/manager/payment-history" element={<ProtectedRoute requiredRole="manager"><PaymentHistoryPage /></ProtectedRoute>} />
                      <Route path="/manager/helpdesk" element={<ProtectedRoute requiredRole="manager"><ManagerHelpDeskPage /></ProtectedRoute>} />
                      {/* Member Dashboard Routes */}
                      <Route path="/member/dashboard" element={<MemberProtectedRoute><MemberDashboard /></MemberProtectedRoute>} />
                      <Route path="/member/meals" element={<MemberProtectedRoute><MemberMealsPage /></MemberProtectedRoute>} />
                      <Route path="/member/bazar" element={<MemberProtectedRoute><MemberBazarPage /></MemberProtectedRoute>} />
                      <Route path="/member/deposits" element={<MemberProtectedRoute><MemberDepositsPage /></MemberProtectedRoute>} />
                      <Route path="/member/notifications" element={<MemberProtectedRoute><MemberNotificationsPage /></MemberProtectedRoute>} />
                      <Route path="/member/contact" element={<MemberProtectedRoute><MemberContactPage /></MemberProtectedRoute>} />
                      {/* Admin Dashboard Routes */}
                      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                      <Route path="/admin/subscription" element={<ProtectedRoute requiredRole="admin"><AdminSubscriptionPage /></ProtectedRoute>} />
                      <Route path="/admin/mess" element={<ProtectedRoute requiredRole="admin"><AdminMessPage /></ProtectedRoute>} />
                      <Route path="/admin/coupon" element={<ProtectedRoute requiredRole="admin"><AdminCouponPage /></ProtectedRoute>} />
                      <Route path="/admin/helpdesk" element={<ProtectedRoute requiredRole="admin"><AdminHelpDeskPage /></ProtectedRoute>} />
                      <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminMessagesPage /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </MemberAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

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
// Member Dashboard
import MemberDashboard from "./pages/member/MemberDashboard";
import MemberBazarPage from "./pages/member/MemberBazarPage";
import MemberNotificationsPage from "./pages/member/MemberNotificationsPage";
import MemberContactPage from "./pages/member/MemberContactPage";

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
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* Manager Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
                  <Route path="/dashboard/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/bazar" element={<ProtectedRoute><BazarPage /></ProtectedRoute>} />
                  <Route path="/dashboard/deposits" element={<ProtectedRoute><DepositsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/balance" element={<ProtectedRoute><BalancePage /></ProtectedRoute>} />
                  <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/pins" element={<ProtectedRoute><PinRecordsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                  <Route path="/dashboard/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                  {/* Member Dashboard Routes */}
                  <Route path="/member" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
                  <Route path="/member/bazar" element={<ProtectedRoute><MemberBazarPage /></ProtectedRoute>} />
                  <Route path="/member/notifications" element={<ProtectedRoute><MemberNotificationsPage /></ProtectedRoute>} />
                  <Route path="/member/contact" element={<ProtectedRoute><MemberContactPage /></ProtectedRoute>} />
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

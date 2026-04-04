import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "./components/shared/BottomNav";
import InstallPrompt from "./components/InstallPrompt";
import SplashScreen from "./pages/SplashScreen";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import SellCard from "./pages/SellCard";
import TradeSubmitted from "./pages/TradeSubmitted";
import TradesPage from "./pages/TradesPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
import ReferralsPage from "./pages/ReferralsPage";
import SupportPage from "./pages/SupportPage";
import ForgotPassword from "./pages/ForgotPassword";
import NotificationsPage from "./pages/NotificationsPage";
import KycPage from "./pages/KycPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ChangePinPage from "./pages/ChangePinPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import { AdminGuard } from "./components/admin/AdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTrades from "./pages/admin/AdminTrades";
import AdminRates from "./pages/admin/AdminRates";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSupport from "./pages/admin/AdminSupport";

const queryClient = new QueryClient();

const showBottomNav = ["/dashboard", "/sell", "/wallet", "/profile", "/trades", "/referrals", "/support"];

const AppLayout = () => {
  const location = useLocation();
  const hasBottomNav = showBottomNav.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/sell" element={<ProtectedRoute><SellCard /></ProtectedRoute>} />
        <Route path="/trade-submitted" element={<ProtectedRoute><TradeSubmitted /></ProtectedRoute>} />
        <Route path="/trades" element={<ProtectedRoute><TradesPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute><KycPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/change-pin" element={<ProtectedRoute><ChangePinPage /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="trades" element={<AdminTrades />} />
          <Route path="rates" element={<AdminRates />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {hasBottomNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

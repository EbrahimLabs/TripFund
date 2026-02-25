import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { TripProvider } from "@/context/TripContext";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import TripDashboard from "./pages/TripDashboard";
import AddDeposit from "./pages/AddDeposit";
import AddExpense from "./pages/AddExpense";
import SettlementPage from "./pages/SettlementPage";
import SummaryPage from "./pages/SummaryPage";
import AccountPage from "./pages/AccountPage";
import InvitePage from "./pages/InvitePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<ProtectedRoute><InvitePage /></ProtectedRoute>} />
            <Route path="/*" element={
              <ProtectedRoute>
                <TripProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/dashboard" element={<TripDashboard />} />
                    <Route path="/deposit" element={<AddDeposit />} />
                    <Route path="/expense" element={<AddExpense />} />
                    <Route path="/settle" element={<SettlementPage />} />
                    <Route path="/summary" element={<SummaryPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TripProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

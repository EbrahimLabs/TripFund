import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TripProvider } from "@/context/TripContext";
import Index from "./pages/Index";
import TripDashboard from "./pages/TripDashboard";
import AddDeposit from "./pages/AddDeposit";
import AddExpense from "./pages/AddExpense";
import SettlementPage from "./pages/SettlementPage";
import SummaryPage from "./pages/SummaryPage";
import ManageCategories from "./pages/ManageCategories";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TripProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<TripDashboard />} />
            <Route path="/deposit" element={<AddDeposit />} />
            <Route path="/expense" element={<AddExpense />} />
            <Route path="/settle" element={<SettlementPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/categories" element={<ManageCategories />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TripProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

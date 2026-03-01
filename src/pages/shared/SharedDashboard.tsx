import { useSharedTrip } from "@/context/SharedTripContext";
import { useNavigate } from "react-router-dom";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { DashboardContent } from "@/components/DashboardContent";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function SharedDashboard() {
  const { trip, loading, error, getStats, getMemberBalances, getDailyExpenses, getCategoryBreakdown } = useSharedTrip();
  const navigate = useNavigate();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading trip...</div>
    </div>
  );

  if (error || !trip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg px-4">
      <Card className="bg-card shadow-sm border-0 rounded-2xl max-w-sm w-full">
        <CardContent className="p-5 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error || "Trip not found"}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardContent
      trip={trip}
      stats={getStats()}
      balances={getMemberBalances()}
      dailyExpenses={getDailyExpenses()}
      categoryBreakdown={getCategoryBreakdown()}
      bottomNav={<SharedBottomNav />}
      onMemberClick={(memberId) => navigate(`../member/${memberId}`)}
    />
  );
}

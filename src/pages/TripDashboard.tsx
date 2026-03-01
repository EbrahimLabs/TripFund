import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { DashboardContent } from "@/components/DashboardContent";

export default function TripDashboard() {
  const {
    activeTrip, getStats, getMemberBalances,
    getDailyExpenses, getCategoryBreakdown, loading,
  } = useTrip();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !activeTrip) navigate("/");
  }, [activeTrip, loading, navigate]);

  if (!activeTrip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
    </div>
  );

  return (
    <DashboardContent
      trip={activeTrip}
      stats={getStats()}
      balances={getMemberBalances()}
      dailyExpenses={getDailyExpenses()}
      categoryBreakdown={getCategoryBreakdown()}
      bottomNav={<BottomNav />}
      onMemberClick={(memberId) => navigate(`/member/${memberId}`)}
      emptyStateExtra="Start by adding a deposit or expense!"
    />
  );
}

import { useSharedTrip } from "@/context/SharedTripContext";
import { PageShell } from "@/components/PageShell";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { SettlementContent } from "@/components/SettlementContent";

export default function SharedSettle() {
  const { token } = useParams<{ token: string }>();
  const { trip, loading, error, getSettlements, getMemberName } = useSharedTrip();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
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
    <>
      <PageShell title="Settlement" backTo={`/shared/${token}/dashboard`}>
        <SettlementContent
          trip={trip}
          settlements={getSettlements()}
          getMemberName={getMemberName}
        />
      </PageShell>
      <SharedBottomNav />
    </>
  );
}

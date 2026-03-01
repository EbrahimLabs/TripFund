import { useMemo } from "react";
import { useSharedTrip } from "@/context/SharedTripContext";
import { useParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SummaryContent } from "@/components/SummaryContent";

export default function SharedSummary() {
  const { token } = useParams<{ token: string }>();
  const { trip, loading, error, getStats, getMemberName } = useSharedTrip();

  const allTx = useMemo(() => {
    if (!trip) return [];
    return [...trip.transactions].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [trip]);

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

  const stats = getStats();

  const handleShare = () => {
    let text = `📊 ${trip.name} — Trip Summary\n`;
    text += `Currency: ${trip.currency}\n\n`;
    text += `💰 Total Deposited: ${stats.totalDeposited.toFixed(2)}\n`;
    text += `💸 Total Spent: ${stats.totalSpent.toFixed(2)}\n`;
    text += `📦 Balance: ${stats.balance.toFixed(2)}\n`;

    if (navigator.share) {
      navigator.share({ title: `${trip.name} Summary`, text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard!");
    }
  };

  return (
    <>
      <PageShell
        title="Summary"
        backTo={`/shared/${token}/dashboard`}
        action={
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        }
      >
        <div className="space-y-4">
          <SummaryContent
            trip={trip}
            transactions={allTx}
            getMemberName={getMemberName}
          />
        </div>
      </PageShell>
      <SharedBottomNav />
    </>
  );
}

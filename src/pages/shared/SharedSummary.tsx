import { useMemo } from "react";
import { useSharedTrip } from "@/context/SharedTripContext";
import { useParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ArrowDownCircle, ArrowUpCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FundManagerBadge } from "@/components/FundManagerBadge";

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

  const txByDate: Record<string, typeof allTx> = {};
  allTx.forEach((tx) => {
    if (!txByDate[tx.date]) txByDate[tx.date] = [];
    txByDate[tx.date].push(tx);
  });
  const sortedDates = Object.keys(txByDate).sort((a, b) => b.localeCompare(a));

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
          {allTx.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {sortedDates.map((date) => (
                <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </h3>
                  {txByDate[date].map((tx) => {
                    const isDeposit = tx.type === "deposit";
                    return (
                      <Card key={tx.id} className="bg-card shadow-sm border-0 rounded-2xl">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {isDeposit ? (
                              <ArrowDownCircle className="h-4 w-4 text-deposit shrink-0" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4 text-expense shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate flex items-center gap-1">
                                {isDeposit
                                  ? <><span>{getMemberName(tx.memberId!)}</span>{trip.fundManagerId === tx.memberId && <FundManagerBadge />}</>
                                  : `${tx.category}${tx.subcategory ? ` · ${tx.subcategory}` : ""}`}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {tx.note || (isDeposit ? "Deposit" : `Split: ${tx.splits?.length || 0} members`)}
                              </p>
                            </div>
                            <span className={cn("font-display font-bold text-sm shrink-0", isDeposit ? "text-deposit" : "text-expense")}>
                              {isDeposit ? "+" : "-"}{tx.amount.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

        </div>
      </PageShell>
      <SharedBottomNav />
    </>
  );
}

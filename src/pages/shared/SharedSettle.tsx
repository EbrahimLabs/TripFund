import { useSharedTrip } from "@/context/SharedTripContext";
import { PageShell } from "@/components/PageShell";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, PartyPopper, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import { useParams } from "react-router-dom";

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
      <Card className="glass card-elevated border-0 max-w-sm w-full">
        <CardContent className="p-5 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error || "Trip not found"}</p>
        </CardContent>
      </Card>
    </div>
  );

  const settlements = getSettlements();

  return (
    <>
      <PageShell title="Settlement" backTo={`/shared/${token}/dashboard`}>
        {settlements.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
              <PartyPopper className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">All settled up! 🎉</p>
            <p className="text-xs text-muted-foreground">No outstanding balances.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {settlements.length} transaction{settlements.length > 1 ? "s" : ""} to settle:
            </p>
            <AnimatePresence>
              {settlements.map((s, i) => (
                <motion.div key={`${s.fromId}_${s.toId}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card className="glass card-elevated border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-display font-semibold inline-flex items-center gap-1">
                            {getMemberName(s.fromId)}
                            {trip.fundManagerId === s.fromId && <FundManagerBadge />}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-display font-semibold inline-flex items-center gap-1">
                            {getMemberName(s.toId)}
                            {trip.fundManagerId === s.toId && <FundManagerBadge />}
                          </span>
                        </div>
                        <p className="text-lg font-display font-bold gradient-text mt-0.5">
                          {trip.currency} {s.amount.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </PageShell>
      <SharedBottomNav />
    </>
  );
}

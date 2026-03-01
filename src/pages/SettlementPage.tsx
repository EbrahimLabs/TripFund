import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, PartyPopper, Wallet, Undo2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import { toast } from "sonner";
import type { Settlement } from "@/types/trip";

const SETTLEMENT_COMPLETED_KEY = "tripfund_settlement_completed";

/** Track which settlements have been paid (their deposits still exist) */
function loadCompletedKeys(tripId: string): Set<string> {
  try {
    const data = localStorage.getItem(SETTLEMENT_COMPLETED_KEY);
    const all = data ? JSON.parse(data) : {};
    return new Set(all[tripId] || []);
  } catch { return new Set(); }
}

function saveCompletedKeys(tripId: string, keys: Set<string>) {
  try {
    const data = localStorage.getItem(SETTLEMENT_COMPLETED_KEY);
    const all = data ? JSON.parse(data) : {};
    all[tripId] = Array.from(keys);
    localStorage.setItem(SETTLEMENT_COMPLETED_KEY, JSON.stringify(all));
  } catch { }
}

/** Store info about completed settlements so we can show them */
function loadCompletedSettlements(tripId: string): Settlement[] {
  try {
    const data = localStorage.getItem(SETTLEMENT_COMPLETED_KEY + "_data");
    const all = data ? JSON.parse(data) : {};
    return all[tripId] || [];
  } catch { return []; }
}

function saveCompletedSettlements(tripId: string, settlements: Settlement[]) {
  try {
    const data = localStorage.getItem(SETTLEMENT_COMPLETED_KEY + "_data");
    const all = data ? JSON.parse(data) : {};
    all[tripId] = settlements;
    localStorage.setItem(SETTLEMENT_COMPLETED_KEY + "_data", JSON.stringify(all));
  } catch { }
}

export default function SettlementPage() {
  const {
    activeTrip, getSettlements, getMemberName, loading,
    markSettlementPaid, unmarkSettlementPaid, getSettlementTxMap,
  } = useTrip();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<string | null>(null);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [completedData, setCompletedData] = useState<Settlement[]>([]);

  useEffect(() => {
    if (!loading && !activeTrip) navigate("/");
    else if (activeTrip) {
      setCompletedKeys(loadCompletedKeys(activeTrip.id));
      setCompletedData(loadCompletedSettlements(activeTrip.id));
    }
  }, [activeTrip, loading, navigate]);

  if (!activeTrip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
    </div>
  );

  const activeSettlements = getSettlements();
  const getKey = (s: { fromId: string; toId: string }) => `${s.fromId}_${s.toId}`;

  // Completed settlements that are no longer in active list (because deposit was added)
  const completedSettlements = completedData.filter(
    (cs) => !activeSettlements.some((a) => getKey(a) === getKey(cs))
  );

  const totalActive = activeSettlements.length;
  const totalCompleted = completedSettlements.length;

  const handleMarkPaid = async (s: Settlement) => {
    const key = getKey(s);
    setProcessing(key);
    try {
      await markSettlementPaid(s.fromId, s.toId, s.amount);

      // Save to completed tracking
      const newKeys = new Set(completedKeys);
      newKeys.add(key);
      setCompletedKeys(newKeys);
      saveCompletedKeys(activeTrip.id, newKeys);

      const newData = [...completedData.filter((c) => getKey(c) !== key), s];
      setCompletedData(newData);
      saveCompletedSettlements(activeTrip.id, newData);

      toast.success("Settlement marked as paid — deposit added!");
    } catch {
      toast.error("Failed to mark as paid");
    }
    setProcessing(null);
  };

  const handleUnmark = async (s: Settlement) => {
    const key = getKey(s);
    setProcessing(key);
    try {
      await unmarkSettlementPaid(s.fromId, s.toId);

      // Remove from completed tracking
      const newKeys = new Set(completedKeys);
      newKeys.delete(key);
      setCompletedKeys(newKeys);
      saveCompletedKeys(activeTrip.id, newKeys);

      const newData = completedData.filter((c) => getKey(c) !== key);
      setCompletedData(newData);
      saveCompletedSettlements(activeTrip.id, newData);

      toast.success("Settlement unmarked — deposit removed");
    } catch {
      toast.error("Failed to unmark settlement");
    }
    setProcessing(null);
  };

  const isSelfSettlement = (s: Settlement) => s.fromId === s.toId;

  const renderSettlementCard = (s: Settlement, i: number, isCompleted: boolean) => {
    const key = getKey(s);
    const isProcessing = processing === key;
    const isSelf = isSelfSettlement(s);

    return (
      <motion.div
        key={key + (isCompleted ? "_done" : "")}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: i * 0.06 }}
      >
        <Card className={cn(
          "bg-card shadow-sm border-0 rounded-2xl transition-all duration-300",
          isCompleted && "opacity-60 scale-[0.98]",
          isSelf && !isCompleted && "border border-dashed border-primary/30"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {isSelf ? (
                /* Fund manager self-settlement */
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-display font-semibold inline-flex items-center gap-1">
                    {getMemberName(s.fromId)}
                    <FundManagerBadge />
                  </span>
                  <span className="text-xs text-muted-foreground">owes the fund</span>
                </div>
              ) : (
                /* Normal settlement: from → to */
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-display font-semibold inline-flex items-center gap-1">
                    {getMemberName(s.fromId)}
                    {activeTrip.fundManagerId === s.fromId && <FundManagerBadge />}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-display font-semibold inline-flex items-center gap-1">
                    {getMemberName(s.toId)}
                    {activeTrip.fundManagerId === s.toId && <FundManagerBadge />}
                  </span>
                </div>
              )}

              <p className={cn(
                "text-lg font-display font-bold mt-0.5",
                isCompleted ? "text-muted-foreground line-through" : "gradient-text"
              )}>
                {activeTrip.currency} {s.amount.toFixed(2)}
              </p>

              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-deposit mt-1">
                  <Check className="h-3 w-3" />
                  Paid
                </span>
              )}
            </div>

            {isCompleted ? (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl glass transition-all hover:border-destructive hover:text-destructive"
                onClick={() => handleUnmark(s)}
                disabled={isProcessing}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl glass transition-all hover:gradient-primary hover:border-0 hover:text-primary-foreground hover:glow-sm"
                onClick={() => handleMarkPaid(s)}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <>
      <PageShell title="Settlement" backTo="/dashboard">
        {!activeTrip.fundManagerId ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-display font-medium">No fund manager assigned</p>
            <p className="text-xs text-muted-foreground">Assign a fund manager in Settings to see settlements.</p>
          </motion.div>
        ) : totalActive === 0 && totalCompleted === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
              <PartyPopper className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground font-display font-medium">All settled up!</p>
            <p className="text-xs text-muted-foreground">No outstanding balances.</p>
          </motion.div>
        ) : (
          <div className="space-y-5 pb-4">
            {/* Active Settlements */}
            {totalActive > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Outstanding ({totalActive})
                </h2>
                <AnimatePresence>
                  {activeSettlements.map((s, i) => renderSettlementCard(s, i, false))}
                </AnimatePresence>
              </div>
            )}

            {/* Completed Settlements */}
            {totalCompleted > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Completed ({totalCompleted})
                </h2>
                <AnimatePresence>
                  {completedSettlements.map((s, i) => renderSettlementCard(s, i, true))}
                </AnimatePresence>
              </div>
            )}

            {totalActive === 0 && totalCompleted > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                <p className="text-sm font-display font-medium text-deposit">All settlements completed!</p>
              </motion.div>
            )}
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

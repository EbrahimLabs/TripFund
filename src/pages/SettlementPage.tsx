import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Check, Wallet, Undo2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Settlement } from "@/types/trip";
import { SettlementContent } from "@/components/SettlementContent";

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

  // Determine if we should show custom empty state
  const noFundManager = !activeTrip.fundManagerId;
  const allDone = totalActive === 0 && totalCompleted === 0;

  const emptyStateOverride = noFundManager ? (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-3">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-display font-medium">No fund manager assigned</p>
      <p className="text-xs text-muted-foreground">Assign a fund manager in Settings to see settlements.</p>
    </motion.div>
  ) : undefined;

  // Build completed settlements section
  const completedSection = totalCompleted > 0 ? (
    <div className="space-y-3">
      <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5" />
        Completed ({totalCompleted})
      </h2>
      <SettlementContent
        trip={activeTrip}
        settlements={completedSettlements.map(s => ({ ...s, completed: true }))}
        getMemberName={getMemberName}
        renderCardAction={(s) => {
          const key = getKey(s);
          const isProcessing = processing === key;
          return (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl glass transition-all hover:border-destructive hover:text-destructive"
              onClick={() => handleUnmark(s)}
              disabled={isProcessing}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          );
        }}
        renderCardExtra={(s) => (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-deposit mt-1">
            <Check className="h-3 w-3" />
            Paid
          </span>
        )}
        getCardClassName={() => "opacity-60 scale-[0.98]"}
        listLabel={<></>}
      />
      {totalActive === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
          <p className="text-sm font-display font-medium text-deposit">All settlements completed!</p>
        </motion.div>
      )}
    </div>
  ) : null;

  return (
    <>
      <PageShell title="Settlement" backTo="/dashboard">
        <SettlementContent
          trip={activeTrip}
          settlements={activeSettlements}
          getMemberName={getMemberName}
          emptyStateOverride={emptyStateOverride}
          renderCardAction={(s) => {
            const key = getKey(s);
            const isProcessing = processing === key;
            const isSelf = isSelfSettlement(s);
            return (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl glass transition-all hover:gradient-primary hover:border-0 hover:text-primary-foreground hover:glow-sm"
                onClick={() => handleMarkPaid(s)}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4" />
              </Button>
            );
          }}
          getCardClassName={(s) => {
            const isSelf = s.fromId === s.toId;
            return isSelf ? "border border-dashed border-primary/30" : "";
          }}
          listLabel={
            totalActive > 0 ? (
              <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Outstanding ({totalActive})
              </h2>
            ) : undefined
          }
          additionalContent={completedSection}
        />
      </PageShell>
      <BottomNav />
    </>
  );
}

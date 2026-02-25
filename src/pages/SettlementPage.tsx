import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import { toast } from "sonner";

const SETTLEMENT_KEY = "tripfund_settlements_completed";

function loadCompleted(tripId: string): Set<string> {
  try {
    const data = localStorage.getItem(SETTLEMENT_KEY);
    const all = data ? JSON.parse(data) : {};
    return new Set(all[tripId] || []);
  } catch {
    return new Set();
  }
}

function saveCompleted(tripId: string, completed: Set<string>) {
  try {
    const data = localStorage.getItem(SETTLEMENT_KEY);
    const all = data ? JSON.parse(data) : {};
    all[tripId] = Array.from(completed);
    localStorage.setItem(SETTLEMENT_KEY, JSON.stringify(all));
  } catch {}
}

export default function SettlementPage() {
  const { activeTrip, getSettlements, getMemberName } = useTrip();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeTrip) navigate("/");
    else setCompleted(loadCompleted(activeTrip.id));
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const settlements = getSettlements();
  const allCompleted = settlements.length > 0 && completed.size === settlements.length;

  const getKey = (s: typeof settlements[0]) => `${s.fromId}_${s.toId}`;

  const toggleComplete = (key: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      saveCompleted(activeTrip.id, next);
      if (!prev.has(key)) toast.success("Marked as paid!");
      return next;
    });
  };

  return (
    <>
      <PageShell title="Settlement">
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
              {allCompleted ? "✅ All settlements marked as completed!" : `${settlements.length} transaction${settlements.length > 1 ? "s" : ""} to settle:`}
            </p>
            <AnimatePresence>
              {settlements.map((s, i) => {
                const key = getKey(s);
                return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card
                    className={cn(
                      "glass card-elevated border-0 transition-all duration-300",
                      completed.has(key) && "opacity-50 scale-[0.98]"
                    )}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-display font-semibold inline-flex items-center gap-1">
                            {getMemberName(s.fromId)}
                            {activeTrip.fundManagerId === s.fromId && <FundManagerBadge />}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-display font-semibold inline-flex items-center gap-1">
                            {getMemberName(s.toId)}
                            {activeTrip.fundManagerId === s.toId && <FundManagerBadge />}
                          </span>
                        </div>
                        <p className="text-lg font-display font-bold gradient-text mt-0.5">
                          {activeTrip.currency} {s.amount.toFixed(2)}
                        </p>
                        {completed.has(key) && (
                          <p className="text-xs text-muted-foreground mt-0.5">✅ Paid</p>
                        )}
                      </div>
                      <Button
                        variant={completed.has(key) ? "default" : "outline"}
                        size="icon"
                        className={cn("h-10 w-10 shrink-0 transition-all rounded-xl", completed.has(key) && "gradient-primary glow-sm border-0")}
                        onClick={() => toggleComplete(key)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

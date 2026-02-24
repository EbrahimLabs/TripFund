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

export default function SettlementPage() {
  const { activeTrip, getSettlements, getMemberName } = useTrip();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!activeTrip) navigate("/");
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const settlements = getSettlements();
  const allCompleted = settlements.length > 0 && completed.size === settlements.length;

  const toggleComplete = (i: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <>
      <PageShell title="Settlement">
        {settlements.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
              <PartyPopper className="h-6 w-6 text-primary" />
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
              {settlements.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card
                    className={cn(
                      "transition-all duration-300",
                      completed.has(i) && "opacity-50 scale-[0.98]"
                    )}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-display font-semibold">{getMemberName(s.fromId)}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-display font-semibold">{getMemberName(s.toId)}</span>
                        </div>
                        <p className="text-lg font-display font-bold text-primary mt-0.5">
                          {activeTrip.currency} {s.amount.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant={completed.has(i) ? "default" : "outline"}
                        size="icon"
                        className={cn("h-10 w-10 shrink-0 transition-all", completed.has(i) && "bg-primary")}
                        onClick={() => toggleComplete(i)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

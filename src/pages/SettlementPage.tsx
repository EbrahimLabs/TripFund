import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettlementPage() {
  const { activeTrip, getSettlements, getMemberName } = useTrip();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!activeTrip) navigate("/");
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const settlements = getSettlements();
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">All settled up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Minimum transactions to settle all balances:
            </p>
            {settlements.map((s, i) => (
              <Card
                key={i}
                className={cn(
                  "transition-all",
                  completed.has(i) && "opacity-50"
                )}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-display font-semibold">{getMemberName(s.fromId)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-display font-semibold">{getMemberName(s.toId)}</span>
                    </div>
                    <p className="text-base font-display font-bold text-primary mt-0.5">
                      {activeTrip.currency} {s.amount.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant={completed.has(i) ? "default" : "outline"}
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => toggleComplete(i)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

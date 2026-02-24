import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TripDashboard() {
  const { activeTrip, getStats, getMemberBalances, setActiveTripId } = useTrip();
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeTrip) navigate("/");
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const stats = getStats();
  const balances = getMemberBalances();

  return (
    <>
      <PageShell
        title={activeTrip.name}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setActiveTripId(null); navigate("/"); }}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-3 text-center">
              <ArrowDownCircle className="h-4 w-4 text-deposit mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Deposited</p>
              <p className="text-sm font-display font-bold">{activeTrip.currency} {stats.totalDeposited.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/10">
            <CardContent className="p-3 text-center">
              <ArrowUpCircle className="h-4 w-4 text-expense mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-sm font-display font-bold">{activeTrip.currency} {stats.totalSpent.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-secondary">
            <CardContent className="p-3 text-center">
              <Wallet className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-sm font-display font-bold">{activeTrip.currency} {stats.balance.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Member balances */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Members</h2>
          {balances.map((b) => (
            <Card key={b.member.id} className="animate-slide-up">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-semibold text-sm">{b.member.name}</span>
                  <span
                    className={cn(
                      "font-display font-bold text-sm",
                      b.net > 0.01 ? "text-deposit" : b.net < -0.01 ? "text-expense" : "text-muted-foreground"
                    )}
                  >
                    {b.net > 0 ? "+" : ""}{activeTrip.currency} {b.net.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Deposited: {activeTrip.currency} {b.deposited.toFixed(0)}</span>
                  <span>Share: {activeTrip.currency} {b.expenseShare.toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

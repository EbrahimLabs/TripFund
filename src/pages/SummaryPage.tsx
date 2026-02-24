import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SummaryPage() {
  const { activeTrip, getStats, getSettlements, getMemberName, deleteTransaction } = useTrip();
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeTrip) navigate("/");
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const stats = getStats();
  const settlements = getSettlements();
  const deposits = activeTrip.transactions.filter((t) => t.type === "deposit");
  const expenses = activeTrip.transactions.filter((t) => t.type === "expense");

  const handleShare = () => {
    let text = `📊 ${activeTrip.name} — Trip Summary\n`;
    text += `Currency: ${activeTrip.currency}\n\n`;
    text += `💰 Total Deposited: ${stats.totalDeposited.toFixed(2)}\n`;
    text += `💸 Total Spent: ${stats.totalSpent.toFixed(2)}\n`;
    text += `📦 Balance: ${stats.balance.toFixed(2)}\n\n`;

    if (deposits.length) {
      text += `--- Deposits ---\n`;
      deposits.forEach((d) => {
        text += `• ${getMemberName(d.memberId!)} — ${d.amount.toFixed(2)}${d.note ? ` (${d.note})` : ""}\n`;
      });
      text += "\n";
    }

    if (expenses.length) {
      text += `--- Expenses ---\n`;
      expenses.forEach((e) => {
        text += `• ${e.category}: ${e.amount.toFixed(2)}${e.note ? ` (${e.note})` : ""}\n`;
      });
      text += "\n";
    }

    if (settlements.length) {
      text += `--- Settlements ---\n`;
      settlements.forEach((s) => {
        text += `• ${getMemberName(s.fromId)} → ${getMemberName(s.toId)}: ${s.amount.toFixed(2)}\n`;
      });
    }

    if (navigator.share) {
      navigator.share({ title: `${activeTrip.name} Summary`, text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard!");
    }
  };

  return (
    <>
      <PageShell
        title="Summary"
        action={
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Deposits */}
          <div>
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Deposits ({deposits.length})
            </h2>
            {deposits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deposits yet.</p>
            ) : (
              <div className="space-y-1.5">
                {deposits.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <ArrowDownCircle className="h-4 w-4 text-deposit shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getMemberName(d.memberId!)}</p>
                        <p className="text-xs text-muted-foreground">{d.date}{d.note ? ` · ${d.note}` : ""}</p>
                      </div>
                      <span className="font-display font-bold text-sm text-deposit">
                        +{d.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTransaction(d.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div>
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Expenses ({expenses.length})
            </h2>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <div className="space-y-1.5">
                {expenses.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <ArrowUpCircle className="h-4 w-4 text-expense shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {e.category}{e.note ? ` · ${e.note}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.date} · Split: {e.splits?.length || 0} members
                        </p>
                      </div>
                      <span className="font-display font-bold text-sm text-expense">
                        -{e.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTransaction(e.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Settlements */}
          {settlements.length > 0 && (
            <div>
              <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Settlements
              </h2>
              <div className="space-y-1.5">
                {settlements.map((s, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <p className="text-sm">
                        <span className="font-semibold">{getMemberName(s.fromId)}</span>
                        {" pays "}
                        <span className="font-semibold">{getMemberName(s.toId)}</span>
                        {" "}
                        <span className="font-display font-bold text-primary">
                          {activeTrip.currency} {s.amount.toFixed(2)}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

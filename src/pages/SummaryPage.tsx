import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Trash2, ArrowDownCircle, ArrowUpCircle, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Transaction } from "@/types/trip";

export default function SummaryPage() {
  const { activeTrip, getStats, getSettlements, getMemberName, deleteTransaction, updateTransaction } = useTrip();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [filter, setFilter] = useState<"all" | "deposit" | "expense">("all");

  useEffect(() => {
    if (!activeTrip) navigate("/");
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const stats = getStats();
  const settlements = getSettlements();

  const allTx = activeTrip.transactions
    .filter((t) => filter === "all" || t.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const deposits = activeTrip.transactions.filter((t) => t.type === "deposit");
  const expenses = activeTrip.transactions.filter((t) => t.type === "expense");

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditNote(tx.note);
  };

  const saveEdit = (tx: Transaction) => {
    const amt = parseFloat(editAmount);
    if (!amt || amt <= 0) return;

    const updates: Partial<Omit<Transaction, "id">> = {
      amount: amt,
      note: editNote,
    };

    // Recalculate splits if expense
    if (tx.type === "expense" && tx.splits) {
      const shareAmount = Math.round((amt / tx.splits.length) * 100) / 100;
      updates.splits = tx.splits.map((s) => ({ ...s, shareAmount }));
    }

    updateTransaction(tx.id, updates);
    setEditingId(null);
    toast.success("Transaction updated!");
  };

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
        const sub = e.subcategory ? ` > ${e.subcategory}` : "";
        text += `• ${e.category}${sub}: ${e.amount.toFixed(2)}${e.note ? ` (${e.note})` : ""}\n`;
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

  // Group transactions by date
  const txByDate: Record<string, typeof allTx> = {};
  allTx.forEach((tx) => {
    if (!txByDate[tx.date]) txByDate[tx.date] = [];
    txByDate[tx.date].push(tx);
  });
  const sortedDates = Object.keys(txByDate).sort((a, b) => b.localeCompare(a));

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
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-1.5 p-1 bg-secondary rounded-lg">
            {(["all", "deposit", "expense"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className="flex-1 text-xs capitalize h-7"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? `All (${activeTrip.transactions.length})` : f === "deposit" ? `Deposits (${deposits.length})` : `Expenses (${expenses.length})`}
              </Button>
            ))}
          </div>

          {/* Transactions by date */}
          {allTx.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {sortedDates.map((date) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5"
                >
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </h3>
                  {txByDate[date].map((tx) => {
                    const isDeposit = tx.type === "deposit";
                    const isEditing = editingId === tx.id;

                    return (
                      <Card key={tx.id}>
                        <CardContent className="p-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  className="h-8 text-sm flex-1"
                                  autoFocus
                                />
                                <Button size="sm" className="h-8" onClick={() => saveEdit(tx)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Note"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {isDeposit ? (
                                <ArrowDownCircle className="h-4 w-4 text-deposit shrink-0" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 text-expense shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {isDeposit
                                    ? getMemberName(tx.memberId!)
                                    : `${tx.category}${tx.subcategory ? ` · ${tx.subcategory}` : ""}`}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {tx.note || (isDeposit ? "Deposit" : `Split: ${tx.splits?.length || 0} members`)}
                                </p>
                              </div>
                              <span className={cn("font-display font-bold text-sm shrink-0", isDeposit ? "text-deposit" : "text-expense")}>
                                {isDeposit ? "+" : "-"}{tx.amount.toFixed(2)}
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => startEdit(tx)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this {tx.type} of {activeTrip.currency} {tx.amount.toFixed(2)}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => { deleteTransaction(tx.id); toast.success("Transaction deleted!"); }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Settlements */}
          {settlements.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
            </motion.div>
          )}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

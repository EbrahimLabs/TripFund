import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Trash2, Pencil, X, Check, Search, SlidersHorizontal, CalendarDays, User } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SummaryContent } from "@/components/SummaryContent";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function SummaryPage() {
  const { activeTrip, getStats, getSettlements, getMemberName, deleteTransaction, updateTransaction, isOwner, loading } = useTrip();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [filter, setFilter] = useState<"all" | "deposit" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const stats = getStats();
  const settlements = getSettlements();
  const deposits = activeTrip?.transactions.filter((t) => t.type === "deposit") ?? [];
  const expenses = activeTrip?.transactions.filter((t) => t.type === "expense") ?? [];

  const hasActiveFilters = searchQuery || memberFilter !== "all" || dateFrom || dateTo;

  const allTx = useMemo(() => {
    if (!activeTrip) return [];
    return activeTrip.transactions
      .filter((t) => {
        if (filter !== "all" && t.type !== filter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchNote = t.note?.toLowerCase().includes(q);
          const matchCategory = t.category?.toLowerCase().includes(q);
          const matchSubcategory = t.subcategory?.toLowerCase().includes(q);
          const matchMember = t.memberId ? getMemberName(t.memberId).toLowerCase().includes(q) : false;
          if (!matchNote && !matchCategory && !matchSubcategory && !matchMember) return false;
        }
        if (memberFilter !== "all") {
          if (t.type === "deposit" && t.memberId !== memberFilter) return false;
          if (t.type === "expense") {
            const involvedMember = t.splits?.some((s) => s.memberId === memberFilter);
            if (!involvedMember) return false;
          }
        }
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [activeTrip, filter, searchQuery, memberFilter, dateFrom, dateTo, getMemberName]);

  useEffect(() => {
    if (!loading && !activeTrip) navigate("/");
  }, [activeTrip, loading, navigate]);

  if (!activeTrip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
    </div>
  );

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditNote(tx.note);
  };

  const saveEdit = async (tx: any) => {
    const amt = parseFloat(editAmount);
    if (!amt || amt <= 0) return;

    const updates: any = {
      amount: amt,
      note: editNote,
    };

    // Recalculate splits if expense
    if (tx.type === "expense" && tx.splits) {
      const shareAmount = Math.round((amt / tx.splits.length) * 100) / 100;
      updates.splits = tx.splits.map((s: any) => ({ ...s, shareAmount }));
    }

    await updateTransaction(tx.id, updates);
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

  const renderActions = isOwner ? (tx: any) => {
    if (editingId === tx.id) return null; // handled separately in inline edit below
    return (
      <>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => startEdit(tx)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
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
                onClick={async () => { await deleteTransaction(tx.id); toast.success("Transaction deleted!"); }}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  } : undefined;

  return (
    <>
      <PageShell
        title="Summary"
        backTo="/dashboard"
        action={
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-1.5 p-1 bg-card shadow-sm rounded-xl">
            {(["all", "deposit", "expense"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className={`flex-1 text-xs capitalize h-7 ${filter === f ? "gradient-primary border-0" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? `All (${activeTrip.transactions.length})` : f === "deposit" ? `Deposits (${deposits.length})` : `Expenses (${expenses.length})`}
              </Button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search notes, categories, members…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm pl-8 pr-8 bg-card border-0 shadow-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className={`h-8 px-2.5 shrink-0 ${showFilters ? "gradient-primary border-0 shadow-sm text-white" : "bg-card border-0 shadow-sm text-muted-foreground"}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </Button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 p-3 bg-card shadow-sm rounded-xl">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Member
                      </Label>
                      <Select value={memberFilter} onValueChange={setMemberFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Members</SelectItem>
                          {[...activeTrip.members].sort((a, b) => (activeTrip.fundManagerId === a.id ? -1 : activeTrip.fundManagerId === b.id ? 1 : 0)).map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> From
                      </Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> To
                      </Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="col-span-2 h-7 text-xs text-muted-foreground"
                        onClick={() => { setSearchQuery(""); setMemberFilter("all"); setDateFrom(""); setDateTo(""); }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transaction list via shared component */}
          <SummaryContent
            trip={activeTrip}
            transactions={allTx}
            getMemberName={getMemberName}
            renderActions={renderActions}
            emptyMessage={hasActiveFilters ? "No transactions match your filters." : "No transactions yet."}
          />

          {hasActiveFilters && allTx.length === 0 && (
            <Button variant="link" size="sm" className="text-xs mt-1 w-full" onClick={() => { setSearchQuery(""); setMemberFilter("all"); setDateFrom(""); setDateTo(""); setFilter("all"); }}>
              Clear filters
            </Button>
          )}

        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

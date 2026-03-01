import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCategoryManager } from "@/hooks/useCategoryManager";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { FundManagerBadge } from "@/components/FundManagerBadge";

type SplitMode = "equal" | "unequal" | "percentage";

export default function AddExpense() {
  const { activeTrip, addTransaction, loading } = useTrip();
  const navigate = useNavigate();
  const { getCategoryNames, getSubcategories, addCategory, addSubcategory } = useCategoryManager();

  const categoryNames = getCategoryNames();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categoryNames[0] || "Food");
  const [subcategory, setSubcategory] = useState(getSubcategories(category)[0] || "");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState("");

  useEffect(() => {
    if (!loading && !activeTrip) navigate("/");
    else if (activeTrip) setSelectedMembers(activeTrip.members.map((m) => m.id));
  }, [activeTrip, loading, navigate]);

  useEffect(() => {
    setSubcategory(getSubcategories(category)[0] || "");
  }, [category, getSubcategories]);

  useEffect(() => {
    if (activeTrip) {
      const equalPct = selectedMembers.length > 0 ? (100 / selectedMembers.length).toFixed(1) : "0";
      const newPct: Record<string, string> = {};
      const newAmts: Record<string, string> = {};
      selectedMembers.forEach((id) => {
        newPct[id] = percentages[id] || equalPct;
        newAmts[id] = customAmounts[id] || "";
      });
      setPercentages(newPct);
      setCustomAmounts(newAmts);
    }
  }, [selectedMembers.length]);

  if (!activeTrip) return null;

  const toggleMember = (id: string) =>
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleAddCategory = () => {
    if (addCategory(newCategory)) {
      setCategory(newCategory.trim());
      setNewCategory("");
      setShowAddCat(false);
      toast.success("Category added!");
    } else {
      toast.error("Already exists or empty");
    }
  };

  const handleAddSubcategory = () => {
    if (addSubcategory(category, newSubcategory)) {
      setSubcategory(newSubcategory.trim());
      setNewSubcategory("");
      setShowAddSub(false);
      toast.success("Subcategory added!");
    } else {
      toast.error("Already exists or empty");
    }
  };

  const computeSplits = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || selectedMembers.length === 0) return null;

    if (splitMode === "equal") {
      const shareAmount = Math.round((amt / selectedMembers.length) * 100) / 100;
      return selectedMembers.map((mid) => ({ memberId: mid, shareAmount }));
    }

    if (splitMode === "unequal") {
      const total = selectedMembers.reduce((s, id) => s + (parseFloat(customAmounts[id] || "0")), 0);
      if (Math.abs(total - amt) > 0.01) return null;
      return selectedMembers.map((mid) => ({
        memberId: mid,
        shareAmount: Math.round(parseFloat(customAmounts[mid] || "0") * 100) / 100,
      }));
    }

    if (splitMode === "percentage") {
      const totalPct = selectedMembers.reduce((s, id) => s + (parseFloat(percentages[id] || "0")), 0);
      if (Math.abs(totalPct - 100) > 0.5) return null;
      return selectedMembers.map((mid) => ({
        memberId: mid,
        shareAmount: Math.round((amt * parseFloat(percentages[mid] || "0") / 100) * 100) / 100,
      }));
    }

    return null;
  };

  const getUnequalTotal = () =>
    selectedMembers.reduce((s, id) => s + (parseFloat(customAmounts[id] || "0")), 0);

  const getPercentageTotal = () =>
    selectedMembers.reduce((s, id) => s + (parseFloat(percentages[id] || "0")), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const splits = computeSplits();
    if (!splits) {
      if (splitMode === "unequal") toast.error("Custom amounts must equal the total!");
      else if (splitMode === "percentage") toast.error("Percentages must add up to 100%!");
      return;
    }

    setSubmitting(true);
    await addTransaction({
      type: "expense",
      amount: parseFloat(amount),
      date,
      note,
      category: category as any,
      subcategory,
      splits,
    });
    toast.success("Expense added!");
    setAmount("");
    setNote("");
    setSelectedMembers(activeTrip.members.map((m) => m.id));
    setSplitMode("equal");
    setSubmitting(false);
  };

  const amt = parseFloat(amount) || 0;

  const getShareDisplay = (memberId: string) => {
    if (splitMode === "equal" && amt > 0 && selectedMembers.length > 0) {
      return (amt / selectedMembers.length).toFixed(2);
    }
    if (splitMode === "unequal") {
      return parseFloat(customAmounts[memberId] || "0").toFixed(2);
    }
    if (splitMode === "percentage" && amt > 0) {
      return (amt * parseFloat(percentages[memberId] || "0") / 100).toFixed(2);
    }
    return "0.00";
  };

  return (
    <>
      <PageShell title="Add Expense" backTo="/dashboard">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="expAmount">Amount (BDT)</Label>
            <Input id="expAmount" type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" autoFocus className="text-2xl font-display font-bold h-14 glass" />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category</Label>
              <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2 gap-1" onClick={() => setShowAddCat((v) => !v)}><Plus className="h-3 w-3" /> Add</Button>
            </div>
            <AnimatePresence>
              {showAddCat && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-hidden">
                  <Input placeholder="New category..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="h-8 text-xs glass" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }} />
                  <Button type="button" size="sm" className="h-8 text-xs gradient-primary border-0" onClick={handleAddCategory}>Add</Button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap gap-1.5">
              {categoryNames.map((cat) => (
                <Button key={cat} type="button" variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)} className={`text-xs transition-all ${category === cat ? "gradient-primary glow-sm border-0" : "bg-card shadow-sm"}`}>{cat}</Button>
              ))}
            </div>
          </div>

          {/* Subcategory */}
          <AnimatePresence mode="wait">
            <motion.div key={category} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
              <div className="flex items-center justify-between">
                <Label>Subcategory</Label>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2 gap-1" onClick={() => setShowAddSub((v) => !v)}><Plus className="h-3 w-3" /> Add</Button>
              </div>
              <AnimatePresence>
                {showAddSub && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-hidden">
                    <Input placeholder="New subcategory..." value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} className="h-8 text-xs glass" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubcategory(); } }} />
                    <Button type="button" size="sm" className="h-8 text-xs gradient-primary border-0" onClick={handleAddSubcategory}>Add</Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex flex-wrap gap-1.5">
                {getSubcategories(category).map((sub) => (
                  <Button key={sub} type="button" variant={subcategory === sub ? "secondary" : "ghost"} size="sm" onClick={() => setSubcategory(sub)} className="text-xs h-7 px-2.5">{sub}</Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Split Mode */}
          <div className="space-y-2">
            <Label>Split Mode</Label>
            <div className="flex gap-1.5 p-1 bg-card shadow-sm rounded-2xl">
              {(["equal", "unequal", "percentage"] as const).map((mode) => (
                <Button key={mode} type="button" variant={splitMode === mode ? "default" : "ghost"} size="sm" className={`flex-1 text-xs capitalize h-7 ${splitMode === mode ? "gradient-primary border-0" : ""}`} onClick={() => setSplitMode(mode)}>
                  {mode === "percentage" ? "%" : mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Split among */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split among</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedMembers(activeTrip.members.map((m) => m.id))}>Select all</Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedMembers([])}>Clear</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {[...activeTrip.members].sort((a, b) => (activeTrip.fundManagerId === a.id ? -1 : activeTrip.fundManagerId === b.id ? 1 : 0)).map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <label key={m.id} className="flex items-center gap-3 rounded-xl glass p-3 cursor-pointer transition-all">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleMember(m.id)} />
                    <span className="text-sm font-medium flex-1 flex items-center gap-1.5">
                      {m.name}
                      {activeTrip.fundManagerId === m.id && <FundManagerBadge />}
                    </span>
                    {isSelected && splitMode === "unequal" && (
                      <Input type="number" inputMode="decimal" placeholder="0" value={customAmounts[m.id] || ""} onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))} className="h-7 w-20 text-xs text-right glass" onClick={(e) => e.stopPropagation()} />
                    )}
                    {isSelected && splitMode === "percentage" && (
                      <div className="flex items-center gap-1">
                        <Input type="number" inputMode="decimal" placeholder="0" value={percentages[m.id] || ""} onChange={(e) => setPercentages((prev) => ({ ...prev, [m.id]: e.target.value }))} className="h-7 w-16 text-xs text-right glass" onClick={(e) => e.stopPropagation()} />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
                    {isSelected && amt > 0 && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">৳{getShareDisplay(m.id)}</span>
                    )}
                  </label>
                );
              })}
            </div>
            {splitMode === "unequal" && amt > 0 && selectedMembers.length > 0 && (
              <p className={`text-xs ${Math.abs(getUnequalTotal() - amt) > 0.01 ? "text-destructive" : "text-muted-foreground"}`}>
                Total: ৳{getUnequalTotal().toFixed(2)} / ৳{amt.toFixed(2)}
                {Math.abs(getUnequalTotal() - amt) > 0.01 && ` (${getUnequalTotal() > amt ? "+" : ""}${(getUnequalTotal() - amt).toFixed(2)} off)`}
              </p>
            )}
            {splitMode === "percentage" && selectedMembers.length > 0 && (
              <p className={`text-xs ${Math.abs(getPercentageTotal() - 100) > 0.5 ? "text-destructive" : "text-muted-foreground"}`}>
                Total: {getPercentageTotal().toFixed(1)}% / 100%
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="expDate">Date</Label>
            <Input id="expDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card shadow-sm" />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="expNote">Note (optional)</Label>
            <Textarea id="expNote" placeholder="e.g., Dinner at the beach" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="bg-card shadow-sm" />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary glow-primary border-0" disabled={!amount || selectedMembers.length === 0 || submitting}>{submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Adding...</> : "Add Expense"}</Button>
        </form>
      </PageShell>
      <BottomNav />
    </>
  );
}

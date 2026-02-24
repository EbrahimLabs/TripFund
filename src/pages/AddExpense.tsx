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
import { Plus } from "lucide-react";

export default function AddExpense() {
  const { activeTrip, addTransaction } = useTrip();
  const navigate = useNavigate();
  const { getCategoryNames, getSubcategories, addCategory, addSubcategory } = useCategoryManager();

  const categoryNames = getCategoryNames();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categoryNames[0] || "Food");
  const [subcategory, setSubcategory] = useState(getSubcategories(category)[0] || "");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState("");

  useEffect(() => {
    if (!activeTrip) navigate("/");
    else setSelectedMembers(activeTrip.members.map((m) => m.id));
  }, [activeTrip, navigate]);

  useEffect(() => {
    setSubcategory(getSubcategories(category)[0] || "");
  }, [category, getSubcategories]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || selectedMembers.length === 0) return;

    const shareAmount = Math.round((amt / selectedMembers.length) * 100) / 100;
    const splits = selectedMembers.map((mid) => ({ memberId: mid, shareAmount }));

    addTransaction({
      type: "expense",
      amount: amt,
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
  };

  return (
    <>
      <PageShell title="Add Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="expAmount">Amount ({activeTrip.currency})</Label>
            <Input
              id="expAmount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              autoFocus
              className="text-2xl font-display font-bold h-14"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 gap-1"
                onClick={() => setShowAddCat((v) => !v)}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            <AnimatePresence>
              {showAddCat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 overflow-hidden"
                >
                  <Input
                    placeholder="New category..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={handleAddCategory}>
                    Add
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap gap-1.5">
              {categoryNames.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Subcategory */}
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <Label>Subcategory</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 gap-1"
                  onClick={() => setShowAddSub((v) => !v)}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <AnimatePresence>
                {showAddSub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 overflow-hidden"
                  >
                    <Input
                      placeholder="New subcategory..."
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                    />
                    <Button type="button" size="sm" className="h-8 text-xs" onClick={handleAddSubcategory}>
                      Add
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex flex-wrap gap-1.5">
                {getSubcategories(category).map((sub) => (
                  <Button
                    key={sub}
                    type="button"
                    variant={subcategory === sub ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSubcategory(sub)}
                    className="text-xs h-7 px-2.5"
                  >
                    {sub}
                  </Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Split among */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split among</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedMembers(activeTrip.members.map((m) => m.id))}>
                  Select all
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedMembers([])}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {activeTrip.members.map((m) => (
                <label key={m.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Checkbox checked={selectedMembers.includes(m.id)} onCheckedChange={() => toggleMember(m.id)} />
                  <span className="text-sm font-medium flex-1">{m.name}</span>
                  {selectedMembers.includes(m.id) && amount && selectedMembers.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {activeTrip.currency} {(parseFloat(amount || "0") / selectedMembers.length).toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="expDate">Date</Label>
            <Input id="expDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="expNote">Note (optional)</Label>
            <Textarea id="expNote" placeholder="e.g., Dinner at the beach" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!amount || selectedMembers.length === 0}>
            Add Expense
          </Button>
        </form>
      </PageShell>
      <BottomNav />
    </>
  );
}

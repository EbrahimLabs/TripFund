import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FundManagerBadge } from "@/components/FundManagerBadge";

export default function AddDeposit() {
  const { activeTrip, addBatchDeposits, loading } = useTrip();
  const navigate = useNavigate();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Initialize selected members when trip loads
  useEffect(() => {
    if (activeTrip && selectedMembers.length === 0) {
      setSelectedMembers(activeTrip.members.map((m) => m.id));
    }
  }, [activeTrip]);

  useEffect(() => {
    if (!loading && !activeTrip) navigate("/");
  }, [activeTrip, loading, navigate]);

  if (!activeTrip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || selectedMembers.length === 0 || submitting) return;
    setSubmitting(true);
    await addBatchDeposits({
      amount: amt,
      date,
      note,
      memberIds: selectedMembers,
    });
    toast.success(`Deposit added for ${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""}!`);
    setAmount("");
    setNote("");
    setSubmitting(false);
  };

  return (
    <>
      <PageShell title="Add Deposit" backTo="/dashboard">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... keep existing code (form fields) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Member</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedMembers(activeTrip.members.map((m) => m.id))}>Select all</Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedMembers([])}>Clear</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...activeTrip.members].sort((a, b) => (activeTrip.fundManagerId === a.id ? -1 : activeTrip.fundManagerId === b.id ? 1 : 0)).map((m) => (
                <Button key={m.id} type="button" variant={selectedMembers.includes(m.id) ? "default" : "outline"} size="sm" onClick={() => setSelectedMembers((prev) => prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id])} className={`w-full transition-all ${selectedMembers.includes(m.id) ? "gradient-primary glow-sm border-0" : "bg-card shadow-sm"}`}>
                  {m.name}
                  {activeTrip.fundManagerId === m.id && <> <FundManagerBadge /></>}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({activeTrip.currency})</Label>
            <Input id="amount" type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="text-2xl font-display font-bold h-14 glass" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card shadow-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" placeholder="e.g., Cash deposit" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="bg-card shadow-sm" />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary glow-primary border-0" disabled={!amount || selectedMembers.length === 0 || submitting}>{submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Adding...</> : "Add Deposit"}</Button>
          {!submitting && (selectedMembers.length === 0 || !amount) && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {selectedMembers.length === 0 ? "Select at least one member" : "Enter an amount to continue"}
            </p>
          )}
        </form>
      </PageShell>
      <BottomNav />
    </>
  );
}

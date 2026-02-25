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
import { FundManagerBadge } from "@/components/FundManagerBadge";

export default function AddDeposit() {
  const { activeTrip, addTransaction } = useTrip();
  const navigate = useNavigate();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Initialize selected members when trip loads
  useEffect(() => {
    if (activeTrip && selectedMembers.length === 0) {
      setSelectedMembers(activeTrip.members.map((m) => m.id));
    }
  }, [activeTrip]);

  useEffect(() => {
    if (!activeTrip) navigate("/");
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || selectedMembers.length === 0) return;
    for (const mid of selectedMembers) {
      await addTransaction({
        type: "deposit",
        amount: amt,
        date,
        note,
        memberId: mid,
      });
    }
    toast.success(`Deposit added for ${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""}!`);
    setAmount("");
    setNote("");
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
              <Button key={m.id} type="button" variant={selectedMembers.includes(m.id) ? "default" : "outline"} size="sm" onClick={() => setSelectedMembers((prev) => prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id])} className={`w-full transition-all ${selectedMembers.includes(m.id) ? "gradient-primary glow-sm border-0" : "glass"}`}>
                {m.name}
                {activeTrip.fundManagerId === m.id && <> <FundManagerBadge /></>}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({activeTrip.currency})</Label>
          <Input id="amount" type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" autoFocus className="text-2xl font-display font-bold h-14 glass" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea id="note" placeholder="e.g., Cash deposit" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="glass" />
        </div>
        <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary glow-primary border-0" disabled={!amount || selectedMembers.length === 0}>Add Deposit</Button>
      </form>
    </PageShell>
    <BottomNav />
    </>
  );
}

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

export default function AddDeposit() {
  const { activeTrip, addTransaction } = useTrip();
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!activeTrip) navigate("/");
    else if (!memberId && activeTrip.members.length) setMemberId(activeTrip.members[0].id);
  }, [activeTrip, navigate, memberId]);

  if (!activeTrip) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !memberId) return;
    addTransaction({
      type: "deposit",
      amount: amt,
      date,
      note,
      memberId,
    });
    toast.success("Deposit added!");
    setAmount("");
    setNote("");
  };

  return (
    <>
      <PageShell title="Add Deposit">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Member</Label>
            <div className="grid grid-cols-2 gap-2">
              {activeTrip.members.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  variant={memberId === m.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMemberId(m.id)}
                  className="w-full"
                >
                  {m.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({activeTrip.currency})</Label>
            <Input
              id="amount"
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

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="e.g., Cash deposit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!amount || !memberId}>
            Add Deposit
          </Button>
        </form>
      </PageShell>
      <BottomNav />
    </>
  );
}

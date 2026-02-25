import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, MapPin, Wallet, Trash2, Crown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { trips, createTrip, setActiveTripId, deleteTrip } = useTrip();
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [tripName, setTripName] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const [fundManagerIndex, setFundManagerIndex] = useState<number>(0);

  const handleCreate = async () => {
    const validMembers = members.filter((m) => m.trim());
    if (!tripName.trim() || validMembers.length < 2) return;
    const validIndex = members[fundManagerIndex]?.trim() ? 
      validMembers.indexOf(members[fundManagerIndex].trim()) : 0;
    await createTrip(tripName.trim(), "BDT", validMembers.map((m) => m.trim()), validIndex >= 0 ? validIndex : 0);
    navigate("/dashboard");
  };

  const handleSelectTrip = (id: string) => {
    setActiveTripId(id);
    navigate("/dashboard");
  };

  const handleDeleteTrip = async (id: string) => {
    await deleteTrip(id);
    toast.success("Trip deleted!");
  };

  const addMemberField = () => setMembers((m) => [...m, ""]);
  const removeMember = (i: number) => {
    setMembers((m) => m.filter((_, idx) => idx !== i));
    if (fundManagerIndex === i) setFundManagerIndex(0);
    else if (fundManagerIndex > i) setFundManagerIndex((prev) => prev - 1);
  };
  const updateMember = (i: number, val: string) =>
    setMembers((m) => m.map((v, idx) => (idx === i ? val : v)));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative gradient-hero mesh-bg">
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-4 py-3.5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg gradient-primary shrink-0">
              <Wallet className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold tracking-tight gradient-text">TripFund</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground" onClick={signOut} title="Sign out">
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Decorative orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-32 right-8 w-40 h-40 rounded-full bg-accent/10 blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-18 h-18 rounded-2xl gradient-primary glow-primary mb-3 p-4"
          >
            <Wallet className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold tracking-tight gradient-text">TripFund</h1>
          <p className="text-muted-foreground text-sm">Manage shared travel money, effortlessly.</p>
        </div>

        <AnimatePresence mode="wait">
          {!showCreate ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Button className="w-full h-12 text-base font-semibold gradient-primary glow-primary transition-opacity border-0" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-5 w-5" /> New Trip
              </Button>

              {trips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Trips</p>
                  {trips.map((trip, i) => (
                    <motion.div key={trip.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="cursor-pointer glass card-elevated transition-all duration-300 group">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleSelectTrip(trip.id)}>
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
                              <MapPin className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-semibold text-sm truncate">{trip.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {trip.members.length} members · {trip.transactions.length} txns
                              </p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{trip.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this trip and all its transactions.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <Card className="glass card-elevated p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tripName">Trip Name</Label>
                    <Input id="tripName" placeholder="e.g., Bali 2025" value={tripName} onChange={(e) => setTripName(e.target.value)} autoFocus className="glass" />
                  </div>

                  <div className="space-y-2">
                    <Label>Members (min 2)</Label>
                    <p className="text-xs text-muted-foreground">Tap the crown to set as Fund Manager</p>
                    <div className="space-y-2">
                      {members.map((m, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => setFundManagerIndex(i)}
                            className={`shrink-0 p-1.5 rounded-lg transition-all ${
                              fundManagerIndex === i
                                ? "text-primary bg-primary/15 glow-sm"
                                : "text-muted-foreground/40"
                            }`}
                            title={fundManagerIndex === i ? "Fund Manager" : "Set as Fund Manager"}
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                          <Input
                            placeholder={`Member ${i + 1}`}
                            value={m}
                            onChange={(e) => updateMember(i, e.target.value)}
                            className="glass"
                          />
                          {members.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeMember(i)} className="shrink-0">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addMemberField} className="w-full glass">
                      <Plus className="mr-1 h-4 w-4" /> Add Member
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 glass" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button className="flex-1 gradient-primary glow-primary border-0" onClick={handleCreate} disabled={!tripName.trim() || members.filter((m) => m.trim()).length < 2}>
                      Create Trip
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Index;

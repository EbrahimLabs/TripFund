import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, MapPin, Wallet, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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

const Index = () => {
  const { trips, createTrip, setActiveTripId, deleteTrip } = useTrip();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [tripName, setTripName] = useState("");
  
  const [members, setMembers] = useState<string[]>([""]);

  const handleCreate = () => {
    const validMembers = members.filter((m) => m.trim());
    if (!tripName.trim() || validMembers.length < 2) return;
    createTrip(tripName.trim(), "BDT", validMembers.map((m) => m.trim()));
    navigate("/dashboard");
  };

  const handleSelectTrip = (id: string) => {
    setActiveTripId(id);
    navigate("/dashboard");
  };

  const handleDeleteTrip = (id: string) => {
    deleteTrip(id);
    toast.success("Trip deleted!");
  };

  const addMemberField = () => setMembers((m) => [...m, ""]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, val: string) =>
    setMembers((m) => m.map((v, idx) => (idx === i ? val : v)));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2"
          >
            <Wallet className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold tracking-tight">TripFund</h1>
          <p className="text-muted-foreground text-sm">Manage shared travel money, effortlessly.</p>
        </div>

        <AnimatePresence mode="wait">
          {!showCreate ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Button className="w-full h-12 text-base font-semibold" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-5 w-5" /> New Trip
              </Button>

              {trips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Trips</p>
                  {trips.map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="cursor-pointer hover:border-primary/40 transition-colors group">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div
                            className="flex items-center gap-3 flex-1 min-w-0"
                            onClick={() => handleSelectTrip(trip.id)}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                              <MapPin className="h-4 w-4 text-secondary-foreground" />
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{trip.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this trip and all its transactions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTrip(trip.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
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
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  placeholder="e.g., Bali 2025"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  autoFocus
                />
              </div>


              <div className="space-y-2">
                <Label>Members (min 2)</Label>
                <div className="space-y-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`Member ${i + 1}`}
                        value={m}
                        onChange={(e) => updateMember(i, e.target.value)}
                      />
                      {members.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeMember(i)} className="shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addMemberField} className="w-full">
                  <Plus className="mr-1 h-4 w-4" /> Add Member
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={!tripName.trim() || members.filter((m) => m.trim()).length < 2}
                >
                  Create Trip
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Index;

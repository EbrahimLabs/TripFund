import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Plus, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryManager } from "@/components/CategoryManager";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TripSettings() {
  const {
    activeTrip, editTripDetails, addMember, renameMember, deleteMember,
    setFundManager, getMemberUserIds, loading,
  } = useTrip();
  const navigate = useNavigate();
  const [tripName, setTripName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [memberUserIds, setMemberUserIds] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!loading && !activeTrip) navigate("/");
    else if (activeTrip) {
      setTripName(activeTrip.name);
      getMemberUserIds().then(setMemberUserIds);
    }
  }, [activeTrip, loading, navigate, getMemberUserIds]);

  if (!activeTrip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
    </div>
  );

  const handleSave = async () => {
    if (tripName.trim()) {
      await editTripDetails(tripName.trim(), activeTrip.currency);
      toast.success("Trip updated!");
    }
  };

  const handleAddMember = async () => {
    if (newMemberName.trim()) {
      await addMember(newMemberName.trim());
      setNewMemberName("");
      toast.success("Member added!");
    }
  };

  const handleRenameMember = async (id: string) => {
    if (editMemberName.trim()) {
      await renameMember(id, editMemberName.trim());
      setEditingMemberId(null);
      setEditMemberName("");
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (activeTrip.members.length <= 2) {
      toast.error("A trip must have at least 2 members");
      return;
    }
    await deleteMember(id);
    toast.success("Member removed!");
  };

  return (
    <PageShell title="Trip Settings" backTo="/dashboard">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full glass">
          <TabsTrigger value="general" className="flex-1 text-xs">General</TabsTrigger>
          <TabsTrigger value="members" className="flex-1 text-xs">Members</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 text-xs">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="space-y-2">
            <Label>Trip Name</Label>
            <Input value={tripName} onChange={(e) => setTripName(e.target.value)} className="bg-card shadow-sm" />
          </div>
          <Button onClick={handleSave} className="w-full gradient-primary border-0">Save Changes</Button>
        </TabsContent>

        <TabsContent value="members" className="space-y-3">
          <p className="text-xs text-muted-foreground">Tap the crown to set as Fund Manager</p>
          {[...activeTrip.members]
            .sort((a, b) => (activeTrip.fundManagerId === a.id ? -1 : activeTrip.fundManagerId === b.id ? 1 : 0))
            .map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => await setFundManager(activeTrip.fundManagerId === m.id ? undefined : m.id)}
                  className={`shrink-0 p-1.5 rounded-md transition-colors ${activeTrip.fundManagerId === m.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground/40"
                    }`}
                >
                  <Crown className="h-4 w-4" />
                </button>
                {editingMemberId === m.id ? (
                  <>
                    <Input
                      value={editMemberName}
                      onChange={(e) => setEditMemberName(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleRenameMember(m.id)}
                    />
                    <Button size="sm" className="h-8 gradient-primary border-0" onClick={() => handleRenameMember(m.id)}>Save</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm flex items-center gap-1.5">
                      {m.name}
                      {activeTrip.fundManagerId === m.id && <FundManagerBadge />}
                    </span>
                    {memberUserIds[m.id] && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Linked
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditingMemberId(m.id); setEditMemberName(m.name); }}>
                      Rename
                    </Button>
                    {activeTrip.members.length > 2 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card shadow-sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove "{m.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove this member from the trip. Their existing transactions will remain.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMember(m.id)} className="bg-destructive text-destructive-foreground">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </div>
            ))}
          <div className="flex gap-2">
            <Input
              placeholder="New member name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            />
            <Button size="sm" className="h-8" variant="outline" onClick={handleAddMember}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

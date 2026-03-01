import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const { user, signOut, updatePassword } = useAuthContext();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const handleSaveName = async () => {
    if (!displayName.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to update name");
    else toast.success("Name updated!");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    const { error } = await updatePassword(newPassword);
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); setDeleting(false); return; }

      const res = await supabase.functions.invoke("delete-account");
      if (res.error) throw res.error;

      toast.success("Account deleted");
      await signOut();
      navigate("/auth");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
    }
    setDeleting(false);
  };

  return (
    <>
      <PageShell
        title="Account"
        icon={User}
        backTo="/dashboard"
      >
        <div className="space-y-4 pb-8">
          {/* Profile */}
          <Card className="bg-card shadow-sm border-0 rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-display font-semibold text-sm">Profile</h3>
              <div className="space-y-2">
                <Label className="text-xs">Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-card shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input value={user?.email || ""} disabled className="glass opacity-60" />
              </div>
              <Button onClick={handleSaveName} disabled={saving} className="w-full gradient-primary border-0">
                {saving ? "Saving..." : "Save Name"}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-card shadow-sm border-0 rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-display font-semibold text-sm flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Change Password
              </h3>
              <div className="space-y-2">
                <Label className="text-xs">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-card shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-card shadow-sm" />
              </div>
              <Button onClick={handleChangePassword} variant="outline" className="w-full glass">
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Button variant="outline" className="w-full glass" onClick={async () => { await signOut(); navigate("/auth"); }}>
            Sign Out
          </Button>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full border-destructive/30 text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card shadow-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground">
                  {deleting ? "Deleting..." : "Delete Forever"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

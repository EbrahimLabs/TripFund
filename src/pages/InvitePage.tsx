import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, UserPlus, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface InviteData {
  id: string;
  trip_id: string;
  member_id: string;
  token: string;
  accepted_by: string | null;
  expires_at: string;
  tripName: string;
  memberName: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Invalid invite link"); setLoading(false); return; }

    (async () => {
      const { data, error: fetchErr } = await supabase
        .from("trip_invites")
        .select("*")
        .eq("token", token)
        .single();

      if (fetchErr || !data) { setError("Invite not found"); setLoading(false); return; }

      if (data.accepted_by) { setError("This invite has already been used"); setLoading(false); return; }
      if (new Date(data.expires_at) < new Date()) { setError("This invite has expired"); setLoading(false); return; }

      // Fetch trip name and member name
      const [{ data: trip }, { data: member }] = await Promise.all([
        supabase.from("trips").select("name").eq("id", data.trip_id).single(),
        supabase.from("trip_members").select("display_name").eq("id", data.member_id).single(),
      ]);

      setInvite({
        ...data,
        tripName: trip?.name || "Unknown Trip",
        memberName: member?.display_name || "Unknown Member",
      });
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!invite || !user) return;
    setAccepting(true);

    // Link user_id to the trip member
    const { error: memberErr } = await supabase
      .from("trip_members")
      .update({ user_id: user.id })
      .eq("id", invite.member_id);

    if (memberErr) { toast.error("Failed to join trip"); setAccepting(false); return; }

    // Mark invite as accepted
    await supabase
      .from("trip_invites")
      .update({ accepted_by: user.id })
      .eq("id", invite.id);

    toast.success(`Joined "${invite.tripName}" as ${invite.memberName}!`);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gradient-hero mesh-bg">
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary p-4">
            <Wallet className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text">Trip Invite</h1>
        </div>

        <Card className="glass card-elevated border-0">
          <CardContent className="p-5 text-center space-y-4">
            {loading && <p className="text-muted-foreground text-sm animate-pulse">Loading invite...</p>}

            {error && (
              <div className="space-y-3">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" className="glass" onClick={() => navigate("/")}>Go Home</Button>
              </div>
            )}

            {invite && !error && (
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">You're invited to</p>
                  <p className="text-lg font-display font-bold">{invite.tripName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">As</p>
                  <p className="text-base font-display font-semibold">{invite.memberName}</p>
                </div>
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full gradient-primary glow-primary border-0"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {accepting ? "Joining..." : `Join as ${invite.memberName}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

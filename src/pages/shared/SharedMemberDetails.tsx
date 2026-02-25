import { useParams } from "react-router-dom";
import { useSharedTrip } from "@/context/SharedTripContext";
import { MemberDetailsContent } from "@/components/MemberDetailsContent";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function SharedMemberDetails() {
    const { memberId } = useParams<{ memberId: string }>();
    const { trip, loading, error } = useSharedTrip();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
            <div className="animate-pulse text-primary font-display text-lg">Loading...</div>
        </div>
    );

    if (error || !trip || !memberId) return (
        <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg px-4">
            <Card className="glass card-elevated border-0 max-w-sm w-full">
                <CardContent className="p-5 text-center space-y-3">
                    <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                    <p className="text-sm text-muted-foreground">{error || "Trip or Member not found"}</p>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <MemberDetailsContent
            trip={trip}
            memberId={memberId}
            bottomNav={<SharedBottomNav />}
        />
    );
}

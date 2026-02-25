import { useParams } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { MemberDetailsContent } from "@/components/MemberDetailsContent";
import { BottomNav } from "@/components/BottomNav";

export default function MemberDetails() {
    const { memberId } = useParams<{ memberId: string }>();
    const { activeTrip } = useTrip();

    if (!activeTrip || !memberId) return null;

    return (
        <MemberDetailsContent
            trip={activeTrip}
            memberId={memberId}
            bottomNav={<BottomNav />}
        />
    );
}

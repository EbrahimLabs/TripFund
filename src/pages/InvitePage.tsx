import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate(`/shared/${token}/dashboard`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Redirecting...</div>
    </div>
  );
}

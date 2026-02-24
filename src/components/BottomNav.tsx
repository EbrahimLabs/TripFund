import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Receipt, Handshake, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/deposit", icon: PlusCircle, label: "Deposit" },
  { to: "/expense", icon: Receipt, label: "Expense" },
  { to: "/settle", icon: Handshake, label: "Settle" },
  { to: "/summary", icon: FileText, label: "Summary" },
  { to: "/categories", icon: Settings, label: "Manage" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors rounded-lg",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

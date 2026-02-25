import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Receipt, Handshake, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/deposit", icon: PlusCircle, label: "Deposit" },
  { to: "/expense", icon: Receipt, label: "Expense" },
  { to: "/settle", icon: Handshake, label: "Settle" },
  { to: "/summary", icon: FileText, label: "Summary" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-all rounded-xl",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-primary/10 glow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn("h-5 w-5 relative z-10", active && "stroke-[2.5]")} />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

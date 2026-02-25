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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom px-4 pb-3 pt-1">
      <div className="mx-auto max-w-lg rounded-full bg-primary p-1.5 flex items-center justify-between shadow-lg shadow-primary/30">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex items-center justify-center rounded-full transition-all duration-300",
                active
                  ? "bg-primary-foreground text-primary gap-1.5 px-4 py-2"
                  : "text-primary-foreground/50 hover:text-primary-foreground/80 p-2.5"
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-primary-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn("relative z-10", active ? "h-4 w-4 stroke-[2.5]" : "h-5 w-5")} />
              {active && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="relative z-10 text-xs font-semibold whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { cn } from "@/lib/utils";
import { ChevronLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  backTo?: string;
  icon?: LucideIcon;
}

export function PageShell({ title, children, className, action, backTo, icon: Icon }: PageShellProps) {
  const navigate = useNavigate();
  let sidebarCtx: ReturnType<typeof useSidebar> | null = null;
  try { sidebarCtx = useSidebar(); } catch {}

  return (
    <div className={cn("min-h-screen pb-24 mesh-bg", className)}>
      <header className="sticky top-0 z-40 glass-strong px-4 py-3.5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {backTo ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground"
              onClick={() => navigate(backTo)}
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </Button>
          ) : sidebarCtx ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground"
              onClick={() => sidebarCtx!.setOpenMobile(true)}
            >
              <Menu className="h-[18px] w-[18px]" />
            </Button>
          ) : null}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <div className="flex items-center justify-center w-7 h-7 rounded-lg gradient-primary shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-lg font-display font-bold tracking-tight gradient-text truncate"
            >
              {title}
            </motion.h1>
          </div>
          {action && <div className="flex items-center gap-1 shrink-0">{action}</div>}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 animate-fade-in relative z-10">
        {children}
      </main>
    </div>
  );
}

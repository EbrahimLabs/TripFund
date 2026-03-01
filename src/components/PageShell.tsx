import { cn } from "@/lib/utils";
import { ChevronLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSidebarSafe } from "@/hooks/useSidebarSafe";
import type { LucideIcon } from "lucide-react";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  backTo?: string;
  icon?: LucideIcon;
  hero?: React.ReactNode;
}

export function PageShell({ title, children, className, action, backTo, icon: Icon, hero }: PageShellProps) {
  const navigate = useNavigate();
  const sidebarCtx = useSidebarSafe();

  return (
    <div className={cn("min-h-screen pb-24 mesh-bg", className)}>
      <header className="sticky top-0 z-40 px-4 pt-6 pb-6 mesh-header rounded-b-[2rem] shadow-xl text-white">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {backTo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-white hover:bg-white/20 hover:text-white"
              onClick={() => navigate(backTo)}
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 shrink-0">
                <Icon className="h-4 w-4 text-white" />
              </div>
            )}
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-xl font-display font-bold tracking-tight text-white break-words"
            >
              {title}
            </motion.h1>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-white">
            {action}
            {sidebarCtx && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-white hover:bg-white/20 hover:text-white"
                onClick={() => sidebarCtx!.setOpenMobile(true)}
              >
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            )}
          </div>
        </div>

        {hero && (
          <div className="mx-auto max-w-lg mt-6 animate-fade-in">
            {hero}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 animate-fade-in relative z-10">
        {children}
      </main>
    </div>
  );
}

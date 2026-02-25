import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PageShell({ title, children, className, action }: PageShellProps) {
  return (
    <div className={cn("min-h-screen pb-24 bg-background", className)}>
      <header className="sticky top-0 z-40 glass-strong px-4 py-2.5">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            {action}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 animate-fade-in relative z-10">
        {children}
      </main>
    </div>
  );
}

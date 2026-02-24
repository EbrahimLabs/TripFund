import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PageShell({ title, children, className, action }: PageShellProps) {
  return (
    <div className={cn("min-h-screen pb-24", className)}>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-display font-bold tracking-tight">{title}</h1>
          {action}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 animate-fade-in">
        {children}
      </main>
    </div>
  );
}

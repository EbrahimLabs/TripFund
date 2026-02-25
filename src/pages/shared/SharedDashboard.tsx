import { useSharedTrip } from "@/context/SharedTripContext";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { SharedBottomNav } from "@/components/SharedBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { FundManagerBadge } from "@/components/FundManagerBadge";

const CHART_COLORS = [
  "hsl(230, 98%, 55%)",
  "hsl(215, 85%, 50%)",
  "hsl(245, 70%, 58%)",
  "hsl(38, 90%, 55%)",
];

export default function SharedDashboard() {
  const { trip, loading, error, getStats, getMemberBalances, getDailyExpenses, getCategoryBreakdown } = useSharedTrip();
  const navigate = useNavigate();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
      <div className="animate-pulse text-primary font-display text-lg">Loading trip...</div>
    </div>
  );

  if (error || !trip) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg px-4">
      <Card className="glass card-elevated border-0 max-w-sm w-full">
        <CardContent className="p-5 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error || "Trip not found"}</p>
        </CardContent>
      </Card>
    </div>
  );

  const stats = getStats();
  const balances = getMemberBalances();
  const dailyExpenses = getDailyExpenses();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <>
      <PageShell title={trip.name} icon={MapPin}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="gradient-card glow-primary border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2 blur-xl" />
            <CardContent className="p-5 relative z-10">
              <p className="text-sm text-white/70 mb-1">Total Balance</p>
              <p className="text-3xl font-display font-bold text-white">{trip.currency} {stats.balance.toFixed(0)}</p>
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Deposited</p>
                    <p className="text-sm font-display font-semibold text-white">{trip.currency} {stats.totalDeposited.toFixed(0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Spent</p>
                    <p className="text-sm font-display font-semibold text-white">{trip.currency} {stats.totalSpent.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {dailyExpenses.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Daily Spending
            </h2>
            <Card className="glass card-elevated border-0">
              <CardContent className="p-3 pt-4">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={dailyExpenses}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(d: string) => d.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "none", background: "var(--glass-bg)", backdropFilter: "blur(16px)", boxShadow: "var(--glass-shadow)" }} formatter={(value: number) => [`${trip.currency} ${value.toFixed(2)}`, "Spent"]} labelFormatter={(label: string) => label} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {dailyExpenses.map((_, index) => (
                        <Cell key={index} fill={`hsl(${260 + index * 5}, 60%, ${55 + index * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {categoryBreakdown.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Category</h2>
            <Card className="glass card-elevated border-0">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-24 h-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={20} outerRadius={40} strokeWidth={2} stroke="transparent">
                        {categoryBreakdown.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {categoryBreakdown.map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs">{c.category}</span>
                      </div>
                      <span className="font-display font-semibold text-xs">{trip.currency} {c.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {trip.transactions.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </motion.div>
        )}

        <div className="space-y-2 pb-4">
          <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Members ({balances.length})</h2>
          <AnimatePresence>
            {[...balances].sort((a, b) => (trip.fundManagerId === a.member.id ? -1 : trip.fundManagerId === b.member.id ? 1 : 0)).map((b, i) => (
              <motion.div key={b.member.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`../member/${b.member.id}`)}
                className="cursor-pointer"
              >
                <Card className="glass card-elevated border-0 group hover:bg-white/[0.02] transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-semibold text-sm flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        {b.member.name}
                        {trip.fundManagerId === b.member.id && <FundManagerBadge />}
                      </span>
                      <span className={cn("font-display font-bold text-sm", b.net > 0.01 ? "text-deposit" : b.net < -0.01 ? "text-expense" : "text-muted-foreground")}>
                        {b.net > 0 ? "+" : ""}{trip.currency} {b.net.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Deposited: {trip.currency} {b.deposited.toFixed(0)}</span>
                      <span>Share: {trip.currency} {b.expenseShare.toFixed(0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </PageShell>
      <SharedBottomNav />
    </>
  );
}

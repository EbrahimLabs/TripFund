import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Wallet, LogOut, Settings, Plus, TrendingUp, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { CategoryManager } from "@/components/CategoryManager";
import { FundManagerBadge } from "@/components/FundManagerBadge";

const CHART_COLORS = [
  "hsl(230, 98%, 55%)",
  "hsl(215, 85%, 50%)",
  "hsl(245, 70%, 58%)",
  "hsl(38, 90%, 55%)",
];

export default function TripDashboard() {
  const {
    activeTrip, getStats, getMemberBalances, setActiveTripId,
    getDailyExpenses, getCategoryBreakdown,
    editTripDetails, addMember, renameMember, setFundManager,
  } = useTrip();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [tripName, setTripName] = useState("");
  
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");

  useEffect(() => {
    if (!activeTrip) navigate("/");
    else {
      setTripName(activeTrip.name);
    }
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const stats = getStats();
  const balances = getMemberBalances();
  const dailyExpenses = getDailyExpenses();
  const categoryBreakdown = getCategoryBreakdown();

  const handleSaveSettings = async () => {
    if (tripName.trim()) {
      await editTripDetails(tripName.trim(), "BDT");
      toast.success("Trip updated!");
      setShowSettings(false);
    }
  };

  const handleAddMember = async () => {
    if (newMemberName.trim()) {
      await addMember(newMemberName.trim());
      setNewMemberName("");
      toast.success("Member added!");
    }
  };

  const handleRenameMember = async (id: string) => {
    if (editMemberName.trim()) {
      await renameMember(id, editMemberName.trim());
      setEditingMemberId(null);
      setEditMemberName("");
    }
  };

  return (
    <>
      <PageShell
        title={activeTrip.name}
        action={
          <div className="flex gap-1">
            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto glass">
                <SheetHeader>
                  <SheetTitle>Trip Settings</SheetTitle>
                </SheetHeader>
                <Tabs defaultValue="general" className="mt-4">
                  <TabsList className="w-full glass">
                    <TabsTrigger value="general" className="flex-1 text-xs">General</TabsTrigger>
                    <TabsTrigger value="members" className="flex-1 text-xs">Members</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1 text-xs">Categories</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Trip Name</Label>
                      <Input value={tripName} onChange={(e) => setTripName(e.target.value)} />
                    </div>
                    <Button onClick={handleSaveSettings} className="w-full gradient-primary border-0">Save Changes</Button>
                  </TabsContent>

                  <TabsContent value="members" className="space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground">Tap the crown to set as Fund Manager</p>
                    {activeTrip.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => await setFundManager(activeTrip.fundManagerId === m.id ? undefined : m.id)}
                          className={`shrink-0 p-1.5 rounded-md transition-colors ${
                            activeTrip.fundManagerId === m.id
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground/40"
                          }`}
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                        {editingMemberId === m.id ? (
                          <>
                            <Input
                              value={editMemberName}
                              onChange={(e) => setEditMemberName(e.target.value)}
                              className="flex-1 h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleRenameMember(m.id)}
                            />
                            <Button size="sm" className="h-8 gradient-primary border-0" onClick={() => handleRenameMember(m.id)}>Save</Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm flex items-center gap-1.5">
                              {m.name}
                              {activeTrip.fundManagerId === m.id && <FundManagerBadge />}
                            </span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditingMemberId(m.id); setEditMemberName(m.name); }}>
                              Rename
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="New member name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                      />
                      <Button size="sm" className="h-8" variant="outline" onClick={handleAddMember}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="categories" className="mt-4">
                    <CategoryManager />
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => { setActiveTripId(null); navigate("/"); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        {/* Hero Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="gradient-card glow-primary border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2 blur-xl" />
            <CardContent className="p-5 relative z-10">
              <p className="text-sm text-white/70 mb-1">Total Balance</p>
              <p className="text-3xl font-display font-bold text-white">{activeTrip.currency} {stats.balance.toFixed(0)}</p>
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Deposited</p>
                    <p className="text-sm font-display font-semibold text-white">{activeTrip.currency} {stats.totalDeposited.toFixed(0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Spent</p>
                    <p className="text-sm font-display font-semibold text-white">{activeTrip.currency} {stats.totalSpent.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Expenses Chart */}
        {dailyExpenses.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Daily Spending
            </h2>
            <Card className="glass card-elevated border-0">
              <CardContent className="p-3 pt-4">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={dailyExpenses}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(d: string) => d.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: "none", background: "var(--glass-bg)", backdropFilter: "blur(16px)", boxShadow: "var(--glass-shadow)" }}
                      formatter={(value: number) => [`${activeTrip.currency} ${value.toFixed(2)}`, "Spent"]}
                      labelFormatter={(label: string) => label}
                    />
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

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              By Category
            </h2>
            <Card className="glass card-elevated border-0">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-24 h-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%" cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        strokeWidth={2}
                        stroke="transparent"
                      >
                        {categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
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
                      <span className="font-display font-semibold text-xs">{activeTrip.currency} {c.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {activeTrip.transactions.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet.<br />Start by adding a deposit or expense!</p>
          </motion.div>
        )}

        {/* Member balances */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Members</h2>
          <AnimatePresence>
            {balances.map((b, i) => (
              <motion.div
                key={b.member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass card-elevated border-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-semibold text-sm flex items-center gap-1.5">
                        {b.member.name}
                        {activeTrip.fundManagerId === b.member.id && <FundManagerBadge />}
                      </span>
                      <span
                        className={cn(
                          "font-display font-bold text-sm",
                          b.net > 0.01 ? "text-deposit" : b.net < -0.01 ? "text-expense" : "text-muted-foreground"
                        )}
                      >
                        {b.net > 0 ? "+" : ""}{activeTrip.currency} {b.net.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Deposited: {activeTrip.currency} {b.deposited.toFixed(0)}</span>
                      <span>Share: {activeTrip.currency} {b.expenseShare.toFixed(0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

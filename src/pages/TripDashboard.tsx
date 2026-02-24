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
  "hsl(160, 60%, 38%)",
  "hsl(38, 90%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(220, 60%, 50%)",
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

  const handleSaveSettings = () => {
    if (tripName.trim()) {
      editTripDetails(tripName.trim(), "BDT");
      toast.success("Trip updated!");
      setShowSettings(false);
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(newMemberName.trim());
      setNewMemberName("");
      toast.success("Member added!");
    }
  };

  const handleRenameMember = (id: string) => {
    if (editMemberName.trim()) {
      renameMember(id, editMemberName.trim());
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
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Trip Settings</SheetTitle>
                </SheetHeader>
                <Tabs defaultValue="general" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="general" className="flex-1 text-xs">General</TabsTrigger>
                    <TabsTrigger value="members" className="flex-1 text-xs">Members</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1 text-xs">Categories</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Trip Name</Label>
                      <Input value={tripName} onChange={(e) => setTripName(e.target.value)} />
                    </div>
                    <Button onClick={handleSaveSettings} className="w-full">Save Changes</Button>
                  </TabsContent>

                  <TabsContent value="members" className="space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground">Tap the crown to set as Fund Manager</p>
                    {activeTrip.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFundManager(activeTrip.fundManagerId === m.id ? undefined : m.id)}
                          className={`shrink-0 p-1.5 rounded-md transition-colors ${
                            activeTrip.fundManagerId === m.id
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground/40 hover:text-muted-foreground"
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
                            <Button size="sm" className="h-8" onClick={() => handleRenameMember(m.id)}>Save</Button>
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: ArrowDownCircle, label: "Deposited", value: stats.totalDeposited, color: "text-deposit", bg: "bg-primary/5 border-primary/10" },
            { icon: ArrowUpCircle, label: "Spent", value: stats.totalSpent, color: "text-expense", bg: "bg-destructive/5 border-destructive/10" },
            { icon: Wallet, label: "Balance", value: stats.balance, color: "text-primary", bg: "bg-secondary border-secondary" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className={bg}>
                <CardContent className="p-3 text-center">
                  <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-display font-bold">{activeTrip.currency} {value.toFixed(0)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Daily Expenses Chart */}
        {dailyExpenses.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Daily Spending
            </h2>
            <Card>
              <CardContent className="p-3 pt-4">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={dailyExpenses}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(160, 10%, 45%)" }}
                      tickFormatter={(d: string) => d.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(160, 15%, 88%)" }}
                      formatter={(value: number) => [`${activeTrip.currency} ${value.toFixed(2)}`, "Spent"]}
                      labelFormatter={(label: string) => label}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="hsl(160, 60%, 38%)" />
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
            <Card>
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
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary">
              <Wallet className="h-6 w-6 text-muted-foreground" />
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
                <Card>
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

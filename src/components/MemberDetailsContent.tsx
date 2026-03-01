import React, { useMemo, useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, UserCircle, Wallet, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Trip } from "@/hooks/useTripStore";
import type { Transaction } from "@/types/trip";

interface MemberDetailsContentProps {
    trip: Trip;
    memberId: string;
    bottomNav?: React.ReactNode;
    backTo?: string;
}

export function MemberDetailsContent({ trip, memberId, bottomNav, backTo = "/dashboard" }: MemberDetailsContentProps) {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const member = trip.members.find(m => m.id === memberId);
    const isFundManager = trip.fundManagerId === memberId;

    const stats = useMemo(() => {
        let deposited = 0;
        let expenseShare = 0;
        const memberTransactions: { type: 'deposit' | 'expense_share', amount: number, date: string, note: string, id: string, originTx: any }[] = [];

        trip.transactions.forEach(t => {
            if (t.type === "deposit" && t.memberId === memberId) {
                deposited += t.amount;
                memberTransactions.push({
                    type: 'deposit',
                    amount: t.amount,
                    date: t.date,
                    note: t.note || 'Deposit',
                    id: t.id,
                    originTx: t
                });
            } else if (t.type === "expense") {
                const split = t.splits?.find(s => s.memberId === memberId);
                if (split) {
                    expenseShare += split.shareAmount;
                    memberTransactions.push({
                        type: 'expense_share',
                        amount: split.shareAmount,
                        date: t.date,
                        note: t.note || t.category || 'Expense',
                        id: `${t.id}-split`,
                        originTx: t
                    });
                }
            }
        });

        // Sort transactions newest first, then by createdAt to keep same-day items stable
        memberTransactions.sort((a, b) => b.date.localeCompare(a.date) || (b.originTx.createdAt || "").localeCompare(a.originTx.createdAt || ""));

        return {
            deposited,
            expenseShare,
            net: deposited - expenseShare,
            transactions: memberTransactions
        };
    }, [trip, memberId]);

    if (!member) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero mesh-bg">
                <div className="text-white text-lg">Member not found</div>
            </div>
        );
    }

    const txByDate: Record<string, typeof stats.transactions> = {};
    stats.transactions.forEach((tx) => {
        if (!txByDate[tx.date]) txByDate[tx.date] = [];
        txByDate[tx.date].push(tx);
    });
    const sortedDates = Object.keys(txByDate).sort((a, b) => b.localeCompare(a));

    const heroContent = (
        <div className="relative z-10 px-2 pb-2">
            <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-white/80">Net Balance</p>
                {isFundManager && (
                    <span className="text-[10px] font-semibold tracking-wider uppercase bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Fund Manager
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl font-display font-bold text-white tracking-tight">
                    {stats.net > 0 ? "+" : ""}{trip.currency} {stats.net.toFixed(2)}
                </p>
                <p className="text-sm text-white/80">
                    {stats.net > 0 ? "to receive" : stats.net < 0 ? "owes" : "settled"}
                </p>
            </div>

            <div className="flex gap-8 mt-6">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
                        <ArrowDownCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/70 uppercase tracking-wider">Total Deposited</p>
                        <p className="text-sm font-display font-semibold text-white">
                            {trip.currency} {stats.deposited.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
                        <ArrowUpCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/70 uppercase tracking-wider">Expense Share</p>
                        <p className="text-sm font-display font-semibold text-white">
                            {trip.currency} {stats.expenseShare.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <PageShell title={member.name} icon={UserCircle} backTo={backTo} className="!pb-0" hero={heroContent}>


                <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" /> Activity History
                </h2>

                {stats.transactions.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 space-y-3">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass glow-sm">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No activity for {member.name} yet.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4 pb-24">
                        {sortedDates.map((date) => (
                            <div key={date} className="space-y-1.5">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </h3>
                                {txByDate[date].map((t, index) => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="bg-card shadow-sm border-0 rounded-2xl">
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3">
                                                    {t.type === 'deposit' ? (
                                                        <ArrowDownCircle className="h-4 w-4 text-deposit shrink-0" />
                                                    ) : (
                                                        <ArrowUpCircle className="h-4 w-4 text-expense shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {t.type === 'deposit'
                                                                ? (t.note || 'Deposit')
                                                                : `${t.originTx?.category || ''}${t.originTx?.subcategory ? ` · ${t.originTx.subcategory}` : ''}`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {t.type === 'deposit'
                                                                ? 'Deposit'
                                                                : (t.originTx?.note || `Split: ${t.originTx?.splits?.length || 0} members`)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className={cn("font-display font-bold text-sm", t.type === 'deposit' ? "text-deposit" : "text-expense")}>
                                                            {t.type === 'deposit' ? "+" : "-"}{t.amount.toFixed(2)}
                                                        </span>
                                                        {t.type === 'expense_share' && t.originTx && t.originTx.amount && (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                of {trip.currency} {t.originTx.amount.toFixed(2)} total
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </PageShell>
            {bottomNav}
        </>
    );
}

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import type { Trip } from "@/hooks/useTripStore";
import type { Transaction } from "@/types/trip";

interface SummaryContentProps {
    trip: Trip;
    /** Sorted, filtered transactions to display */
    transactions: Transaction[];
    getMemberName: (id: string) => string;
    /** Optional per-transaction action buttons (edit/delete). If omitted, cards are read-only. */
    renderActions?: (tx: Transaction) => React.ReactNode;
    /** Optional empty state message override */
    emptyMessage?: string;
}

export function SummaryContent({
    trip,
    transactions,
    getMemberName,
    renderActions,
    emptyMessage = "No transactions yet.",
}: SummaryContentProps) {
    // Group transactions by date
    const txByDate: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
        if (!txByDate[tx.date]) txByDate[tx.date] = [];
        txByDate[tx.date].push(tx);
    });
    const sortedDates = Object.keys(txByDate).sort((a, b) => b.localeCompare(a));

    if (transactions.length === 0) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            {sortedDates.map((date) => (
                <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </h3>
                    {txByDate[date].map((tx) => {
                        const isDeposit = tx.type === "deposit";
                        return (
                            <Card key={tx.id} className="bg-card shadow-sm border-0 rounded-2xl">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        {isDeposit ? (
                                            <ArrowDownCircle className="h-4 w-4 text-deposit shrink-0" />
                                        ) : (
                                            <ArrowUpCircle className="h-4 w-4 text-expense shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate flex items-center gap-1">
                                                {isDeposit
                                                    ? <><span>{getMemberName(tx.memberId!)}</span>{trip.fundManagerId === tx.memberId && <FundManagerBadge />}</>
                                                    : `${tx.category}${tx.subcategory ? ` · ${tx.subcategory}` : ""}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {tx.note || (isDeposit ? "Deposit" : `Split: ${tx.splits?.length || 0} members`)}
                                            </p>
                                        </div>
                                        <span className={cn("font-display font-bold text-sm shrink-0", isDeposit ? "text-deposit" : "text-expense")}>
                                            {isDeposit ? "+" : "-"}{tx.amount.toFixed(2)}
                                        </span>
                                        {renderActions && renderActions(tx)}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </motion.div>
            ))}
        </AnimatePresence>
    );
}

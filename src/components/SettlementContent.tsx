import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FundManagerBadge } from "@/components/FundManagerBadge";
import type { Trip } from "@/hooks/useTripStore";
import type { Settlement } from "@/types/trip";

interface SettlementContentProps {
    trip: Trip;
    settlements: Settlement[];
    getMemberName: (id: string) => string;
    /** Optional per-settlement action button (mark paid / undo). If omitted, cards are read-only. */
    renderCardAction?: (settlement: Settlement, index: number) => React.ReactNode;
    /** Optional extra indicator for completed settlements */
    renderCardExtra?: (settlement: Settlement) => React.ReactNode;
    /** Optional CSS class overrides per card */
    getCardClassName?: (settlement: Settlement) => string;
    /** Optional label to display above the list */
    listLabel?: React.ReactNode;
    /** Optional additional content after the list (e.g. completed settlements section) */
    additionalContent?: React.ReactNode;
    /** Optional override for empty state (e.g. "no fund manager" message) */
    emptyStateOverride?: React.ReactNode;
}

export function SettlementContent({
    trip,
    settlements,
    getMemberName,
    renderCardAction,
    renderCardExtra,
    getCardClassName,
    listLabel,
    additionalContent,
    emptyStateOverride,
}: SettlementContentProps) {
    if (emptyStateOverride) {
        return <>{emptyStateOverride}</>;
    }

    if (settlements.length === 0 && !additionalContent) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
                    <PartyPopper className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">All settled up! 🎉</p>
                <p className="text-xs text-muted-foreground">No outstanding balances.</p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-5 pb-4">
            {settlements.length > 0 && (
                <div className="space-y-3">
                    {listLabel && listLabel}
                    {!listLabel && (
                        <p className="text-xs text-muted-foreground">
                            {settlements.length} transaction{settlements.length > 1 ? "s" : ""} to settle:
                        </p>
                    )}
                    <AnimatePresence>
                        {settlements.map((s, i) => {
                            const isSelf = s.fromId === s.toId;
                            return (
                                <motion.div
                                    key={`${s.fromId}_${s.toId}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <Card className={cn(
                                        "bg-card shadow-sm border-0 rounded-2xl",
                                        getCardClassName ? getCardClassName(s) : ""
                                    )}>
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                {isSelf ? (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-display font-semibold inline-flex items-center gap-1">
                                                            {getMemberName(s.fromId)}
                                                            <FundManagerBadge />
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">owes the fund</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                                        <span className="font-display font-semibold inline-flex items-center gap-1">
                                                            {getMemberName(s.fromId)}
                                                            {trip.fundManagerId === s.fromId && <FundManagerBadge />}
                                                        </span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="font-display font-semibold inline-flex items-center gap-1">
                                                            {getMemberName(s.toId)}
                                                            {trip.fundManagerId === s.toId && <FundManagerBadge />}
                                                        </span>
                                                    </div>
                                                )}
                                                <p className={cn(
                                                    "text-lg font-display font-bold mt-0.5",
                                                    s.completed ? "text-muted-foreground line-through" : "gradient-text"
                                                )}>
                                                    {trip.currency} {s.amount.toFixed(2)}
                                                </p>
                                                {renderCardExtra && renderCardExtra(s)}
                                            </div>
                                            {renderCardAction && renderCardAction(s, i)}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
            {additionalContent}
        </div>
    );
}

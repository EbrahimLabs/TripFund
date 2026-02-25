import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Settlement } from "@/types/trip";
import type { Trip } from "@/hooks/useTripStore";

interface SharedTripContextType {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  getStats: () => { totalDeposited: number; totalSpent: number; balance: number };
  getMemberBalances: () => { member: { id: string; name: string }; deposited: number; expenseShare: number; net: number }[];
  getDailyExpenses: () => { date: string; amount: number }[];
  getCategoryBreakdown: () => { category: string; amount: number }[];
  getSettlements: () => Settlement[];
  getMemberName: (id: string) => string;
}

const SharedTripContext = createContext<SharedTripContextType | null>(null);

export function SharedTripProvider({ children }: { children: React.ReactNode }) {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Invalid link"); setLoading(false); return; }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/get-trip-by-invite?token=${token}`;

    fetch(url, {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load trip");
        }
        return res.json();
      })
      .then((data) => { setTrip(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [token]);

  const getStats = useCallback(() => {
    if (!trip) return { totalDeposited: 0, totalSpent: 0, balance: 0 };
    const totalDeposited = trip.transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
    const totalSpent = trip.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { totalDeposited, totalSpent, balance: totalDeposited - totalSpent };
  }, [trip]);

  const getMemberBalances = useCallback(() => {
    if (!trip) return [];
    return trip.members.map((m) => {
      const deposited = trip.transactions.filter((t) => t.type === "deposit" && t.memberId === m.id).reduce((s, t) => s + t.amount, 0);
      const expenseShare = trip.transactions.filter((t) => t.type === "expense").reduce((s, t) => {
        const split = t.splits?.find((sp) => sp.memberId === m.id);
        return s + (split?.shareAmount || 0);
      }, 0);
      return { member: m, deposited, expenseShare, net: deposited - expenseShare };
    });
  }, [trip]);

  const getDailyExpenses = useCallback(() => {
    if (!trip) return [];
    const expenses = trip.transactions.filter((t) => t.type === "expense");
    const byDate: Record<string, number> = {};
    expenses.forEach((e) => { byDate[e.date] = (byDate[e.date] || 0) + e.amount; });
    return Object.entries(byDate).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
  }, [trip]);

  const getCategoryBreakdown = useCallback(() => {
    if (!trip) return [];
    const expenses = trip.transactions.filter((t) => t.type === "expense");
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => { const cat = e.category || "Misc"; byCategory[cat] = (byCategory[cat] || 0) + e.amount; });
    return Object.entries(byCategory).map(([category, amount]) => ({ category, amount }));
  }, [trip]);

  const getSettlements = useCallback((): Settlement[] => {
    if (!trip?.fundManagerId) return [];
    const balances = getMemberBalances();
    const settlements: Settlement[] = [];

    for (const b of balances) {
      if (b.net < -0.01) {
        if (b.member.id === trip.fundManagerId) {
          // Fund manager also owes the fund (self-settlement)
          settlements.push({
            fromId: b.member.id,
            toId: b.member.id,
            amount: Math.round(Math.abs(b.net) * 100) / 100,
            completed: false,
          });
        } else {
          // Member owes the fund manager
          settlements.push({
            fromId: b.member.id,
            toId: trip.fundManagerId,
            amount: Math.round(Math.abs(b.net) * 100) / 100,
            completed: false,
          });
        }
      } else if (b.net > 0.01 && b.member.id !== trip.fundManagerId) {
        // Fund manager owes this member back
        settlements.push({
          fromId: trip.fundManagerId,
          toId: b.member.id,
          amount: Math.round(b.net * 100) / 100,
          completed: false,
        });
      }
    }

    return settlements;
  }, [trip, getMemberBalances]);

  const getMemberName = useCallback((id: string) => {
    return trip?.members.find((m) => m.id === id)?.name || "Unknown";
  }, [trip]);

  return (
    <SharedTripContext.Provider value={{ trip, loading, error, getStats, getMemberBalances, getDailyExpenses, getCategoryBreakdown, getSettlements, getMemberName }}>
      {children}
    </SharedTripContext.Provider>
  );
}

export function useSharedTrip() {
  const ctx = useContext(SharedTripContext);
  if (!ctx) throw new Error("useSharedTrip must be used within SharedTripProvider");
  return ctx;
}

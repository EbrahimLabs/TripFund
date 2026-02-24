import { useState, useEffect, useCallback } from "react";
import { Trip, Transaction, Settlement } from "@/types/trip";

const STORAGE_KEY = "tripfund_trips";
const ACTIVE_TRIP_KEY = "tripfund_active_trip";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function loadTrips(): Trip[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTrips(trips: Trip[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function useTripStore() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_TRIP_KEY)
  );

  useEffect(() => { saveTrips(trips); }, [trips]);
  useEffect(() => {
    if (activeTripId) localStorage.setItem(ACTIVE_TRIP_KEY, activeTripId);
    else localStorage.removeItem(ACTIVE_TRIP_KEY);
  }, [activeTripId]);

  const activeTrip = trips.find((t) => t.id === activeTripId) || null;

  const createTrip = useCallback((name: string, currency: string, memberNames: string[]) => {
    const trip: Trip = {
      id: generateId(),
      name,
      currency,
      members: memberNames.map((n) => ({ id: generateId(), name: n })),
      transactions: [],
      createdAt: new Date().toISOString(),
    };
    setTrips((prev) => [...prev, trip]);
    setActiveTripId(trip.id);
    return trip;
  }, []);

  const updateTrip = useCallback((updater: (trip: Trip) => Trip) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === activeTripId ? updater(t) : t))
    );
  }, [activeTripId]);

  const editTripDetails = useCallback((name: string, currency: string) => {
    updateTrip((t) => ({ ...t, name, currency }));
  }, [updateTrip]);

  const addMember = useCallback((name: string) => {
    updateTrip((t) => ({
      ...t,
      members: [...t.members, { id: generateId(), name }],
    }));
  }, [updateTrip]);

  const renameMember = useCallback((memberId: string, newName: string) => {
    updateTrip((t) => ({
      ...t,
      members: t.members.map((m) => m.id === memberId ? { ...m, name: newName } : m),
    }));
  }, [updateTrip]);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    updateTrip((t) => ({
      ...t,
      transactions: [...t.transactions, { ...tx, id: generateId() }],
    }));
  }, [updateTrip]);

  const updateTransaction = useCallback((txId: string, updates: Partial<Omit<Transaction, "id">>) => {
    updateTrip((t) => ({
      ...t,
      transactions: t.transactions.map((tx) =>
        tx.id === txId ? { ...tx, ...updates } : tx
      ),
    }));
  }, [updateTrip]);

  const deleteTransaction = useCallback((txId: string) => {
    updateTrip((t) => ({
      ...t,
      transactions: t.transactions.filter((tx) => tx.id !== txId),
    }));
  }, [updateTrip]);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    if (activeTripId === tripId) setActiveTripId(null);
  }, [activeTripId]);

  // Computed values
  const getStats = useCallback(() => {
    if (!activeTrip) return { totalDeposited: 0, totalSpent: 0, balance: 0 };
    const totalDeposited = activeTrip.transactions
      .filter((t) => t.type === "deposit")
      .reduce((s, t) => s + t.amount, 0);
    const totalSpent = activeTrip.transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { totalDeposited, totalSpent, balance: totalDeposited - totalSpent };
  }, [activeTrip]);

  const getMemberBalances = useCallback(() => {
    if (!activeTrip) return [];
    return activeTrip.members.map((m) => {
      const deposited = activeTrip.transactions
        .filter((t) => t.type === "deposit" && t.memberId === m.id)
        .reduce((s, t) => s + t.amount, 0);
      const expenseShare = activeTrip.transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => {
          const split = t.splits?.find((sp) => sp.memberId === m.id);
          return s + (split?.shareAmount || 0);
        }, 0);
      return {
        member: m,
        deposited,
        expenseShare,
        net: deposited - expenseShare,
      };
    });
  }, [activeTrip]);

  const getDailyExpenses = useCallback(() => {
    if (!activeTrip) return [];
    const expenses = activeTrip.transactions.filter((t) => t.type === "expense");
    const byDate: Record<string, number> = {};
    expenses.forEach((e) => {
      byDate[e.date] = (byDate[e.date] || 0) + e.amount;
    });
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeTrip]);

  const getCategoryBreakdown = useCallback(() => {
    if (!activeTrip) return [];
    const expenses = activeTrip.transactions.filter((t) => t.type === "expense");
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "Misc";
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });
    return Object.entries(byCategory).map(([category, amount]) => ({ category, amount }));
  }, [activeTrip]);

  const getSettlements = useCallback((): Settlement[] => {
    const balances = getMemberBalances();
    const debtors = balances.filter((b) => b.net < 0).map((b) => ({ ...b }));
    const creditors = balances.filter((b) => b.net > 0).map((b) => ({ ...b }));
    
    debtors.sort((a, b) => a.net - b.net);
    creditors.sort((a, b) => b.net - a.net);

    const settlements: Settlement[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(-debtors[i].net, creditors[j].net);
      if (amount > 0.01) {
        settlements.push({
          fromId: debtors[i].member.id,
          toId: creditors[j].member.id,
          amount: Math.round(amount * 100) / 100,
          completed: false,
        });
      }
      debtors[i].net += amount;
      creditors[j].net -= amount;
      if (Math.abs(debtors[i].net) < 0.01) i++;
      if (Math.abs(creditors[j].net) < 0.01) j++;
    }
    return settlements;
  }, [getMemberBalances]);

  const getMemberName = useCallback((id: string) => {
    return activeTrip?.members.find((m) => m.id === id)?.name || "Unknown";
  }, [activeTrip]);

  return {
    trips,
    activeTrip,
    activeTripId,
    setActiveTripId,
    createTrip,
    editTripDetails,
    addMember,
    renameMember,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTrip,
    getStats,
    getMemberBalances,
    getDailyExpenses,
    getCategoryBreakdown,
    getSettlements,
    getMemberName,
  };
}

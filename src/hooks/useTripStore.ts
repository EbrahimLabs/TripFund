import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { Settlement } from "@/types/trip";

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  display_name: string;
  is_fund_manager: boolean;
}

export interface TripTransaction {
  id: string;
  trip_id: string;
  type: "deposit" | "expense";
  amount: number;
  date: string;
  note: string;
  member_id: string;
  category: string | null;
  subcategory: string | null;
}

export interface ExpenseSplitRow {
  id: string;
  transaction_id: string;
  member_id: string;
  share_amount: number;
}

export interface TripRow {
  id: string;
  name: string;
  currency: string;
  owner_id: string;
  created_at: string;
}

// Composite trip with members & transactions loaded
export interface Trip {
  id: string;
  name: string;
  currency: string;
  owner_id: string;
  created_at: string;
  fundManagerId?: string;
  members: { id: string; name: string }[];
  transactions: {
    id: string;
    type: "deposit" | "expense";
    amount: number;
    date: string;
    note: string;
    memberId?: string;
    category?: string;
    subcategory?: string;
    splits?: { memberId: string; shareAmount: number }[];
  }[];
}

export function useTripStore() {
  const { user } = useAuthContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, _setActiveTripId] = useState<string | null>(
    () => localStorage.getItem("activeTripId")
  );

  const setActiveTripId = useCallback((id: string | null) => {
    _setActiveTripId(id);
    if (id) {
      localStorage.setItem("activeTripId", id);
    } else {
      localStorage.removeItem("activeTripId");
    }
  }, []);
  const [loading, setLoading] = useState(true);

  const activeTrip = trips.find((t) => t.id === activeTripId) || null;
  const isOwner = activeTrip ? activeTrip.owner_id === user?.id : true;

  // Load trips for the current user
  const loadTrips = useCallback(async () => {
    if (!user) { setTrips([]); setLoading(false); return; }
    setLoading(true);

    const { data: tripRows } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (!tripRows || tripRows.length === 0) { setTrips([]); setLoading(false); return; }

    const tripIds = tripRows.map((t: any) => t.id);

    const [{ data: members }, { data: transactions }] = await Promise.all([
      supabase.from("trip_members").select("*").in("trip_id", tripIds),
      supabase.from("transactions").select("*").in("trip_id", tripIds),
    ]);

    const txIds = (transactions || []).filter((t: any) => t.type === "expense").map((t: any) => t.id);
    let splits: any[] = [];
    if (txIds.length > 0) {
      const { data } = await supabase.from("expense_splits").select("*").in("transaction_id", txIds);
      splits = data || [];
    }

    const compositeTrips: Trip[] = tripRows.map((tr: any) => {
      const tripMembers = (members || []).filter((m: any) => m.trip_id === tr.id);
      const tripTxns = (transactions || []).filter((t: any) => t.trip_id === tr.id);
      const fundManager = tripMembers.find((m: any) => m.is_fund_manager);

      return {
        id: tr.id,
        name: tr.name,
        currency: tr.currency,
        owner_id: tr.owner_id,
        created_at: tr.created_at,
        fundManagerId: fundManager?.id,
        members: tripMembers.map((m: any) => ({ id: m.id, name: m.display_name })),
        transactions: tripTxns.map((t: any) => {
          const txSplits = splits.filter((s: any) => s.transaction_id === t.id);
          return {
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            date: t.date,
            note: t.note || "",
            memberId: t.member_id,
            category: t.category,
            subcategory: t.subcategory,
            splits: txSplits.length > 0
              ? txSplits.map((s: any) => ({ memberId: s.member_id, shareAmount: Number(s.share_amount) }))
              : undefined,
          };
        }),
      };
    });

    setTrips(compositeTrips);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const createTrip = useCallback(async (name: string, currency: string, memberNames: string[], fundManagerIndex?: number) => {
    if (!user) return null;

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({ name, currency, owner_id: user.id })
      .select()
      .single();

    if (error || !trip) { if (import.meta.env.DEV) console.error(error); return null; }

    const memberInserts = memberNames.map((n, i) => ({
      trip_id: trip.id,
      display_name: n,
      is_fund_manager: fundManagerIndex !== undefined && fundManagerIndex === i,
      user_id: i === 0 ? user.id : null, // first member is the creator
    }));

    await supabase.from("trip_members").insert(memberInserts);
    await loadTrips();
    setActiveTripId(trip.id);
    return trip;
  }, [user, loadTrips]);

  const editTripDetails = useCallback(async (name: string, currency: string) => {
    if (!activeTripId) return;
    await supabase.from("trips").update({ name, currency }).eq("id", activeTripId);
    await loadTrips();
  }, [activeTripId, loadTrips]);

  const setFundManager = useCallback(async (memberId: string | undefined) => {
    if (!activeTripId) return;
    // Clear all fund managers for this trip
    await supabase.from("trip_members").update({ is_fund_manager: false }).eq("trip_id", activeTripId);
    if (memberId) {
      await supabase.from("trip_members").update({ is_fund_manager: true }).eq("id", memberId);
    }
    await loadTrips();
  }, [activeTripId, loadTrips]);

  const addMember = useCallback(async (name: string) => {
    if (!activeTripId) return;
    await supabase.from("trip_members").insert({ trip_id: activeTripId, display_name: name });
    await loadTrips();
  }, [activeTripId, loadTrips]);

  const renameMember = useCallback(async (memberId: string, newName: string) => {
    await supabase.from("trip_members").update({ display_name: newName }).eq("id", memberId);
    await loadTrips();
  }, [loadTrips]);

  const addTransaction = useCallback(async (tx: {
    type: "deposit" | "expense";
    amount: number;
    date: string;
    note: string;
    memberId?: string;
    category?: string;
    subcategory?: string;
    splits?: { memberId: string; shareAmount: number }[];
  }) => {
    if (!activeTripId) return;

    // For deposits, memberId is the depositor. For expenses, we use the first member or a placeholder.
    const memberId = tx.memberId || activeTrip?.members[0]?.id;
    if (!memberId) return;

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert({
        trip_id: activeTripId,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        note: tx.note || "",
        member_id: memberId,
        category: tx.category || null,
        subcategory: tx.subcategory || null,
      })
      .select()
      .single();

    if (error || !inserted) { if (import.meta.env.DEV) console.error(error); return; }

    if (tx.splits && tx.splits.length > 0) {
      const splitInserts = tx.splits.map((s) => ({
        transaction_id: inserted.id,
        member_id: s.memberId,
        share_amount: s.shareAmount,
      }));
      await supabase.from("expense_splits").insert(splitInserts);
    }

    await loadTrips();
  }, [activeTripId, activeTrip, loadTrips]);

  const updateTransaction = useCallback(async (txId: string, updates: {
    amount?: number;
    note?: string;
    splits?: { memberId: string; shareAmount: number }[];
  }) => {
    const updateObj: any = {};
    if (updates.amount !== undefined) updateObj.amount = updates.amount;
    if (updates.note !== undefined) updateObj.note = updates.note;

    if (Object.keys(updateObj).length > 0) {
      await supabase.from("transactions").update(updateObj).eq("id", txId);
    }

    if (updates.splits) {
      await supabase.from("expense_splits").delete().eq("transaction_id", txId);
      const splitInserts = updates.splits.map((s) => ({
        transaction_id: txId,
        member_id: s.memberId,
        share_amount: s.shareAmount,
      }));
      if (splitInserts.length > 0) {
        await supabase.from("expense_splits").insert(splitInserts);
      }
    }

    await loadTrips();
  }, [loadTrips]);

  const deleteTransaction = useCallback(async (txId: string) => {
    await supabase.from("transactions").delete().eq("id", txId);
    await loadTrips();
  }, [loadTrips]);

  const deleteTrip = useCallback(async (tripId: string) => {
    await supabase.from("trips").delete().eq("id", tripId);
    if (activeTripId === tripId) setActiveTripId(null);
    await loadTrips();
  }, [activeTripId, loadTrips]);

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
      return { member: m, deposited, expenseShare, net: deposited - expenseShare };
    });
  }, [activeTrip]);

  const getDailyExpenses = useCallback(() => {
    if (!activeTrip) return [];
    const expenses = activeTrip.transactions.filter((t) => t.type === "expense");
    const byDate: Record<string, number> = {};
    expenses.forEach((e) => { byDate[e.date] = (byDate[e.date] || 0) + e.amount; });
    return Object.entries(byDate).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
  }, [activeTrip]);

  const getCategoryBreakdown = useCallback(() => {
    if (!activeTrip) return [];
    const expenses = activeTrip.transactions.filter((t) => t.type === "expense");
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => { const cat = e.category || "Misc"; byCategory[cat] = (byCategory[cat] || 0) + e.amount; });
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
        settlements.push({ fromId: debtors[i].member.id, toId: creditors[j].member.id, amount: Math.round(amount * 100) / 100, completed: false });
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

  const createInvite = useCallback(async (memberId?: string) => {
    if (!activeTripId) return null;
    const insertObj: any = { trip_id: activeTripId };
    if (memberId) insertObj.member_id = memberId;
    const { data, error } = await supabase
      .from("trip_invites")
      .insert(insertObj)
      .select("token")
      .single();
    if (error || !data) { if (import.meta.env.DEV) console.error(error); return null; }
    return data.token;
  }, [activeTripId]);

  const getMemberUserIds = useCallback(async () => {
    if (!activeTripId) return {};
    const { data } = await supabase
      .from("trip_members")
      .select("id, user_id")
      .eq("trip_id", activeTripId);
    const map: Record<string, string | null> = {};
    (data || []).forEach((m: any) => { map[m.id] = m.user_id; });
    return map;
  }, [activeTripId]);

  return {
    trips,
    activeTrip,
    activeTripId,
    loading,
    setActiveTripId,
    createTrip,
    setFundManager,
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
    isOwner,
    refreshTrips: loadTrips,
    createInvite,
    getMemberUserIds,
  };
}

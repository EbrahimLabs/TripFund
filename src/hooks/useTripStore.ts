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
    createdAt?: string;
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

  // Helper to update a single trip in state
  const updateTripInState = useCallback((tripId: string, updater: (trip: Trip) => Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updater(t) : t)));
  }, []);

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
            createdAt: t.created_at,
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
      user_id: i === 0 ? user.id : null,
    }));

    const { data: insertedMembers } = await supabase.from("trip_members").insert(memberInserts).select();

    const fundMember = (insertedMembers || []).find((m: any) => m.is_fund_manager);

    // Optimistic: add the new trip to state immediately
    const newTrip: Trip = {
      id: trip.id,
      name: trip.name,
      currency: trip.currency,
      owner_id: trip.owner_id,
      created_at: trip.created_at,
      fundManagerId: fundMember?.id,
      members: (insertedMembers || []).map((m: any) => ({ id: m.id, name: m.display_name })),
      transactions: [],
    };
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(trip.id);
    return trip;
  }, [user]);

  const editTripDetails = useCallback(async (name: string, currency: string) => {
    if (!activeTripId) return;
    await supabase.from("trips").update({ name, currency }).eq("id", activeTripId);
    // Optimistic update
    updateTripInState(activeTripId, (t) => ({ ...t, name, currency }));
  }, [activeTripId, updateTripInState]);

  const setFundManager = useCallback(async (memberId: string | undefined) => {
    if (!activeTripId) return;
    await supabase.from("trip_members").update({ is_fund_manager: false }).eq("trip_id", activeTripId);
    if (memberId) {
      await supabase.from("trip_members").update({ is_fund_manager: true }).eq("id", memberId);
    }
    // Optimistic update
    updateTripInState(activeTripId, (t) => ({ ...t, fundManagerId: memberId }));
  }, [activeTripId, updateTripInState]);

  const addMember = useCallback(async (name: string) => {
    if (!activeTripId) return;
    const { data: inserted } = await supabase.from("trip_members").insert({ trip_id: activeTripId, display_name: name }).select().single();
    if (inserted) {
      updateTripInState(activeTripId, (t) => ({
        ...t,
        members: [...t.members, { id: inserted.id, name: inserted.display_name }],
      }));
    }
  }, [activeTripId, updateTripInState]);

  const renameMember = useCallback(async (memberId: string, newName: string) => {
    await supabase.from("trip_members").update({ display_name: newName }).eq("id", memberId);
    // Optimistic update across all trips
    setTrips((prev) => prev.map((t) => ({
      ...t,
      members: t.members.map((m) => (m.id === memberId ? { ...m, name: newName } : m)),
    })));
  }, []);

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

    let insertedSplits: { memberId: string; shareAmount: number }[] | undefined;
    if (tx.splits && tx.splits.length > 0) {
      const splitInserts = tx.splits.map((s) => ({
        transaction_id: inserted.id,
        member_id: s.memberId,
        share_amount: s.shareAmount,
      }));
      await supabase.from("expense_splits").insert(splitInserts);
      insertedSplits = tx.splits;
    }

    // Optimistic update
    const newTx = {
      id: inserted.id,
      type: tx.type as "deposit" | "expense",
      amount: tx.amount,
      date: tx.date,
      note: tx.note || "",
      memberId,
      category: tx.category,
      subcategory: tx.subcategory,
      createdAt: inserted.created_at || new Date().toISOString(),
      splits: insertedSplits,
    };

    updateTripInState(activeTripId, (t) => ({
      ...t,
      transactions: [...t.transactions, newTx],
    }));

    return inserted.id;
  }, [activeTripId, activeTrip, updateTripInState]);

  // Batch add deposits for multiple members at once (single state update)
  const addBatchDeposits = useCallback(async (deposits: {
    amount: number;
    date: string;
    note: string;
    memberIds: string[];
  }) => {
    if (!activeTripId) return;

    const insertRows = deposits.memberIds.map((mid) => ({
      trip_id: activeTripId,
      type: "deposit" as const,
      amount: deposits.amount,
      date: deposits.date,
      note: deposits.note || "",
      member_id: mid,
    }));

    const { data: insertedRows, error } = await supabase
      .from("transactions")
      .insert(insertRows)
      .select();

    if (error || !insertedRows) { if (import.meta.env.DEV) console.error(error); return; }

    // Single optimistic state update for all deposits
    const newTxs = insertedRows.map((row: any) => ({
      id: row.id,
      type: "deposit" as const,
      amount: Number(row.amount),
      date: row.date,
      note: row.note || "",
      memberId: row.member_id,
      category: undefined,
      subcategory: undefined,
      createdAt: row.created_at || new Date().toISOString(),
      splits: undefined,
    }));

    updateTripInState(activeTripId, (t) => ({
      ...t,
      transactions: [...t.transactions, ...newTxs],
    }));
  }, [activeTripId, updateTripInState]);

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

    // Optimistic update
    setTrips((prev) => prev.map((t) => ({
      ...t,
      transactions: t.transactions.map((tx) => {
        if (tx.id !== txId) return tx;
        return {
          ...tx,
          ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
          ...(updates.note !== undefined ? { note: updates.note } : {}),
          ...(updates.splits ? { splits: updates.splits } : {}),
        };
      }),
    })));
  }, []);

  const deleteTransaction = useCallback(async (txId: string) => {
    await supabase.from("transactions").delete().eq("id", txId);
    // Optimistic update
    setTrips((prev) => prev.map((t) => ({
      ...t,
      transactions: t.transactions.filter((tx) => tx.id !== txId),
    })));
  }, []);

  const deleteTrip = useCallback(async (tripId: string) => {
    await supabase.from("trips").delete().eq("id", tripId);
    if (activeTripId === tripId) setActiveTripId(null);
    // Optimistic update
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
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
    if (!activeTrip?.fundManagerId) return [];
    const balances = getMemberBalances();
    const settlements: Settlement[] = [];

    for (const b of balances) {
      if (b.net < -0.01) {
        if (b.member.id === activeTrip.fundManagerId) {
          settlements.push({
            fromId: b.member.id,
            toId: b.member.id,
            amount: Math.round(Math.abs(b.net) * 100) / 100,
            completed: false,
          });
        } else {
          settlements.push({
            fromId: b.member.id,
            toId: activeTrip.fundManagerId,
            amount: Math.round(Math.abs(b.net) * 100) / 100,
            completed: false,
          });
        }
      } else if (b.net > 0.01 && b.member.id !== activeTrip.fundManagerId) {
        settlements.push({
          fromId: activeTrip.fundManagerId,
          toId: b.member.id,
          amount: Math.round(b.net * 100) / 100,
          completed: false,
        });
      }
    }

    return settlements;
  }, [activeTrip, getMemberBalances]);

  const SETTLEMENT_TX_KEY = "tripfund_settlement_txns";

  const getSettlementTxMap = useCallback((): Record<string, string> => {
    if (!activeTripId) return {};
    try {
      const data = localStorage.getItem(SETTLEMENT_TX_KEY);
      const all = data ? JSON.parse(data) : {};
      return all[activeTripId] || {};
    } catch { return {}; }
  }, [activeTripId]);

  const saveSettlementTxMap = useCallback((map: Record<string, string>) => {
    if (!activeTripId) return;
    try {
      const data = localStorage.getItem(SETTLEMENT_TX_KEY);
      const all = data ? JSON.parse(data) : {};
      all[activeTripId] = map;
      localStorage.setItem(SETTLEMENT_TX_KEY, JSON.stringify(all));
    } catch { }
  }, [activeTripId]);

  const markSettlementPaid = useCallback(async (fromId: string, toId: string, amount: number) => {
    if (!activeTripId) return;
    const key = `${fromId}_${toId}`;

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert({
        trip_id: activeTripId,
        type: "deposit",
        amount,
        date: new Date().toISOString().split("T")[0],
        note: "[Settlement]",
        member_id: fromId,
      })
      .select()
      .single();

    if (error || !inserted) { if (import.meta.env.DEV) console.error(error); return; }

    const map = getSettlementTxMap();
    map[key] = inserted.id;
    saveSettlementTxMap(map);

    // Optimistic update
    updateTripInState(activeTripId, (t) => ({
      ...t,
      transactions: [...t.transactions, {
        id: inserted.id,
        type: "deposit" as const,
        amount,
        date: new Date().toISOString().split("T")[0],
        note: "[Settlement]",
        memberId: fromId,
        createdAt: inserted.created_at || new Date().toISOString(),
      }],
    }));
  }, [activeTripId, getSettlementTxMap, saveSettlementTxMap, updateTripInState]);

  const unmarkSettlementPaid = useCallback(async (fromId: string, toId: string) => {
    if (!activeTripId) return;
    const key = `${fromId}_${toId}`;
    const map = getSettlementTxMap();
    const txId = map[key];

    if (txId) {
      await supabase.from("transactions").delete().eq("id", txId);
      delete map[key];
      saveSettlementTxMap(map);

      // Optimistic update
      updateTripInState(activeTripId, (t) => ({
        ...t,
        transactions: t.transactions.filter((tx) => tx.id !== txId),
      }));
    }
  }, [activeTripId, getSettlementTxMap, saveSettlementTxMap, updateTripInState]);

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
    addBatchDeposits,
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
    markSettlementPaid,
    unmarkSettlementPaid,
    getSettlementTxMap,
  };
}

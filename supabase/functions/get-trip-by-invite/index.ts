import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token and get trip_id
    const { data: invite, error: inviteErr } = await supabase
      .from("trip_invites")
      .select("trip_id, expires_at")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invite has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tripId = invite.trip_id;

    // Fetch trip, members, transactions, splits in parallel
    const [tripRes, membersRes, transactionsRes] = await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase.from("trip_members").select("*").eq("trip_id", tripId),
      supabase.from("transactions").select("*").eq("trip_id", tripId),
    ]);

    if (tripRes.error || !tripRes.data) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expenseTxIds = (transactionsRes.data || [])
      .filter((t: any) => t.type === "expense")
      .map((t: any) => t.id);

    let splits: any[] = [];
    if (expenseTxIds.length > 0) {
      const { data } = await supabase
        .from("expense_splits")
        .select("*")
        .in("transaction_id", expenseTxIds);
      splits = data || [];
    }

    const trip = tripRes.data;
    const members = membersRes.data || [];
    const transactions = transactionsRes.data || [];
    const fundManager = members.find((m: any) => m.is_fund_manager);

    const result = {
      id: trip.id,
      name: trip.name,
      currency: trip.currency,
      owner_id: trip.owner_id,
      created_at: trip.created_at,
      fundManagerId: fundManager?.id || undefined,
      members: members.map((m: any) => ({ id: m.id, name: m.display_name })),
      transactions: transactions.map((t: any) => {
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
            ? txSplits.map((s: any) => ({
                memberId: s.member_id,
                shareAmount: Number(s.share_amount),
              }))
            : undefined,
        };
      }),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



## Allow Anyone with the Link to View the Trip Portal (No Sign-In)

Currently, the invite link shows a "Sign In to Join" prompt for unauthenticated users. The goal is to make anyone with the link immediately see the trip data (dashboard, settlements, summary) as a read-only viewer, with no authentication required.

### Approach

Create a **guest trip portal** accessible at `/shared/:token/*` that fetches trip data via a backend function using the invite token, bypassing authentication entirely.

### Changes

**1. Backend function: `get-trip-by-invite` (new edge function)**
- Accepts an invite token as a query parameter
- Validates the token exists, is not expired
- Returns the full trip data: trip details, members, transactions, expense splits
- Uses the service role key to bypass RLS (since there's no authenticated user)
- Does NOT mark the invite as "accepted" (it's just viewing)

**2. New route structure in `src/App.tsx`**
- Add `/shared/:token/*` routes outside of `ProtectedRoute`, rendering a `SharedTripLayout` with sub-routes for dashboard, settle, and summary
- These routes use a `SharedTripProvider` instead of the auth-dependent `TripProvider`

**3. `src/context/SharedTripContext.tsx` (new file)**
- A context that fetches trip data from the `get-trip-by-invite` edge function using the token from URL params
- Exposes the same computed values (stats, member balances, daily expenses, category breakdown, settlements) so existing UI components can be reused
- Read-only: no mutation functions (no add/edit/delete)

**4. Update `src/pages/InvitePage.tsx`**
- Instead of showing "Sign In to Join", immediately redirect to `/shared/:token/dashboard`
- The invite page becomes a simple redirect

**5. Shared pages (new files)**
- `src/pages/shared/SharedDashboard.tsx` — reuses dashboard UI but pulls from `SharedTripContext`
- `src/pages/shared/SharedSettle.tsx` — read-only settlement view
- `src/pages/shared/SharedSummary.tsx` — read-only summary view
- These pages use the same visual components but without owner actions (no deposit/expense buttons, no settings)
- Bottom nav shows only: Dashboard, Settle, Summary (no Deposit/Expense)

**6. No sidebar for shared view**
- The `AppShell` wrapper (with sidebar) is not used for shared routes
- Shared pages get a simpler layout without the management sidebar

### Technical Detail

The edge function query pattern:
```sql
-- Validate token, get trip_id
SELECT trip_id FROM trip_invites WHERE token = :token AND expires_at > now()
-- Then fetch trip + members + transactions + splits for that trip_id
```

The shared context exposes a subset of `useTripStore` return type — only the read functions (`getStats`, `getMemberBalances`, `getDailyExpenses`, `getCategoryBreakdown`, `getSettlements`, `getMemberName`) computed from the fetched data, with no write operations.


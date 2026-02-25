

## Admin vs Member Portal

### Current Problem
Right now, when an invited member accepts a link and logs in, they see the exact same UI as the trip owner -- including the ability to add deposits, expenses, edit transactions, and manage trip settings. There is no role distinction in the UI.

### How It Will Work

**Role detection** -- no new database tables needed. The existing data already tells us everything:

- **Admin (Trip Owner)**: `trips.owner_id === auth.uid()` -- full access to everything
- **Member**: `trip_members.user_id === auth.uid()` AND NOT the owner -- read-only view

**What members CAN see:**
- Dashboard with balances, charts, category breakdown
- Settlement page (view who owes whom)
- Summary page (view all transactions, search/filter -- but NOT edit or delete)

**What members CANNOT do:**
- Add deposits (Deposit tab hidden from bottom nav)
- Add expenses (Expense tab hidden from bottom nav)
- Edit or delete transactions on Summary page
- Access Trip Settings (settings gear hidden)
- Delete the trip
- Manage members or send invites

**What members CAN still do:**
- View their own balance and the overall trip status
- Browse settlements and summary
- Access their own account page (profile, password, sign out)

### Implementation Details

#### 1. Add `isOwner` flag to the trip store
In `useTripStore.ts`, expose a computed boolean:
```
isOwner = activeTrip?.owner_id === user?.id
```
This is already available since `Trip` has `owner_id` and `useAuth` has `user.id`.

#### 2. Expose `isOwner` through context
`TripContext` already passes through the full store return. Just add `isOwner` to the return of `useTripStore`.

#### 3. Conditional bottom navigation
`BottomNav.tsx` will filter out `/deposit` and `/expense` tabs when the user is not the owner. Members see 3 tabs: Dashboard, Settle, Summary.

#### 4. Conditional dashboard UI
`TripDashboard.tsx`:
- Hide the Settings gear button for non-owners
- Hide the "Leave trip" / logout button behavior stays the same (navigates to home)

#### 5. Read-only Summary page
`SummaryPage.tsx`:
- Hide Edit (pencil) and Delete (trash) buttons on each transaction for non-owners
- Hide the Share button stays visible for everyone

#### 6. Route guards
`App.tsx`:
- `/deposit` and `/expense` routes redirect non-owners to `/dashboard`

#### 7. Member home page experience
When a linked member logs in and goes to `/` (Index page):
- They see trips where they are a member (already works via RLS `is_trip_member`)
- They cannot create new trips (hide "New Trip" button for trips they don't own -- actually, members should still be able to create their OWN trips, so "New Trip" stays)
- The trip card click works the same way

#### Files to modify:
- `src/hooks/useTripStore.ts` -- add `isOwner` computed property
- `src/components/BottomNav.tsx` -- conditionally show/hide Deposit & Expense tabs
- `src/pages/TripDashboard.tsx` -- hide Settings for non-owners
- `src/pages/SummaryPage.tsx` -- hide edit/delete for non-owners
- `src/App.tsx` -- add route guard for `/deposit` and `/expense`

No database changes needed. No new pages needed. The invite system already handles the "single entry point" for members.


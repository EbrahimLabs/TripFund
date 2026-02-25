
## Sidebar Navigation + Simplified Sharing

### Completed Changes

1. **Sidebar replaces bottom nav & topbar actions** — Hamburger menu in header opens a slide-out sidebar with navigation (Dashboard, Deposit, Expense, Settle, Summary), manage section (Settings, Share Trip Link), and footer (Theme toggle, Account, Leave Trip). Owner-only items are conditionally hidden.

2. **Dedicated Settings page** — Trip settings moved from a sheet in TripDashboard to `/settings` route. Contains General, Members, and Categories tabs.

3. **Single share link** — Replaced per-member invite system with a single trip-wide share link. Anyone with the link can join as a new member with read-only access. Uses `accept_trip_invite` database function for secure member creation.

4. **Role-based access** — `isOwner` flag controls visibility of Deposit, Expense, Settings routes and sidebar items. Non-owners see Dashboard, Settle, Summary only.

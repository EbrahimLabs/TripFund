# TripFund - Application Context

## Overview
TripFund is a modern, mobile-first web application designed for group trip expense tracking and settlement. It allows users to create trips, invite members, add deposits (pool money), record expenses with itemized splits, and calculate the easiest way to settle debts at the end of the trip.

## Tech Stack
- **Frontend Framework:** React (Vite-based)
- **Routing:** React Router v6 (`react-router-dom`)
- **Styling:** Tailwind CSS with custom glassmorphic and gradient utilities (`index.css`)
- **UI Components:** Radix UI primitives bundled via shadcn/ui.
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts
- **State Management & Backend integration:** Context API (`TripContext`, `AuthContext`, `SharedTripContext`) integrated with Supabase. 
- **Database/Auth:** Supabase (assumed based on `.env` and `supabase/` folders).
- **Data Fetching:** React Query (TanStack Query) is configured in `App.tsx`.

## Core Data Models
Refer to `src/types/trip.ts`:
- **Trip:** The core entity. Contains an `id`, `name`, `currency`, `fundManagerId`, `createdAt`, list of `members`, and list of `transactions`.
- **Member:** Represents a participant in the trip (`id`, `name`).
- **Transaction:** Represents either money pooled in or money spent.
  - **Type:** `"deposit"` or `"expense"`.
  - **Amount:** The total money involved.
  - **MemberId:** The person who deposited the money (if `type === "deposit"`).
  - **Category / Subcategory:** Metadata for expenses.
  - **Splits:** How an expense is divided among members `ExpenseSplit[]`. Each split has `memberId` and `shareAmount`.
- **Settlement:** Represents calculated optimal debt repayment (`fromId`, `toId`, `amount`, `completed`).

## Project Structure
- `src/App.tsx`: Main entry point handling routing, providers, and authentication layout boundaries (`ProtectedRoute`, `AuthRoute`, `OwnerRoute`).
- `src/pages/`: Contains all main application views.
  - `TripDashboard.tsx`: High-level overview of the trip's finances, showing total balance, charts, and member net balances.
  - `AddDeposit.tsx` / `AddExpense.tsx`: Forms for adding new transactions.
  - `SettlementPage.tsx`: Calculates and displays who owes whom.
  - `SummaryPage.tsx`: Detailed chronological feed of all transactions.
- `src/components/`: Reusable UI elements (`PageShell`, `BottomNav`, `AppSidebar`) and the `ui/` folder for shadcn components.
- `src/context/`: Context providers encapsulating state and business logic (`TripContext` handles all aggregations like `getStats`, `getMemberBalances`, etc.).

## Design System & Aesthetics
- **Theme:** Uses a highly polished dark mode with glassmorphic effects (`.glass`, `.card-elevated`) and vibrant primary gradients (`.gradient-hero`, `.glow-primary`).
- **Layout:** Mobile-first approach with a `BottomNav` for primary navigation on smaller screens, and `AppSidebar` for larger viewports. Wrapped in a standard `PageShell`.

## Extensibility Notes
When adding new features or pages:
1. Wrap new views in `PageShell` for the header/title layout.
2. Include `BottomNav` at the bottom of standard views.
3. Access trip data consistently via `const { activeTrip, ... } = useTrip()`.
4. Ensure new routes are properly authenticated in `App.tsx` (usually under `TripLayout`).



Based on exploring the codebase, here's what the app currently has and what features could enhance it:

**Current capabilities:** Trip creation, member management, fund manager designation, deposits, expenses with categories/subcategories, settlement calculations, summary/history, daily spending charts, and category breakdowns.

Here are practical features that would add real value:

---

### 1. Transaction Editing & Deletion
Currently transactions can only be added. Allow users to tap a transaction in the summary to edit amounts, dates, categories, or delete it entirely with a confirmation dialog.

### 2. Receipt Photo Attachments
Let users attach a photo (from camera or gallery) to each expense. Store as base64 in localStorage or use browser file storage. Show a thumbnail on the transaction card.

### 3. Export Trip Report (PDF / CSV)
Generate a downloadable summary of the trip — all transactions, member balances, settlements, and category breakdown — as a CSV or styled PDF.

### 4. Trip History & Archive
Allow completed trips to be archived. Show a separate "Past Trips" section on the home screen so the active trip list stays clean.

### 5. Split Customization Improvements
Currently expenses split evenly. Add options for:
- **Unequal splits** (manual amounts per person)
- **Percentage-based splits**
- **Exclude members** from specific expenses (e.g., someone didn't eat dinner)

### 6. Recurring / Template Expenses
For daily costs like hotel or transport, let users save an expense as a template and quickly re-add it with one tap.

### 7. Notes & Comments on Transactions
Add a richer note field or allow members to tag who was involved, add context like "paid at airport" etc.

### 8. Dark Mode Toggle
The app uses a clean light theme. Adding a dark mode toggle (using `next-themes` which is already installed) would improve usability at night.

### 9. Search & Filter Transactions
In the summary page, add search by note/category and filters by date range, member, or transaction type.

### 10. Settlement Tracking (Mark as Paid)
Allow users to mark individual settlements as "completed" so the group can track who has actually paid back whom.

---

### Recommended priority order
1. Split customization (high practical value)
2. Transaction editing/deletion (essential UX)
3. Settlement tracking (completes the flow)
4. Export report (trip conclusion feature)
5. Dark mode (quick win, dependency already installed)


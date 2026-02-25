

## Top Bar UI Improvement Plan

### Current State
The top bar (`PageShell`) is a thin sticky header with:
- Trip name as gradient text (left)
- Small 8x8 ghost icon buttons for theme toggle + action buttons (right)
- `glass-strong` background with `px-4 py-3` padding
- On the Index page, the top bar is just two tiny icons floating in the top-right corner

The result feels cramped, utilitarian, and lacks visual identity. The icons are tiny (h-4 w-4 inside h-8 w-8 buttons) and hard to tap on mobile.

### Proposed Changes

**1. Redesigned `PageShell` header**
- Add a back arrow (ChevronLeft or ArrowLeft from Lucide) on the left for sub-pages, giving clear navigation context
- Make the title centered and slightly larger with better font weight
- Increase touch target sizes from h-8 w-8 to h-9 w-9 with rounded-xl shape
- Add a subtle bottom border separator using the glass-border variable
- Increase vertical padding from py-3 to py-3.5 for more breathing room
- Add a Framer Motion fade-in on the title for polish

**2. Redesigned Index page top bar**
- Replace the floating icons with a proper top bar that includes the TripFund logo/icon (small Wallet icon) on the left, "TripFund" text, and action icons on the right
- Consistent styling with PageShell header

**3. Dashboard-specific header enhancement**
- Show a compact version of the trip name with a small MapPin icon prefix
- Keep Settings and LogOut as action icons but with improved sizing

### Files to Modify

| File | Change |
|------|--------|
| `src/components/PageShell.tsx` | Redesign header layout: optional back button, centered or left-aligned title with icon, larger touch targets, motion animation, bottom separator |
| `src/pages/Index.tsx` | Replace floating top-right icons with a consistent top bar matching PageShell style |
| `src/pages/TripDashboard.tsx` | Add MapPin icon next to trip name in the action prop |

### Technical Details

**PageShell updates:**
- Add optional `backTo` prop (string path) to show a back button
- Add optional `icon` prop (LucideIcon) to show an icon before the title
- Wrap title in `motion.h1` with a subtle fade-in
- Increase button sizes: `h-9 w-9` with `rounded-xl`
- Icon sizes inside buttons: `h-[18px] w-[18px]` for better tap targets

**Index page updates:**
- Move the theme toggle and sign-out into a proper sticky top bar with `glass-strong` styling
- Add small Wallet icon + "TripFund" branding on the left side of the bar

**Animations:**
- `motion.h1` with `initial={{ opacity: 0, x: -8 }}` and `animate={{ opacity: 1, x: 0 }}` for the page title
- Spring transition for smoothness


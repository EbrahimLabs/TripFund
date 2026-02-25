

## Make the Header Feel Integrated (Not Separated)

The header currently feels visually disconnected because of two things:
1. The `glass-strong` class gives it a distinct frosted background
2. An explicit `borderBottom: 1px solid var(--glass-border)` draws a hard line

### Changes

**`src/components/PageShell.tsx`** (line 25):
- Remove the inline `style={{ borderBottom: '1px solid var(--glass-border)' }}`
- Replace `glass-strong` with a transparent background that blends into the page
- Use a subtle bottom fade/gradient shadow instead of a hard border, so the header melts into the content

**`src/pages/Index.tsx`** (header around line 68):
- Apply the same treatment: remove `glass-strong` and the border style from the fixed header
- Use the same subtle fade approach

The result: the header will still be sticky and readable (via a soft backdrop blur) but will no longer look like a separate bar sitting on top of the page. Instead it will blend seamlessly into the `mesh-bg` background with just a gentle fade at the bottom edge.


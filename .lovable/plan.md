

## Account Management & Member Invite System

### Current State
- Auth exists: email/password + Google OAuth sign-in
- `profiles` table has: `id`, `display_name`, `avatar_url`, `created_at`, `updated_at`
- `trip_members` has a nullable `user_id` column (linking members to accounts)
- No account management page exists
- No invite system exists

### Plan

#### 1. Account/Profile Page (`src/pages/AccountPage.tsx`)
A new page accessible from the home screen header, containing:
- **Display name**: editable field, saves to `profiles.display_name`
- **Email**: shown read-only from `user.email`
- **Change password**: form with current password not required (uses `supabase.auth.updateUser`)
- **Sign out**: button
- **Delete account**: confirmation dialog, then calls a backend function to delete the user and cascade data

Route: `/account` (protected)

#### 2. Delete Account Backend Function
A backend function (`delete-account`) that:
- Verifies the authenticated user
- Deletes the user from `auth.users` (cascades to profiles, trip_members via FK)
- Uses the service role key to perform admin-level deletion

#### 3. Invite Members via Link
**How it works:**
1. Trip owner taps "Invite" on a trip member in settings
2. System generates a unique invite token stored in a new `trip_invites` table
3. A shareable link is generated (e.g., `https://tripfund.lovable.app/invite/{token}`)
4. When someone opens the link:
   - If not logged in: redirected to auth page, then back to invite
   - If logged in: shown the trip name and a "Join" button
   - On join: their `user_id` is linked to the matching `trip_member` row

**Database migration:**
```sql
CREATE TABLE public.trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.trip_members(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;

-- Trip owners can create invites
CREATE POLICY "Trip owners can manage invites"
  ON public.trip_invites FOR ALL TO authenticated
  USING (trip_id IN (SELECT id FROM public.trips WHERE owner_id = auth.uid()));

-- Anyone authenticated can read invites by token (to accept)
CREATE POLICY "Authenticated users can view invites by token"
  ON public.trip_invites FOR SELECT TO authenticated
  USING (true);
```

#### 4. Invite Page (`src/pages/InvitePage.tsx`)
- Route: `/invite/:token`
- Fetches invite details (trip name, member name)
- If expired or already accepted: shows error
- Otherwise: "Join as {member_name}" button
- On accept: updates `trip_members.user_id` and `trip_invites.accepted_by`

#### 5. UI Changes

**Home page header** (`src/pages/Index.tsx`):
- Add a user avatar/icon button that navigates to `/account`

**Trip Settings members tab** (`src/pages/TripDashboard.tsx`):
- Add "Invite" button next to each unlinked member (no `user_id`)
- Shows a share sheet with the invite link (using `navigator.share` or copy-to-clipboard)
- Members already linked show a "Linked" badge

**App router** (`src/App.tsx`):
- Add `/account` route (protected)
- Add `/invite/:token` route (protected, inside `AuthProvider` but outside `TripProvider`)

### Technical Details

**Files to create:**
- `src/pages/AccountPage.tsx` - profile management UI
- `src/pages/InvitePage.tsx` - invite acceptance page
- `supabase/functions/delete-account/index.ts` - account deletion edge function
- Database migration for `trip_invites` table

**Files to modify:**
- `src/App.tsx` - add routes
- `src/pages/Index.tsx` - add account button in header
- `src/pages/TripDashboard.tsx` - add invite buttons in member settings
- `src/hooks/useAuth.ts` - add `deleteAccount` method
- `src/hooks/useTripStore.ts` - add `createInvite` and `acceptInvite` methods


-- Fix: Allow trip owners to also see their trips (not just members)
DROP POLICY "Trip members can view trips" ON public.trips;
CREATE POLICY "Trip owners and members can view trips"
  ON public.trips FOR SELECT
  USING (owner_id = auth.uid() OR is_trip_member(id));

-- Fix: Allow trip owners to also add members (they are the owner but may not be a "member" yet)
-- The existing policy already uses is_trip_owner which checks owner_id = auth.uid(), so that's fine.

-- Fix: Allow trip owner to also view trip_members even before being added as a member
DROP POLICY "Trip members can view members" ON public.trip_members;
CREATE POLICY "Trip owners and members can view members"
  ON public.trip_members FOR SELECT
  USING (is_trip_owner(trip_id) OR is_trip_member(trip_id));
-- Allow anonymous users to read invite details (just the invite + trip name)
CREATE POLICY "Anyone can view invites by token"
ON public.trip_invites
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read trip name for invite display
CREATE POLICY "Anyone can view trip name via invite"
ON public.trips
FOR SELECT
TO anon
USING (
  id IN (SELECT trip_id FROM public.trip_invites)
);
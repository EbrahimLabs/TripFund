
CREATE TABLE public.trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.trip_members(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;

-- Trip owners can manage invites
CREATE POLICY "Trip owners can manage invites"
  ON public.trip_invites FOR ALL TO authenticated
  USING (trip_id IN (SELECT id FROM public.trips WHERE owner_id = auth.uid()));

-- Anyone authenticated can read invites by token (to accept)
CREATE POLICY "Authenticated users can view invites by token"
  ON public.trip_invites FOR SELECT TO authenticated
  USING (true);


-- Make member_id nullable for trip-level invites
ALTER TABLE public.trip_invites ALTER COLUMN member_id DROP NOT NULL;

-- Create function to accept trip invite (bypasses RLS for non-members joining)
CREATE OR REPLACE FUNCTION public.accept_trip_invite(invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_trip record;
  v_profile record;
  v_member_id uuid;
BEGIN
  -- Find the invite
  SELECT * INTO v_invite FROM trip_invites WHERE token = invite_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invite not found');
  END IF;
  IF v_invite.accepted_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Invite already used');
  END IF;
  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invite expired');
  END IF;

  -- Check if user is already a member of this trip
  SELECT id INTO v_member_id FROM trip_members
    WHERE trip_id = v_invite.trip_id AND user_id = auth.uid();
  IF FOUND THEN
    RETURN jsonb_build_object('error', 'Already a member of this trip');
  END IF;

  -- Get user display name from profile
  SELECT display_name INTO v_profile FROM profiles WHERE id = auth.uid();

  -- Get trip info
  SELECT * INTO v_trip FROM trips WHERE id = v_invite.trip_id;

  -- Insert new trip member
  INSERT INTO trip_members (trip_id, display_name, user_id, is_fund_manager)
  VALUES (v_invite.trip_id, COALESCE(v_profile.display_name, 'Member'), auth.uid(), false)
  RETURNING id INTO v_member_id;

  -- Mark invite as accepted
  UPDATE trip_invites SET accepted_by = auth.uid() WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'tripName', v_trip.name, 'memberId', v_member_id);
END;
$$;

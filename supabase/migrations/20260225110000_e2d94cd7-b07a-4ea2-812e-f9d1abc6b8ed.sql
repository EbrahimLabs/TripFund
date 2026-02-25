
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Trip members table
CREATE TABLE public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  is_fund_manager BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT DEFAULT '',
  member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  category TEXT,
  subcategory TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Expense splits table
CREATE TABLE public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  share_amount NUMERIC NOT NULL CHECK (share_amount >= 0)
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a trip member (via trip ownership or trip_members)
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = p_trip_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.trip_members WHERE trip_id = p_trip_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = p_trip_id AND owner_id = auth.uid()
  );
$$;

-- Trips RLS
CREATE POLICY "Trip members can view trips" ON public.trips FOR SELECT TO authenticated
  USING (public.is_trip_member(id));
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Trip owner can update" ON public.trips FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Trip owner can delete" ON public.trips FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Trip members RLS
CREATE POLICY "Trip members can view members" ON public.trip_members FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));
CREATE POLICY "Trip owner can add members" ON public.trip_members FOR INSERT TO authenticated
  WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Trip owner can update members" ON public.trip_members FOR UPDATE TO authenticated
  USING (public.is_trip_owner(trip_id));
CREATE POLICY "Trip owner can delete members" ON public.trip_members FOR DELETE TO authenticated
  USING (public.is_trip_owner(trip_id));

-- Transactions RLS
CREATE POLICY "Trip members can view transactions" ON public.transactions FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));
CREATE POLICY "Trip members can add transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_trip_member(trip_id));
CREATE POLICY "Trip members can update transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (public.is_trip_member(trip_id));
CREATE POLICY "Trip members can delete transactions" ON public.transactions FOR DELETE TO authenticated
  USING (public.is_trip_member(trip_id));

-- Expense splits RLS
CREATE POLICY "Members can view splits" ON public.expense_splits FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND public.is_trip_member(t.trip_id)
  ));
CREATE POLICY "Members can add splits" ON public.expense_splits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND public.is_trip_member(t.trip_id)
  ));
CREATE POLICY "Members can update splits" ON public.expense_splits FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND public.is_trip_member(t.trip_id)
  ));
CREATE POLICY "Members can delete splits" ON public.expense_splits FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND public.is_trip_member(t.trip_id)
  ));

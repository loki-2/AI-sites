-- 1. Create the gigs_subscriptions table
CREATE TABLE IF NOT EXISTS public.gigs_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Set up Row Level Security (RLS)
ALTER TABLE public.gigs_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy that allows inserts from anyone, but doesn't allow reads (optional for extra security since server uses service_role key anyway)
CREATE POLICY "Enable insert for all users"
  ON public.gigs_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- 4. Create an index on email for faster lookups/duplicate checks
CREATE INDEX IF NOT EXISTS gigs_subscriptions_email_idx ON public.gigs_subscriptions(email);

-- Create room_locks table to prevent overbooking
CREATE TABLE IF NOT EXISTS public.room_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID UNIQUE NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  locked_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_locks_room ON public.room_locks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_locks_user ON public.room_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_room_locks_expiry ON public.room_locks(locked_until);

-- Enable RLS
ALTER TABLE public.room_locks ENABLE ROW LEVEL SECURITY;

-- Select policy: anyone can read locks to filter available rooms
DROP POLICY IF EXISTS "Allow public read on room_locks" ON public.room_locks;
CREATE POLICY "Allow public read on room_locks" 
  ON public.room_locks FOR SELECT USING (true);

-- Write policies: users can manage their own locks
DROP POLICY IF EXISTS "Allow users control on own room_locks" ON public.room_locks;
CREATE POLICY "Allow users control on own room_locks" 
  ON public.room_locks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

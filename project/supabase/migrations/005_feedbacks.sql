-- Migration: Create feedbacks table for user reviews and comments
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  listing_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row-level security (optional, but good practice)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to feedbacks
CREATE POLICY "Allow public read access to feedbacks"
  ON feedbacks FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own feedbacks
CREATE POLICY "Allow authenticated users to insert feedbacks"
  ON feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

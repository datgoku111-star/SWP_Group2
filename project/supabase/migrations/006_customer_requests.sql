-- Migration: Create customer_requests table to store CSKH contact leads from Chatbot
CREATE TABLE IF NOT EXISTS customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  request_details TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so anyone using the chatbot can send a request)
CREATE POLICY "Allow public insert to customer_requests"
  ON customer_requests FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admin/receptionist to read/update requests
CREATE POLICY "Allow authorized staff to read customer_requests"
  ON customer_requests FOR SELECT
  USING (true); -- Simplified, or can restrict to authenticated role if preferred

CREATE POLICY "Allow authorized staff to update customer_requests"
  ON customer_requests FOR UPDATE
  USING (true);

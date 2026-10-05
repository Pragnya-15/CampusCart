/*
# Create missing `requests` and `swaps` tables, add admin RLS policies, fix verifications admin SELECT

## Overview
The frontend queries `supabase.from('requests')` and `supabase.from('swaps')` but
these tables don't exist yet. This migration creates them with proper columns,
foreign keys, and RLS policies. It also adds admin override policies for listings
delete/update and student_verifications SELECT so admins can manage the marketplace.

## New Tables

### 1. `requests` (Purchase Requests)
- `id` (uuid, PK)
- `buyer_id` (uuid, FK → profiles, defaults to auth.uid())
- `listing_id` (uuid, FK → listings)
- `offer_price` (numeric, nullable)
- `message` (text, nullable)
- `status` (text, default 'pending')
- `created_at` (timestamptz, default now())

### 2. `swaps` (Swap Requests)
- `id` (uuid, PK)
- `proposer_id` (uuid, FK → profiles, defaults to auth.uid())
- `receiver_id` (uuid, FK → profiles)
- `offered_listing_id` (uuid, FK → listings)
- `requested_listing_id` (uuid, FK → listings)
- `message` (text, nullable)
- `status` (text, default 'pending')
- `created_at` (timestamptz, default now())

## Modified Tables / Policies

### listings (admin override)
- New DELETE policy: admin can delete any listing
- New UPDATE policy: admin can update any listing status

### student_verifications (admin SELECT)
- New SELECT policy: admin can view all verifications

## Security
- RLS enabled on both new tables
- `requests`: buyer can INSERT/SELECT/UPDATE own; listing seller can SELECT/UPDATE
- `swaps`: proposer can INSERT/SELECT own; receiver can SELECT; both can UPDATE
- Admin overrides added for listings DELETE/UPDATE
- Admin SELECT added for student_verifications
*/

-- =============================================================
-- 1. Create `requests` table (purchase/buy requests)
-- =============================================================
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  offer_price numeric,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Buyer can insert their own request
DROP POLICY IF EXISTS "requests_insert_own" ON requests;
CREATE POLICY "requests_insert_own"
ON requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Buyer can see their own requests; seller of the listing can see incoming requests
DROP POLICY IF EXISTS "requests_select_parties" ON requests;
CREATE POLICY "requests_select_parties"
ON requests FOR SELECT TO authenticated
USING (
  auth.uid() = buyer_id
  OR EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = requests.listing_id
    AND listings.seller_id = auth.uid()
  )
);

-- Buyer can update own request (e.g. cancel); seller can update (accept/reject)
DROP POLICY IF EXISTS "requests_update_parties" ON requests;
CREATE POLICY "requests_update_parties"
ON requests FOR UPDATE TO authenticated
USING (
  auth.uid() = buyer_id
  OR EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = requests.listing_id
    AND listings.seller_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = buyer_id
  OR EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = requests.listing_id
    AND listings.seller_id = auth.uid()
  )
);

-- Buyer can delete own request
DROP POLICY IF EXISTS "requests_delete_own" ON requests;
CREATE POLICY "requests_delete_own"
ON requests FOR DELETE TO authenticated
USING (auth.uid() = buyer_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_requests_buyer ON requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requests_listing ON requests(listing_id);

-- =============================================================
-- 2. Create `swaps` table (item swap requests)
-- =============================================================
CREATE TABLE IF NOT EXISTS swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offered_listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requested_listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;

-- Proposer can insert swap request
DROP POLICY IF EXISTS "swaps_insert_own" ON swaps;
CREATE POLICY "swaps_insert_own"
ON swaps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = proposer_id);

-- Both proposer and receiver can see the swap
DROP POLICY IF EXISTS "swaps_select_parties" ON swaps;
CREATE POLICY "swaps_select_parties"
ON swaps FOR SELECT TO authenticated
USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- Both parties can update status (accept/reject/complete)
DROP POLICY IF EXISTS "swaps_update_parties" ON swaps;
CREATE POLICY "swaps_update_parties"
ON swaps FOR UPDATE TO authenticated
USING (auth.uid() = proposer_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- Proposer can delete/cancel own swap request
DROP POLICY IF EXISTS "swaps_delete_own" ON swaps;
CREATE POLICY "swaps_delete_own"
ON swaps FOR DELETE TO authenticated
USING (auth.uid() = proposer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_swaps_proposer ON swaps(proposer_id);
CREATE INDEX IF NOT EXISTS idx_swaps_receiver ON swaps(receiver_id);

-- =============================================================
-- 3. Admin override policies for listings
-- =============================================================

-- Admin can delete any listing
DROP POLICY IF EXISTS "listings_delete_admin" ON listings;
CREATE POLICY "listings_delete_admin"
ON listings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin can update any listing (e.g. change status, remove)
DROP POLICY IF EXISTS "listings_update_admin" ON listings;
CREATE POLICY "listings_update_admin"
ON listings FOR UPDATE TO authenticated
USING (
  auth.uid() = seller_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = seller_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================
-- 4. Admin SELECT for student_verifications (admin dashboard)
-- =============================================================
DROP POLICY IF EXISTS "verifications_select_admin" ON student_verifications;
CREATE POLICY "verifications_select_admin"
ON student_verifications FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================
-- 5. Admin SELECT for all profiles (admin dashboard needs to list all users)
-- profiles_select_public already allows SELECT true for everyone,
-- so admin can already see all profiles. No change needed.
-- =============================================================

-- =============================================================
-- 6. Admin SELECT for all reports — already has reports_select_own_admin
-- which checks reporter_id OR admin role. No change needed.
-- =============================================================

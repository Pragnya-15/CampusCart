/*
# CampusCart - Complete Database Schema

## Overview
Creates the full schema for CampusCart, an AI-powered student marketplace.
All tables use RLS with ownership checks via auth.uid().

## New Tables
1. profiles - Extends auth.users with student info (college, department, year, role, verification_status, rating)
2. categories - Item categories with icons (Books, Calculators, Lab Equipment, etc.)
3. listings - Marketplace items with seller, price, condition, type, images, status
4. favorites - Saved items per user
5. requests - Buy/offer requests from buyer to seller
6. rental_requests - Rental requests with date ranges and total amounts
7. swaps - Item exchange proposals between two users
8. messages - Chat messages between users about listings
9. conversations - Conversation threads between users
10. notifications - User notifications for various events
11. student_verifications - Verification submissions with student ID references
12. reports - User-submitted reports for listings
13. request_board_posts - Open requests for items students need
14. transactions - Completed exchanges (sales, rentals, swaps)

## Security
- RLS enabled on all tables
- Owner-scoped policies using auth.uid()
- Public read access for marketplace listings, categories
- Private access for messages, notifications, personal data
- Admin role check via profiles table
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  college text,
  department text,
  year_of_study text,
  phone text,
  profile_image text,
  role text NOT NULL DEFAULT 'user',
  verification_status text NOT NULL DEFAULT 'pending',
  rating numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  items_sold integer DEFAULT 0,
  items_bought integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow public profile reads for seller info on listings (limited fields visible via API)
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  condition text NOT NULL DEFAULT 'good',
  listing_type text NOT NULL DEFAULT 'sell',
  location text,
  college text,
  status text NOT NULL DEFAULT 'active',
  images text[] DEFAULT '{}',
  views integer DEFAULT 0,
  rental_rate numeric,
  rental_unit text DEFAULT 'day',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

DROP POLICY IF EXISTS "listings_select_all" ON listings;
CREATE POLICY "listings_select_all" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "listings_insert_own" ON listings;
CREATE POLICY "listings_insert_own" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_update_own" ON listings;
CREATE POLICY "listings_update_own" ON listings FOR UPDATE
  TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_delete_own" ON listings;
CREATE POLICY "listings_delete_own" ON listings FOR DELETE
  TO authenticated USING (auth.uid() = seller_id);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Requests (buy/offer) table
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

CREATE INDEX IF NOT EXISTS idx_requests_buyer ON requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requests_listing ON requests(listing_id);

DROP POLICY IF EXISTS "requests_select_parties" ON requests;
CREATE POLICY "requests_select_parties" ON requests FOR SELECT
  TO authenticated USING (
    auth.uid() = buyer_id OR
    EXISTS (SELECT 1 FROM listings WHERE listings.id = requests.listing_id AND listings.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "requests_insert_own" ON requests;
CREATE POLICY "requests_insert_own" ON requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "requests_update_seller" ON requests;
CREATE POLICY "requests_update_seller" ON requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = requests.listing_id AND listings.seller_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = requests.listing_id AND listings.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "requests_update_buyer" ON requests;
CREATE POLICY "requests_update_buyer" ON requests FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

-- Rental requests table
CREATE TABLE IF NOT EXISTS rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rental_select_parties" ON rental_requests;
CREATE POLICY "rental_select_parties" ON rental_requests FOR SELECT
  TO authenticated USING (
    auth.uid() = renter_id OR
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rental_requests.listing_id AND listings.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "rental_insert_own" ON rental_requests;
CREATE POLICY "rental_insert_own" ON rental_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = renter_id);

DROP POLICY IF EXISTS "rental_update_seller" ON rental_requests;
CREATE POLICY "rental_update_seller" ON rental_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rental_requests.listing_id AND listings.seller_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rental_requests.listing_id AND listings.seller_id = auth.uid())
  );

-- Swaps table
CREATE TABLE IF NOT EXISTS swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offered_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  requested_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "swaps_select_parties" ON swaps;
CREATE POLICY "swaps_select_parties" ON swaps FOR SELECT
  TO authenticated USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "swaps_insert_own" ON swaps;
CREATE POLICY "swaps_insert_own" ON swaps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "swaps_update_parties" ON swaps;
CREATE POLICY "swaps_update_parties" ON swaps FOR UPDATE
  TO authenticated USING (auth.uid() = proposer_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant1_id, participant2_id, listing_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_parties" ON conversations;
CREATE POLICY "conversations_select_parties" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
CREATE POLICY "conversations_insert_own" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = participant1_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_status boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

DROP POLICY IF EXISTS "messages_select_parties" ON messages;
CREATE POLICY "messages_select_parties" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read_status boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Student verifications table
CREATE TABLE IF NOT EXISTS student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  college text NOT NULL,
  student_id_reference text NOT NULL,
  college_email text,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verifications_select_own" ON student_verifications;
CREATE POLICY "verifications_select_own" ON student_verifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "verifications_insert_own" ON student_verifications;
CREATE POLICY "verifications_insert_own" ON student_verifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "verifications_update_admin" ON student_verifications;
CREATE POLICY "verifications_update_admin" ON student_verifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own_admin" ON reports;
CREATE POLICY "reports_select_own_admin" ON reports FOR SELECT
  TO authenticated USING (
    auth.uid() = reporter_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Request board posts table
CREATE TABLE IF NOT EXISTS request_board_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  max_budget numeric,
  location text,
  college text,
  expiry_date date,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE request_board_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_board_select_all" ON request_board_posts;
CREATE POLICY "request_board_select_all" ON request_board_posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "request_board_insert_own" ON request_board_posts;
CREATE POLICY "request_board_insert_own" ON request_board_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "request_board_update_own" ON request_board_posts;
CREATE POLICY "request_board_update_own" ON request_board_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "request_board_delete_own" ON request_board_posts;
CREATE POLICY "request_board_delete_own" ON request_board_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  transaction_type text NOT NULL,
  amount numeric,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_parties" ON transactions;
CREATE POLICY "transactions_select_parties" ON transactions FOR SELECT
  TO authenticated USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on listings
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

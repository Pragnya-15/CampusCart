/*
# Seed Demo Users and Listings

## Overview
Creates demo student accounts and realistic listings so the marketplace
looks populated on first launch.

## Demo Users (email / password)
1. admin@campuscart.edu / admin12345 - Admin account (role='admin')
2. pragnya@campuscart.edu / demo12345 - Student seller
3. rahul@campuscart.edu / demo12345 - Student seller
4. ananya@campuscart.edu / demo12345 - Student seller
*/

-- Enable pgcrypto for crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create demo auth users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'admin@campuscart.edu', crypt('admin12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User","demo":true}', 'authenticated', 'authenticated'),
  ('a0000000-0000-4000-8000-000000000002', 'pragnya@campuscart.edu', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pragnya Sharma","demo":true}', 'authenticated', 'authenticated'),
  ('a0000000-0000-4000-8000-000000000003', 'rahul@campuscart.edu', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rahul Verma","demo":true}', 'authenticated', 'authenticated'),
  ('a0000000-0000-4000-8000-000000000004', 'ananya@campuscart.edu', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ananya Gupta","demo":true}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create identities for the demo users
INSERT INTO auth.identities (provider_id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'email', '{"sub":"a0000000-0000-4000-8000-000000000001"}', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'email', '{"sub":"a0000000-0000-4000-8000-000000000002"}', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'email', '{"sub":"a0000000-0000-4000-8000-000000000003"}', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'email', '{"sub":"a0000000-0000-4000-8000-000000000004"}', now(), now(), now())
ON CONFLICT DO NOTHING;

-- Create profiles for demo users
INSERT INTO profiles (id, full_name, email, college, department, year_of_study, role, verification_status)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Admin User', 'admin@campuscart.edu', 'CampusCart Admin', 'Administration', 'N/A', 'admin', 'verified'),
  ('a0000000-0000-4000-8000-000000000002', 'Pragnya Sharma', 'pragnya@campuscart.edu', 'NIT Trichy', 'Computer Science', '3rd Year', 'user', 'verified'),
  ('a0000000-0000-4000-8000-000000000003', 'Rahul Verma', 'rahul@campuscart.edu', 'NIT Trichy', 'Electronics', '2nd Year', 'user', 'verified'),
  ('a0000000-0000-4000-8000-000000000004', 'Ananya Gupta', 'ananya@campuscart.edu', 'IIT Madras', 'Mechanical', '4th Year', 'user', 'pending')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  college = EXCLUDED.college,
  department = EXCLUDED.department,
  year_of_study = EXCLUDED.year_of_study,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- Seed demo listings
INSERT INTO listings (id, seller_id, title, description, category_id, price, original_price, condition, listing_type, location, college, status, images, views, rental_rate, rental_unit)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Engineering Mathematics Book',
   'B.S. Grewal Engineering Mathematics. Covers all topics for 1st and 2nd semester. In good condition with minimal highlighting.',
   '0c132a25-d7f1-4e51-a88f-0ea1a519ac98', 250, 450, 'good', 'sell', 'Hostel Block A', 'NIT Trichy', 'active', ARRAY[]::text[], 15, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'DBMS Textbook - Navathe',
   'Database Systems by Navathe and Elmasri. Complete DBMS textbook for 3rd semester. Like new condition.',
   '0c132a25-d7f1-4e51-a88f-0ea1a519ac98', 350, 650, 'like_new', 'sell', 'Hostel Block A', 'NIT Trichy', 'active', ARRAY[]::text[], 28, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003',
   'Casio Scientific Calculator fx-991MS',
   'Casio fx-991MS Scientific Calculator. Perfect for engineering exams. 2 years old, works perfectly. Available for rent too.',
   '08b4d2a7-33a8-401a-96e3-ea38cb6054d5', 700, 1200, 'like_new', 'rent', 'Electronics Dept', 'NIT Trichy', 'active', ARRAY[]::text[], 42, 30, 'day'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004',
   'Lab Coat - Size L',
   'White lab coat for chemistry lab. Size Large. Worn for one semester, good condition.',
   'da693382-5f16-40c5-88fb-347812c6d2f6', 300, 500, 'good', 'sell', 'Campus Store', 'IIT Madras', 'active', ARRAY[]::text[], 8, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003',
   'Arduino Uno R3 Kit',
   'Arduino Uno R3 with USB cable and breadboard. Used for 2 projects. Fully functional. Great for mini projects.',
   'd5e0e96a-1693-4c22-8028-f550e0f1e51e', 500, 900, 'good', 'sell', 'Electronics Dept', 'NIT Trichy', 'active', ARRAY[]::text[], 35, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002',
   'Engineering Drawing Kit',
   'Complete drawing instruments set - compass, divider, set squares, protractor, scales. Good condition.',
   '55acfb04-7622-44fb-9f7b-496a0a0d37dd', 400, 700, 'good', 'swap', 'Hostel Block A', 'NIT Trichy', 'active', ARRAY[]::text[], 12, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000004',
   'Laptop Stand - Adjustable',
   'Aluminum adjustable laptop stand. Lightweight and portable. Like new, barely used.',
   '9518904e-5217-4fc9-9c44-3fe82d46a6b0', 600, 1200, 'like_new', 'sell', 'Campus Store', 'IIT Madras', 'active', ARRAY[]::text[], 19, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003',
   'Data Structures and Algorithms Book',
   'Data Structures and Algorithms in C by Mark Allen Weiss. Comprehensive guide. Good condition with some notes.',
   '0c132a25-d7f1-4e51-a88f-0ea1a519ac98', 400, 750, 'good', 'sell', 'Electronics Dept', 'NIT Trichy', 'active', ARRAY[]::text[], 22, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002',
   'Headphones - Audio-technica ATH-M20x',
   'Studio monitor headphones. Great sound quality. 1 year old, excellent condition.',
   '9518904e-5217-4fc9-9c44-3fe82d46a6b0', 800, 2000, 'like_new', 'sell', 'Hostel Block A', 'NIT Trichy', 'active', ARRAY[]::text[], 31, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004',
   'Scientific Calculator fx-991ES Plus',
   'Casio fx-991ES Plus. Natural display, 417 functions. Good condition. Available for rent during exam season.',
   '08b4d2a7-33a8-401a-96e3-ea38cb6054d5', 550, 995, 'good', 'rent', 'Campus Store', 'IIT Madras', 'active', ARRAY[]::text[], 17, 25, 'day'),
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003',
   'Raspberry Pi 4 (4GB) with Case',
   'Raspberry Pi 4 4GB with case and power supply. Used for IoT project. Works great.',
   'd5e0e96a-1693-4c22-8028-f550e0f1e51e', 2500, 4500, 'good', 'sell', 'Electronics Dept', 'NIT Trichy', 'active', ARRAY[]::text[], 45, NULL, NULL),
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002',
   'Engineering Drawing Sheets (50 pcs)',
   '50 unused A2 size drawing sheets. Perfect for engineering drawing lab.',
   '55acfb04-7622-44fb-9f7b-496a0a0d37dd', 150, 300, 'new', 'sell', 'Hostel Block A', 'NIT Trichy', 'active', ARRAY[]::text[], 5, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed a demo verification request for Ananya (pending)
INSERT INTO student_verifications (user_id, college, student_id_reference, college_email, status, submitted_at)
VALUES ('a0000000-0000-4000-8000-000000000004', 'IIT Madras', 'ME20B012', 'ananya@iitm.ac.in', 'pending', now())
ON CONFLICT DO NOTHING;

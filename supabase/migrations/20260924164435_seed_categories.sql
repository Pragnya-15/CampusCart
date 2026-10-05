/*
# Seed Categories and Demo Data

## Overview
Inserts the 11 standard categories and demo listings so the marketplace looks populated on first launch.

## Data
- 11 categories (Books, Calculators, Lab Equipment, Electronics, Stationery, Bags, Hostel Items, Sports, Fashion, Accessories, Other)
- Demo listings are NOT seeded here (they require auth.users profiles). Instead, demo listings will be created when users sign up and list items. The marketplace will show real listings from real users.
*/

INSERT INTO categories (name, icon, slug) VALUES
  ('Books', 'Book', 'books'),
  ('Calculators', 'Calculator', 'calculators'),
  ('Lab Equipment', 'FlaskConical', 'lab-equipment'),
  ('Electronics', 'Laptop', 'electronics'),
  ('Stationery', 'PenTool', 'stationery'),
  ('Bags', 'Backpack', 'bags'),
  ('Hostel Items', 'Bed', 'hostel-items'),
  ('Sports', 'Dumbbell', 'sports'),
  ('Fashion', 'Shirt', 'fashion'),
  ('Accessories', 'Headphones', 'accessories'),
  ('Other', 'Package', 'other')
ON CONFLICT (slug) DO NOTHING;

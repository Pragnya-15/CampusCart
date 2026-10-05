# CampusCart

A campus marketplace web app where students can buy, sell, rent, and swap items like textbooks, calculators, electronics, lab equipment, and more. Built with React, TypeScript, Tailwind CSS, Vite, and Supabase.

## Features

- **Marketplace** — Browse, search, and filter listings by category, price, condition, and listing type
- **Sell / Rent / Swap** — Create listings with photos, AI-powered price suggestions, and auto-generated descriptions
- **Item Details** — Full listing page with image gallery, seller info, and offer/rent/swap flows
- **Authentication** — Email/password sign-up and login (Supabase Auth)
- **Messages** — Chat with sellers in real time
- **Favorites** — Save listings for later
- **Recommendations** — Personalized listing recommendations
- **Dashboard** — Track your listings, sales, and activity
- **Admin Panel** — Review flagged listings, manage users, and oversee transactions
- **Impact Page** — Sustainability metrics showing reuse and waste reduction

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend / Database / Auth:** Supabase (PostgreSQL, Row Level Security, Storage)
- **Icons:** Lucide React
- **Routing:** React Router DOM v7

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- A Supabase project (create one free at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholder values with your Supabase project URL and anon key (found in your Supabase dashboard under **Settings > API**):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 3. Set up the database

The SQL migration files are in the `supabase/migrations/` folder. Run them in order using the Supabase SQL Editor (in your Supabase dashboard) or the Supabase CLI:

```bash
# If using Supabase CLI:
supabase db push
```

Or manually: open your Supabase dashboard, go to **SQL Editor**, and paste/run each file in `supabase/migrations/` in chronological order (oldest first).

The migrations will create all tables, seed categories and demo data, set up Row Level Security policies, and create the listing-images storage bucket.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
```

The built files will be in the `dist/` folder. You can preview the production build with:

```bash
npm run preview
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the project for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

## Project Structure

```
project/
├── src/
│   ├── components/        # Reusable UI components (Navbar, Footer, ListingCard, etc.)
│   ├── context/           # React context (AuthContext)
│   ├── lib/               # Supabase client setup
│   ├── pages/             # Page components (Home, Marketplace, Sell, Login, etc.)
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Helper functions and AI utilities
│   ├── App.tsx            # Main app with routes
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles & Tailwind config
├── supabase/
│   └── migrations/        # SQL migration files (schema, seed data, RLS policies, storage)
├── .env.example           # Example environment variables
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── index.html
```

## Database Schema

The app uses the following main tables (created by the migration files):

- **profiles** — User profiles (name, college, department, rating, verification)
- **categories** — Listing categories (Books, Calculators, Electronics, etc.)
- **listings** — Items for sale, rent, or swap
- **favorites** — User's saved listings
- **messages** — Chat conversations between users
- **requests** — Buy, rent, and swap requests
- **swaps** — Swap proposals and their status
- **reports** — Flagged listings for admin review

All tables have Row Level Security (RLS) enabled with policies that ensure users can only modify their own data.

## Notes

- The app uses Supabase Storage for listing images. The storage bucket (`listing-images`) is created automatically by one of the migration files.
- Authentication uses email/password with Supabase Auth. Email confirmation is disabled by default.
- Demo data (categories, sample listings, and demo users) is seeded by the migration files for testing purposes.

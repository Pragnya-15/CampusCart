import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  GraduationCap,
  Search,
  Tag,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Leaf,
  ArrowRight,
  Book,
  Calculator,
  FlaskConical,
  Laptop,
  PenTool,
  Backpack,
  Bed,
  Dumbbell,
  Shirt,
  Headphones,
  Package,
  TrendingUp,
  Users,
  Recycle,
  Star,
  Bell,
  Brain,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';
import type { Listing, Category } from '@/types';

export function HomePage() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ listings: 0, users: 0, exchanges: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: listings }, { data: cats }, { count: listingCount }, { count: userCount }, { count: txCount }] =
          await Promise.all([
            supabase
              .from('listings')
              .select('*, category:categories(*), seller:profiles(*)')
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(8),
            supabase.from('categories').select('*').order('name'),
            supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('*', { count: 'exact', head: true }),
          ]);

        setFeaturedListings((listings as unknown as Listing[]) || []);
        setCategories((cats as Category[]) || []);
        setStats({
          listings: listingCount || 0,
          users: userCount || 0,
          exchanges: txCount || 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categoryIcons: Record<string, LucideIcon> = {
    Books: Book,
    Calculators: Calculator,
    'Lab Equipment': FlaskConical,
    Electronics: Laptop,
    Stationery: PenTool,
    Bags: Backpack,
    'Hostel Items': Bed,
    Sports: Dumbbell,
    Fashion: Shirt,
    Accessories: Headphones,
    Other: Package,
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-navy-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative container-max px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white">
                <Sparkles size={14} className="text-brand-300" />
                THE STUDENT MARKETPLACE
              </span>
              <h1 className="mt-6 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
                BUY SMART.<br />
                SELL EASY.<br />
                <span className="bg-gradient-to-r from-brand-300 to-navy-300 bg-clip-text text-transparent">SHARE MORE.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-lg mx-auto lg:mx-0">
                Buy, sell, rent and exchange books, calculators, lab equipment and everyday student essentials — all in one trusted campus marketplace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/marketplace" className="btn-primary bg-white text-navy-700 hover:bg-slate-100 shadow-xl">
                  Explore Marketplace
                  <ArrowRight size={18} />
                </Link>
                <Link to="/sell" className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Tag size={18} />
                  Sell an Item
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                <div>
                  <p className="font-display font-bold text-2xl text-white">{stats.listings}+</p>
                  <p className="text-xs text-slate-400">Active Listings</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="font-display font-bold text-2xl text-white">{stats.users}+</p>
                  <p className="text-xs text-slate-400">Students</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="font-display font-bold text-2xl text-white">{stats.exchanges}+</p>
                  <p className="text-xs text-slate-400">Exchanges</p>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:block relative">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-navy-500/20 rounded-3xl blur-2xl" />
                <div className="relative glass-dark rounded-3xl p-6 border border-white/10">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Book, label: 'Books', color: 'text-blue-300', bg: 'bg-blue-500/20' },
                      { icon: Calculator, label: 'Calculators', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
                      { icon: FlaskConical, label: 'Lab Equipment', color: 'text-amber-300', bg: 'bg-amber-500/20' },
                      { icon: Laptop, label: 'Electronics', color: 'text-purple-300', bg: 'bg-purple-500/20' },
                      { icon: Headphones, label: 'Accessories', color: 'text-pink-300', bg: 'bg-pink-500/20' },
                      { icon: Backpack, label: 'Bags', color: 'text-cyan-300', bg: 'bg-cyan-500/20' },
                      { icon: Dumbbell, label: 'Sports', color: 'text-orange-300', bg: 'bg-orange-500/20' },
                      { icon: PenTool, label: 'Stationery', color: 'text-red-300', bg: 'bg-red-500/20' },
                      { icon: ShoppingCart, label: 'And More', color: 'text-navy-300', bg: 'bg-navy-500/20' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`${item.bg} rounded-2xl p-4 flex flex-col items-center gap-2 animate-float hover:scale-110 transition-transform cursor-pointer`}
                        style={{ animationDelay: `${i * 0.3}s` }}
                      >
                        <item.icon size={28} className={item.color} />
                        <span className="text-xs text-white/80 font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How CampusCart Works */}
      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-navy-900">How CampusCart Works</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">Three simple steps to start buying, selling, and sharing on campus.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Create an Account', desc: 'Sign up with your college email and verify your student status for a trusted community.', step: '01' },
              { icon: Tag, title: 'List or Find Items', desc: 'Post items you want to sell, rent, or swap. Browse the marketplace for what you need.', step: '02' },
              { icon: MessageSquare, title: 'Connect & Exchange', desc: 'Chat with sellers, make offers, propose swaps, and complete your exchange safely.', step: '03' },
            ].map((item, i) => (
              <div key={i} className="relative card p-6 group hover:shadow-lg transition-shadow">
                <span className="absolute top-4 right-4 font-display font-bold text-5xl text-slate-100 group-hover:text-navy-100 transition-colors">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-500 to-brand-600 flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="bg-white section-padding">
        <div className="container-max">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-navy-900">Popular Categories</h2>
            <p className="mt-3 text-slate-500">Find exactly what you need for your studies and campus life.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.name] || Package;
              return (
                <Link
                  key={cat.id}
                  to={`/marketplace?category=${cat.slug}`}
                  className="card p-5 flex flex-col items-center gap-3 group hover:border-navy-300 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-navy-50 group-hover:bg-navy-100 flex items-center justify-center transition-colors">
                    <Icon size={24} className="text-navy-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 text-center">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="section-padding">
        <div className="container-max">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-navy-900">Featured Listings</h2>
              <p className="mt-2 text-slate-500">Fresh items added by students across campus.</p>
            </div>
            <Link to="/marketplace" className="hidden sm:flex btn-ghost text-sm text-navy-600">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-square bg-slate-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No listings yet. Be the first to list an item!</p>
              <Link to="/sell" className="btn-primary mt-4 text-sm">
                <Tag size={16} /> Sell an Item
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Students Use CampusCart */}
      <section className="bg-navy-950 section-padding">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Why Students Use CampusCart</h2>
            <p className="mt-3 text-slate-400">More than a marketplace — a smarter way to handle student life.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: 'Verified Students', desc: 'Every seller is verified through their college email and student ID for a safe community.' },
              { icon: Sparkles, title: 'AI-Powered', desc: 'Smart price recommendations, natural-language search, and personalized recommendations.' },
              { icon: Recycle, title: 'Sustainable', desc: 'Give items a second life. Reduce waste and save money by reusing within your campus.' },
              { icon: MessageSquare, title: 'Safe Messaging', desc: 'Chat securely within the platform. No need to share personal contact details.' },
            ].map((item, i) => (
              <div key={i} className="glass-dark rounded-2xl p-6 border border-white/10 group hover:border-white/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-navy-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Smart Marketplace */}
      <section className="section-padding">
        <div className="container-max">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-sm font-medium">
                <Brain size={14} /> AI-POWERED
              </span>
              <h2 className="mt-4 font-display font-bold text-3xl sm:text-4xl text-navy-900">
                Smart Marketplace with AI
              </h2>
              <p className="mt-4 text-slate-500">
                CampusCart uses intelligent algorithms to make buying and selling easier, faster, and fairer.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { icon: TrendingUp, title: 'AI Price Recommendation', desc: 'Get fair price suggestions based on condition, age, and similar listings on CampusCart.' },
                  { icon: Search, title: 'Smart Search', desc: 'Search naturally: "I need a DBMS book under ₹500" — we understand what you mean.' },
                  { icon: Sparkles, title: 'Personalized Recommendations', desc: 'Discover items you might need based on your favorites and activity.' },
                  { icon: PenTool, title: 'Listing Assistant', desc: 'Generate professional item descriptions in seconds with our AI assistant.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <item.icon size={20} className="text-navy-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-navy-600 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-navy-800">AI Price Recommendation</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Item</span>
                    <span className="font-medium text-slate-700">Casio Scientific Calculator</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Condition</span>
                    <span className="font-medium text-slate-700">Good</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Original Price</span>
                    <span className="font-medium text-slate-700">₹1,200</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Age</span>
                    <span className="font-medium text-slate-700">2 years</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center gap-2 text-sm text-navy-600 font-medium">
                      <CheckCircle2 size={16} />
                      Suggested price: ₹650 – ₹800
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Similar calculators on CampusCart are listed around ₹700.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 section-padding">
        <div className="container-max text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Leaf size={32} className="text-emerald-600" />
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-navy-900">Sustainability at Heart</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Every item reused is one less item wasted. CampusCart helps students reduce waste, save money, and build a circular campus economy.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="card p-6">
              <Recycle size={28} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-display font-bold text-2xl text-navy-800">{stats.listings}+</p>
              <p className="text-xs text-slate-500">Items Reused</p>
            </div>
            <div className="card p-6">
              <Users size={28} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-display font-bold text-2xl text-navy-800">{stats.users}+</p>
              <p className="text-xs text-slate-500">Students Joined</p>
            </div>
            <div className="card p-6">
              <TrendingUp size={28} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-display font-bold text-2xl text-navy-800">{stats.exchanges}+</p>
              <p className="text-xs text-slate-500">Exchanges</p>
            </div>
          </div>
          <Link to="/impact" className="btn-primary mt-8">
            View Impact Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Student Safety */}
      <section className="bg-white section-padding">
        <div className="container-max">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="glass rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-800">Verified Student</p>
                    <p className="text-xs text-slate-500">College email confirmed</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    'Student verification via college email and student ID',
                    'Only verified students get the trust badge on listings',
                    'Private messaging — no need to share phone numbers',
                    'Report suspicious listings to our moderation team',
                    'Admin-reviewed listings for quality control',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium">
                <ShieldCheck size={14} /> STUDENT SAFETY
              </span>
              <h2 className="mt-4 font-display font-bold text-3xl sm:text-4xl text-navy-900">
                A Trusted Community for Students
              </h2>
              <p className="mt-4 text-slate-500">
                We take safety seriously. CampusCart verifies students through their college credentials and provides tools to keep the community safe and trustworthy.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <ShieldCheck size={24} className="text-emerald-500 mb-2" />
                  <p className="font-medium text-sm text-slate-700">Verified Profiles</p>
                  <p className="text-xs text-slate-500 mt-1">Look for the verified badge</p>
                </div>
                <div className="card p-4">
                  <Bell size={24} className="text-navy-500 mb-2" />
                  <p className="font-medium text-sm text-slate-700">Report System</p>
                  <p className="text-xs text-slate-500 mt-1">Flag suspicious listings easily</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-navy-600 to-brand-700 section-padding">
        <div className="container-max text-center">
          <Star size={32} className="mx-auto text-white/80 mb-4" />
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
            Ready to Start Trading Smart?
          </h2>
          <p className="mt-3 text-slate-200 max-w-xl mx-auto">
            Join thousands of students already buying, selling, and sharing on CampusCart.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary bg-white text-navy-700 hover:bg-slate-100 shadow-xl">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/marketplace" className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

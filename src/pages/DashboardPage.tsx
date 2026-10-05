import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Store,
  Package,
  MessageSquare,
  Heart,
  Repeat,
  TrendingUp,
  Bell,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ListingCard } from '@/components/ListingCard';
import { getRecommendations } from '@/utils/ai';
import type { Listing, Notification } from '@/types';
import { timeAgo } from '@/utils/helpers';

export function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ listings: 0, favorites: 0, requests: 0, exchanges: 0 });
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function loadData() {
      try {
        const [listingsRes, favRes, reqRes, txRes, notifRes] = await Promise.all([
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', profile!.id),
          supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', profile!.id),
          supabase.from('requests').select('*', { count: 'exact', head: true }).eq('buyer_id', profile!.id).eq('status', 'pending'),
          supabase.from('transactions').select('*', { count: 'exact', head: true }).or(`buyer_id.eq.${profile!.id},seller_id.eq.${profile!.id}`),
          supabase.from('notifications').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          listings: listingsRes.count || 0,
          favorites: favRes.count || 0,
          requests: reqRes.count || 0,
          exchanges: txRes.count || 0,
        });
        setNotifications((notifRes.data as Notification[]) || []);
        const recs = await getRecommendations(profile!.id, 4);
        setRecommendations(recs);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  if (!profile) return null;

  const quickActions = [
    { to: '/sell', icon: Tag, label: 'Sell an Item', color: 'from-navy-500 to-brand-600' },
    { to: '/marketplace', icon: Store, label: 'Browse Marketplace', color: 'from-emerald-500 to-teal-600' },
    { to: '/requests', icon: Package, label: 'Post a Request', color: 'from-amber-500 to-orange-600' },
    { to: '/messages', icon: MessageSquare, label: 'Messages', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-navy-900">
          Welcome back, {profile.full_name.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening on CampusCart today.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="card p-5 group hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon size={22} className="text-white" />
            </div>
            <p className="font-medium text-sm text-slate-800">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Tag, label: 'My Listings', value: stats.listings, color: 'text-navy-600 bg-navy-50' },
          { icon: Heart, label: 'Favorites', value: stats.favorites, color: 'text-red-500 bg-red-50' },
          { icon: Package, label: 'Active Requests', value: stats.requests, color: 'text-amber-600 bg-amber-50' },
          { icon: Repeat, label: 'Completed Exchanges', value: stats.exchanges, color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon size={18} />
            </div>
            <p className="font-display font-bold text-2xl text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommendations */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-navy-900 flex items-center gap-2">
              <Sparkles size={20} className="text-brand-500" /> Recommended for You
            </h2>
            <Link to="/recommendations" className="text-sm text-navy-600 hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-square bg-slate-100 animate-pulse" />
                  <div className="p-3 space-y-2"><div className="h-4 bg-slate-100 rounded animate-pulse" /></div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {recommendations.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Sparkles size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No recommendations yet. Browse the marketplace and favorite items to get personalized recommendations!</p>
              <Link to="/marketplace" className="btn-primary mt-4 text-sm">Browse Marketplace</Link>
            </div>
          )}
        </div>

        {/* Recent Activity / Notifications */}
        <div>
          <h2 className="font-display font-bold text-xl text-navy-900 flex items-center gap-2 mb-4">
            <Bell size={20} className="text-navy-500" /> Recent Activity
          </h2>
          <div className="card p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    n.type === 'message' ? 'bg-blue-50 text-blue-500' :
                    n.type === 'request' ? 'bg-amber-50 text-amber-500' :
                    n.type === 'swap_request' ? 'bg-purple-50 text-purple-500' :
                    n.type === 'verification' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {n.type === 'message' ? <MessageSquare size={16} /> :
                     n.type === 'request' ? <ShoppingBag size={16} /> :
                     n.type === 'swap_request' ? <Repeat size={16} /> :
                     n.type === 'verification' ? <CheckCircle2 size={16} /> :
                     <Bell size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Verification Status */}
          <div className="card p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              {profile.verification_status === 'verified' ? (
                <CheckCircle2 size={20} className="text-emerald-500" />
              ) : (
                <Clock size={20} className="text-amber-500" />
              )}
              <h3 className="font-semibold text-sm text-slate-800">Student Verification</h3>
            </div>
            {profile.verification_status === 'verified' ? (
              <p className="text-xs text-emerald-600">Your student status is verified.</p>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-3">Get verified to build trust with buyers and sellers.</p>
                <Link to="/profile" className="btn-secondary text-xs w-full">Verify Now</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Leaf, Recycle, TrendingUp, Users, IndianRupee, Package, ArrowRightLeft, type LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ImpactPage() {
  const [stats, setStats] = useState({
    itemsReused: 0,
    moneySaved: 0,
    exchanges: 0,
    users: 0,
    activeListings: 0,
    transactions: 0,
    co2Saved: 0,
  wasteDiverted: 0,
  byType: { sell: 0, rent: 0, swap: 0 },
  byCategory: [] as { name: string; count: number }[],
  monthlyTrend: [] as { month: string; count: number }[],
  loading: true,
  error: '',
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          listingsRes, txRes, usersRes, activeRes,
          sellTxRes, rentTxRes, swapTxRes,
        ] = await Promise.all([
          supabase.from('transactions').select('amount, transaction_type, created_at', { count: 'exact' }),
          supabase.from('transactions').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('transaction_type', 'sell'),
          supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('transaction_type', 'rent'),
          supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('transaction_type', 'swap'),
        ]);

        const transactions = (listingsRes.data || []) as { amount: number; transaction_type: string; created_at: string }[];
        const totalMoneySaved = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const totalExchanges = txRes.count || 0;
        const totalUsers = usersRes.count || 0;
        const totalActive = activeRes.count || 0;

        // CO2 estimate: each reused item saves ~2.5kg CO2 (rough estimate for books/electronics)
        const co2Saved = totalExchanges * 2.5;
        // Waste diverted: each exchange = ~1 item diverted
        const wasteDiverted = totalExchanges;

        // Monthly trend (last 6 months)
        const now = new Date();
        const monthlyTrend: { month: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = d.toLocaleString('en-US', { month: 'short' });
          const count = transactions.filter((tx) => {
            const txDate = new Date(tx.created_at);
            return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
          }).length;
          monthlyTrend.push({ month: monthName, count });
        }

        // By category
        const { data: catData } = await supabase
          .from('listings')
          .select('category:categories(name)')
          .not('category_id', 'is', null);
        const catCounts: Record<string, number> = {};
        (catData || []).forEach((item: Record<string, unknown>) => {
          const cat = item.category as { name: string } | null;
          if (cat?.name) catCounts[cat.name] = (catCounts[cat.name] || 0) + 1;
        });
        const byCategory = Object.entries(catCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setStats({
          itemsReused: totalActive + totalExchanges,
          moneySaved: totalMoneySaved,
          exchanges: totalExchanges,
          users: totalUsers,
          activeListings: totalActive,
          transactions: listingsRes.count || 0,
          co2Saved,
          wasteDiverted,
          byType: {
            sell: sellTxRes.count || 0,
            rent: rentTxRes.count || 0,
            swap: swapTxRes.count || 0,
          },
          byCategory,
          monthlyTrend,
          loading: false,
          error: '',
        });
      } catch {
        setStats((prev) => ({ ...prev, loading: false, error: 'Unable to load impact data.' }));
      }
    }
    loadStats();
  }, []);

  const maxMonthly = Math.max(...stats.monthlyTrend.map((m) => m.count), 1);
  const maxCatCount = Math.max(...stats.byCategory.map((c) => c.count), 1);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-navy-700 py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-4xl text-white">CampusCart Community Impact</h1>
          <p className="mt-3 text-emerald-100 max-w-2xl mx-auto">
            Real numbers from real exchanges. Every transaction on CampusCart helps reduce waste and save students money.
          </p>
        </div>
      </div>

      <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
        {stats.loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
          </div>
        ) : stats.error ? (
          <div className="card p-8 text-center text-red-500">{stats.error}</div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Recycle} label="Items Reused" value={stats.itemsReused.toLocaleString()} color="text-emerald-600 bg-emerald-50" />
              <StatCard icon={IndianRupee} label="Student Savings" value={`₹${(stats.moneySaved / 100000).toFixed(1)}L`} color="text-navy-600 bg-navy-50" />
              <StatCard icon={ArrowRightLeft} label="Successful Exchanges" value={stats.exchanges.toLocaleString()} color="text-amber-600 bg-amber-50" />
              <StatCard icon={Users} label="Students Joined" value={stats.users.toLocaleString()} color="text-pink-600 bg-pink-50" />
            </div>

            {/* Environmental Impact */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="card p-6">
                <h3 className="font-display font-bold text-lg text-navy-900 mb-4 flex items-center gap-2">
                  <Leaf size={20} className="text-emerald-500" /> Environmental Impact
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                    <span className="text-sm text-slate-600">CO₂ Emissions Avoided</span>
                    <span className="font-display font-bold text-emerald-600">{stats.co2Saved.toFixed(1)} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl">
                    <span className="text-sm text-slate-600">Items Diverted from Disposal</span>
                    <span className="font-display font-bold text-teal-600">{stats.wasteDiverted} items</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    * Estimates based on average CO₂ savings per reused item (books, electronics, etc.). Actual impact may vary.
                  </p>
                </div>
              </div>

              {/* Exchange Types */}
              <div className="card p-6">
                <h3 className="font-display font-bold text-lg text-navy-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-navy-500" /> Exchange Types
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Sales', value: stats.byType.sell, color: 'bg-navy-500' },
                    { label: 'Rentals', value: stats.byType.rent, color: 'bg-amber-500' },
                    { label: 'Swaps', value: stats.byType.swap, color: 'bg-emerald-500' },
                  ].map((item) => {
                    const total = stats.byType.sell + stats.byType.rent + stats.byType.swap || 1;
                    const pct = (item.value / total) * 100;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">{item.label}</span>
                          <span className="text-sm font-medium text-slate-800">{item.value}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="card p-6 mb-6">
              <h3 className="font-display font-bold text-lg text-navy-900 mb-4">Monthly Exchange Trend</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {stats.monthlyTrend.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                      <div
                        className="w-full max-w-[40px] bg-gradient-to-t from-navy-600 to-brand-400 rounded-t-lg transition-all hover:from-navy-700 hover:to-brand-500"
                        style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '8px' : '2px' }}
                        title={`${m.count} exchanges`}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{m.month}</span>
                    <span className="text-xs font-medium text-slate-700">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            {stats.byCategory.length > 0 && (
              <div className="card p-6">
                <h3 className="font-display font-bold text-lg text-navy-900 mb-4 flex items-center gap-2">
                  <Package size={20} className="text-navy-500" /> Top Categories
                </h3>
                <div className="space-y-3">
                  {stats.byCategory.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{cat.name}</span>
                        <span className="text-sm font-medium text-slate-800">{cat.count} listings</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-navy-500 to-brand-400 rounded-full" style={{ width: `${(cat.count / maxCatCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) {
  return (
    <div className="card p-5">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={22} />
      </div>
      <p className="font-display font-bold text-2xl text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

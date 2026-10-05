import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getRecommendations } from '@/utils/ai';
import { ListingCard, EmptyState } from '@/components/ListingCard';
import type { Listing } from '@/types';

export function RecommendationsPage() {
  const { profile } = useAuth();
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const recs = await getRecommendations(profile!.id, 12);
      setRecommendations(recs);
      setLoading(false);
    }
    load();
  }, [profile]);

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-navy-900 flex items-center gap-2">
          <Sparkles size={28} className="text-brand-500" /> Recommendations
        </h1>
        <p className="text-slate-500 mt-1">Items you might be interested in, based on your favorites and activity.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-square bg-slate-100 animate-pulse" />
              <div className="p-3 space-y-2"><div className="h-4 bg-slate-100 rounded animate-pulse" /></div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No recommendations yet"
          description="Favorite items and browse the marketplace to get personalized recommendations."
          action={<Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recommendations.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ListingCard, EmptyState } from '@/components/ListingCard';
import type { Listing } from '@/types';

export function FavoritesPage() {
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function loadFavorites() {
      try {
        const { data } = await supabase
          .from('favorites')
          .select('listing:listings(*, category:categories(*), seller:profiles(*))')
          .eq('user_id', profile!.id)
          .order('created_at', { ascending: false });
        const favListings = (data || []).map((f) => f.listing).filter(Boolean) as unknown as Listing[];
        setListings(favListings);
      } finally {
        setLoading(false);
      }
    }
    loadFavorites();
  }, [profile]);

  if (loading) {
    return (
      <div className="container-max px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-square bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-navy-900 flex items-center gap-2">
          <Heart size={28} className="text-red-500" /> Favorites
        </h1>
        <p className="text-slate-500 mt-1">Items you've saved for later.</p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Browse the marketplace and tap the heart icon to save items you're interested in."
          action={<Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>}
        />
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{listings.length} saved item{listings.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

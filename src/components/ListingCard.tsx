import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, ShieldCheck, Eye, TrendingUp, type LucideIcon } from 'lucide-react';
import type { Listing } from '@/types';
import { formatPrice, conditionLabel, listingTypeLabel, statusColor, getListingImage, cn } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export function ListingCard({ listing }: { listing: Listing }) {
  const { profile } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    async function checkFav() {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', profile!.id)
        .eq('listing_id', listing.id)
        .maybeSingle();
      setIsFavorite(!!data);
    }
    checkFav();
  }, [profile, listing.id]);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!profile) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('user_id', profile.id).eq('listing_id', listing.id);
        setIsFavorite(false);
      } else {
        await supabase.from('favorites').insert({ user_id: profile.id, listing_id: listing.id });
        setIsFavorite(true);
      }
    } finally {
      setFavLoading(false);
    }
  }

  const [imgError, setImgError] = useState(false);
  const image = getListingImage(listing);
  const displayImage = imgError ? getListingImage({ ...listing, images: [] }) : image;
  const seller = listing.seller;

  return (
    <Link
      to={`/item/${listing.id}`}
      className="card group overflow-hidden hover:scale-[1.02] transition-transform duration-200"
    >
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={cn('badge', statusColor(listing.status))}>
            {listingTypeLabel(listing.listing_type)}
          </span>
          {listing.condition && (
            <span className="badge bg-white/90 text-slate-700">
              {conditionLabel(listing.condition)}
            </span>
          )}
        </div>
        {profile && (
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              size={18}
              className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}
            />
          </button>
        )}
        {listing.listing_type === 'rent' && listing.rental_rate && (
          <div className="absolute bottom-2 left-2 badge bg-navy-600 text-white">
            ₹{listing.rental_rate}/{listing.rental_unit || 'day'}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm text-slate-800 line-clamp-1 group-hover:text-navy-600 transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-display font-bold text-navy-700 text-lg">
            {formatPrice(listing.price)}
          </span>
          {listing.original_price && listing.original_price > listing.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(listing.original_price)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          {listing.location && (
            <>
              <MapPin size={12} />
              <span className="truncate max-w-[80px]">{listing.location}</span>
              <span className="text-slate-300">•</span>
            </>
          )}
          <Eye size={12} />
          <span>{listing.views || 0}</span>
        </div>

        {seller && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-navy-400 to-brand-500 flex items-center justify-center text-white text-[10px] font-semibold">
              {seller.full_name.charAt(0)}
            </div>
            <span className="text-xs text-slate-500 truncate flex-1">{seller.full_name}</span>
            {seller.verification_status === 'verified' && (
              <ShieldCheck size={12} className="text-emerald-500 flex-shrink-0" />
            )}
            {seller.rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                {seller.rating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-100 rounded animate-pulse" />
        <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="font-display font-semibold text-lg text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <TrendingUp size={28} className="text-red-400 rotate-180" />
      </div>
      <h3 className="font-display font-semibold text-lg text-slate-700">Something went wrong</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4 text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}

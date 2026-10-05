import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Eye,
  Star,
  ShieldCheck,
  MessageSquare,
  Tag,
  Calendar,
  Repeat,
  Flag,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Listing, Profile } from '@/types';
import { formatPrice, formatDate, conditionLabel, listingTypeLabel, statusColor, getListingImage, cn } from '@/utils/helpers';

export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [rentStart, setRentStart] = useState('');
  const [rentEnd, setRentEnd] = useState('');
  const [swapListingId, setSwapListingId] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [myListings, setMyListings] = useState<Listing[]>([]);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*, category:categories(*), seller:profiles(*)')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError('Listing not found.');
          return;
        }
        setListing(data as unknown as Listing);

        // Increment views
        await supabase.from('listings').update({ views: (data.views || 0) + 1 }).eq('id', id);

        // Check favorite
        if (profile) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', profile.id)
            .eq('listing_id', id)
            .maybeSingle();
          setIsFavorite(!!fav);

          // Load my listings for swap
          const { data: myListingsData } = await supabase
            .from('listings')
            .select('*, category:categories(*)')
            .eq('seller_id', profile.id)
            .in('status', ['active'])
            .order('created_at', { ascending: false });
          setMyListings((myListingsData as unknown as Listing[]) || []);
        }
      } catch {
        setError('Unable to load this listing. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [id, profile]);

  async function toggleFavorite() {
    if (!profile) {
      navigate('/login', { state: { from: `/item/${id}` } });
      return;
    }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', profile.id).eq('listing_id', id!);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: profile.id, listing_id: id });
      setIsFavorite(true);
    }
  }

  async function createNotification(userId: string, type: string, title: string, body: string, link: string) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      link,
    });
  }

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !listing) return;
    setActionLoading(true);
    setActionError('');
    try {
      const { error } = await supabase.from('requests').insert({
        buyer_id: profile.id,
        listing_id: listing.id,
        offer_price: parseFloat(offerPrice) || null,
        message: offerMessage,
      });
      if (error) throw error;
      await createNotification(
        listing.seller_id,
        'request',
        'New item request!',
        `${profile.full_name} wants to buy your ${listing.title} for ${formatPrice(parseFloat(offerPrice) || listing.price)}.`,
        `/item/${listing.id}`,
      );
      setActionSuccess('Your request has been sent to the seller!');
      setShowOfferModal(false);
      setOfferPrice('');
      setOfferMessage('');
    } catch {
      setActionError('Failed to send request. Please try again.');
    }
    setActionLoading(false);
  }

  async function handleRent(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !listing) return;
    setActionLoading(true);
    setActionError('');
    try {
      const start = new Date(rentStart);
      const end = new Date(rentEnd);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 0) {
        setActionError('End date must be after start date.');
        setActionLoading(false);
        return;
      }
      const rate = listing.rental_rate || listing.price;
      const total = rate * days;
      const { error } = await supabase.from('rental_requests').insert({
        listing_id: listing.id,
        renter_id: profile.id,
        start_date: rentStart,
        end_date: rentEnd,
        total_amount: total,
      });
      if (error) throw error;
      await createNotification(
        listing.seller_id,
        'rental_request',
        'New rental request!',
        `${profile.full_name} wants to rent your ${listing.title} for ${days} day(s). Total: ${formatPrice(total)}.`,
        `/item/${listing.id}`,
      );
      setActionSuccess(`Rental request sent! ${days} days for ${formatPrice(total)}.`);
      setShowRentModal(false);
      setRentStart('');
      setRentEnd('');
    } catch {
      setActionError('Failed to send rental request.');
    }
    setActionLoading(false);
  }

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !listing) return;
    setActionLoading(true);
    setActionError('');
    try {
      const { error } = await supabase.from('swaps').insert({
        proposer_id: profile.id,
        receiver_id: listing.seller_id,
        offered_listing_id: swapListingId || null,
        requested_listing_id: listing.id,
        message: swapMessage,
      });
      if (error) throw error;
      await createNotification(
        listing.seller_id,
        'swap_request',
        'New swap proposal!',
        `${profile.full_name} wants to swap for your ${listing.title}.`,
        `/swaps`,
      );
      setActionSuccess('Swap proposal sent!');
      setShowSwapModal(false);
      setSwapListingId('');
      setSwapMessage('');
    } catch {
      setActionError('Failed to send swap proposal.');
    }
    setActionLoading(false);
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !listing) return;
    setActionLoading(true);
    setActionError('');
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: profile.id,
        listing_id: listing.id,
        reason: reportReason,
        description: reportDesc,
      });
      if (error) throw error;
      setActionSuccess('Report submitted. Our team will review it.');
      setShowReportModal(false);
      setReportReason('');
      setReportDesc('');
    } catch {
      setActionError('Failed to submit report.');
    }
    setActionLoading(false);
  }

  async function startChat() {
    if (!profile || !listing) return;
    if (profile.id === listing.seller_id) return;

    try {
      // Find or create conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${profile.id},participant2_id.eq.${listing.seller_id}),and(participant1_id.eq.${listing.seller_id},participant2_id.eq.${profile.id})`)
        .maybeSingle();

      if (existing) {
        navigate(`/messages?c=${existing.id}`);
      } else {
        const p1Id = profile.id < listing.seller_id ? profile.id : listing.seller_id;
        const p2Id = profile.id < listing.seller_id ? listing.seller_id : profile.id;
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            participant1_id: p1Id,
            participant2_id: p2Id,
            listing_id: listing.id,
          })
          .select('id')
          .single();
        if (!error && newConv) {
          navigate(`/messages?c=${newConv.id}`);
        }
      }
    } catch {
      setActionError('Failed to start conversation.');
    }
  }

  if (loading) {
    return (
      <div className="container-max px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
            <div className="h-32 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container-max px-4 py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">{error || 'Listing not found.'}</p>
        <Link to="/marketplace" className="btn-primary mt-4">Back to Marketplace</Link>
      </div>
    );
  }

  const seller = listing.seller as Profile | null;
  const isOwner = profile?.id === listing.seller_id;
  const images = listing.images || [];
  const fallbackImage = getListingImage(listing);

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      {actionSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 animate-slide-down">
          <CheckCircle2 size={18} /> {actionSuccess}
          <button onClick={() => setActionSuccess('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-slide-down">
          <AlertCircle size={18} /> {actionError}
          <button onClick={() => setActionError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={images[activeImage] || fallbackImage}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    activeImage === i ? 'border-navy-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('badge', statusColor(listing.status))}>{listingTypeLabel(listing.listing_type)}</span>
                <span className="badge bg-slate-100 text-slate-600">{conditionLabel(listing.condition)}</span>
                {listing.category && (
                  <span className="badge bg-navy-50 text-navy-600">{listing.category.name}</span>
                )}
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-900">{listing.title}</h1>
              <p className="font-display font-bold text-3xl text-navy-700 mt-2">{formatPrice(listing.price)}</p>
              {listing.original_price && listing.original_price > listing.price && (
                <p className="text-sm text-slate-400 line-through mt-0.5">Original: {formatPrice(listing.original_price)}</p>
              )}
              {listing.listing_type === 'rent' && listing.rental_rate && (
                <p className="text-sm text-navy-600 mt-1">Rental: {formatPrice(listing.rental_rate)}/{listing.rental_unit || 'day'}</p>
              )}
            </div>
            <button
              onClick={toggleFavorite}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
            {listing.location && (
              <span className="flex items-center gap-1"><MapPin size={14} /> {listing.location}</span>
            )}
            <span className="flex items-center gap-1"><Eye size={14} /> {listing.views || 0} views</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(listing.created_at)}</span>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Seller Card */}
          {seller && (
            <div className="mt-6 card p-4">
              <div className="flex items-center gap-3">
                {seller.profile_image ? (
                  <img src={seller.profile_image} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-500 to-brand-600 flex items-center justify-center text-white text-lg font-semibold">
                    {seller.full_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-800">{seller.full_name}</p>
                    {seller.verification_status === 'verified' && (
                      <ShieldCheck size={16} className="text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{seller.college} • {seller.department}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {seller.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {seller.rating.toFixed(1)} ({seller.rating_count})
                      </span>
                    )}
                    <span>{seller.items_sold} sold</span>
                    <span>Joined {formatDate(seller.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {!isOwner && session ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={startChat} className="btn-secondary">
                    <MessageSquare size={18} /> Chat with Seller
                  </button>
                  <button onClick={() => setShowOfferModal(true)} className="btn-primary">
                    <Tag size={18} /> Make an Offer
                  </button>
                </div>
                {listing.listing_type === 'rent' && (
                  <button onClick={() => setShowRentModal(true)} className="btn-secondary w-full">
                    <Calendar size={18} /> Rent This Item
                  </button>
                )}
                {listing.listing_type === 'swap' && (
                  <button onClick={() => setShowSwapModal(true)} className="btn-secondary w-full">
                    <Repeat size={18} /> Propose Swap
                  </button>
                )}
                <button onClick={() => setShowReportModal(true)} className="btn-ghost w-full text-sm text-slate-400">
                  <Flag size={14} /> Report this listing
                </button>
              </>
            ) : !session ? (
              <div className="text-center p-4 bg-navy-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-3">Sign in to contact the seller, make offers, and save items.</p>
                <Link to="/login" state={{ from: `/item/${id}` }} className="btn-primary text-sm">
                  Sign In to Continue
                </Link>
              </div>
            ) : (
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">This is your listing. <Link to="/my-listings" className="text-navy-600 font-medium">Manage it here</Link></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <Modal title="Make an Offer" onClose={() => setShowOfferModal(false)}>
          <form onSubmit={handleOffer} className="space-y-4">
            <div>
              <label className="label">Your Offer Price (₹)</label>
              <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder={String(listing.price)} className="input" />
              <p className="text-xs text-slate-400 mt-1">Listed price: {formatPrice(listing.price)}</p>
            </div>
            <div>
              <label className="label">Message to Seller (optional)</label>
              <textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="I'd like to buy this item..." rows={3} className="input" />
            </div>
            <button type="submit" disabled={actionLoading} className="btn-primary w-full">
              {actionLoading ? <Spinner /> : 'Send Request'}
            </button>
          </form>
        </Modal>
      )}

      {/* Rent Modal */}
      {showRentModal && (
        <Modal title="Rent This Item" onClose={() => setShowRentModal(false)}>
          <form onSubmit={handleRent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input type="date" value={rentStart} onChange={(e) => setRentStart(e.target.value)} required className="input" />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" value={rentEnd} onChange={(e) => setRentEnd(e.target.value)} required className="input" />
              </div>
            </div>
            {rentStart && rentEnd && listing.rental_rate && (
              <div className="p-3 bg-navy-50 rounded-xl text-sm text-navy-700 flex items-center gap-2">
                <Clock size={16} />
                Estimated cost: {formatPrice(
                  listing.rental_rate *
                  Math.max(1, Math.ceil((new Date(rentEnd).getTime() - new Date(rentStart).getTime()) / (1000 * 60 * 60 * 24)))
                )}
              </div>
            )}
            <button type="submit" disabled={actionLoading} className="btn-primary w-full">
              {actionLoading ? <Spinner /> : 'Send Rental Request'}
            </button>
          </form>
        </Modal>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <Modal title="Propose a Swap" onClose={() => setShowSwapModal(false)}>
          <form onSubmit={handleSwap} className="space-y-4">
            <div>
              <label className="label">Offer Your Item</label>
              <select value={swapListingId} onChange={(e) => setSwapListingId(e.target.value)} className="input">
                <option value="">Select one of your listings...</option>
                {myListings.map((l) => (
                  <option key={l.id} value={l.id}>{l.title} ({formatPrice(l.price)})</option>
                ))}
              </select>
              {myListings.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">You don't have any active listings to offer. Create one first!</p>
              )}
            </div>
            <div>
              <label className="label">Message (optional)</label>
              <textarea value={swapMessage} onChange={(e) => setSwapMessage(e.target.value)} placeholder="I'd like to swap my item for yours..." rows={3} className="input" />
            </div>
            <button type="submit" disabled={actionLoading || myListings.length === 0} className="btn-primary w-full">
              {actionLoading ? <Spinner /> : 'Send Swap Proposal'}
            </button>
          </form>
        </Modal>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Modal title="Report This Listing" onClose={() => setShowReportModal(false)}>
          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <label className="label">Reason</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required className="input">
                <option value="">Select a reason...</option>
                <option value="spam">Spam or misleading</option>
                <option value="prohibited">Prohibited item</option>
                <option value="scam">Potential scam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Provide details..." rows={3} className="input" />
            </div>
            <button type="submit" disabled={actionLoading} className="btn-danger w-full">
              {actionLoading ? <Spinner /> : 'Submit Report'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-navy-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />;
}

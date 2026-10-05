import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Repeat, Check, X, ArrowRightLeft, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Swap, Listing, Profile } from '@/types';
import { formatPrice, timeAgo, cn, statusColor } from '@/utils/helpers';
import { EmptyState } from '@/components/ListingCard';

export function SwapsPage() {
  const { profile } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!profile) return;
    loadSwaps();
  }, [profile]);

  async function loadSwaps() {
    try {
      const { data } = await supabase
        .from('swaps')
        .select(`
          *,
          offered_listing:listings!swaps_offered_listing_id_fkey(*),
          requested_listing:listings!swaps_requested_listing_id_fkey(*),
          proposer:profiles!swaps_proposer_id_fkey(*),
          receiver:profiles!swaps_receiver_id_fkey(*)
        `)
        .or(`proposer_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`)
        .order('created_at', { ascending: false });
      setSwaps((data as unknown as Swap[]) || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSwapAction(swapId: string, status: string) {
    try {
      const { error } = await supabase.from('swaps').update({ status }).eq('id', swapId);
      if (error) throw error;

      const swap = swaps.find((s) => s.id === swapId);
      if (swap) {
        const otherId = swap.proposer_id === profile?.id ? swap.receiver_id : swap.proposer_id;
        await supabase.from('notifications').insert({
          user_id: otherId,
          type: status === 'accepted' ? 'swap_accepted' : 'swap_rejected',
          title: status === 'accepted' ? 'Swap accepted!' : 'Swap declined',
          body: status === 'accepted' ? 'Your swap proposal was accepted.' : 'Your swap proposal was declined.',
          link: '/swaps',
        });

        // If accepted, update both listings
        if (status === 'accepted' && swap.offered_listing_id && swap.requested_listing_id) {
          await supabase.from('listings').update({ status: 'swapped' }).in('id', [swap.offered_listing_id, swap.requested_listing_id]);
          // Create transaction records
          await supabase.from('transactions').insert([
            { listing_id: swap.offered_listing_id, buyer_id: swap.receiver_id, seller_id: swap.proposer_id, transaction_type: 'swap', status: 'completed' },
            { listing_id: swap.requested_listing_id, buyer_id: swap.proposer_id, seller_id: swap.receiver_id, transaction_type: 'swap', status: 'completed' },
          ]);
        }
      }
      loadSwaps();
    } catch {
      setActionError('Failed to update swap.');
    }
  }

  if (loading) {
    return <div className="container-max px-4 py-8"><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}</div></div>;
  }

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-navy-900 flex items-center gap-2">
          <Repeat size={28} className="text-navy-600" /> My Swaps
        </h1>
        <p className="text-slate-500 mt-1">Manage your item exchange proposals.</p>
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{actionError}</div>
      )}

      {swaps.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No swap proposals yet"
          description="Browse items marked 'For Swap' and propose an exchange, or list your own swap item."
          action={<Link to="/marketplace?type=swap" className="btn-primary">Find Swap Items</Link>}
        />
      ) : (
        <div className="space-y-3">
          {swaps.map((swap) => {
            const isProposer = swap.proposer_id === profile?.id;
            const otherUser = (isProposer ? swap.receiver : swap.proposer) as Profile | null;
            const offered = swap.offered_listing;
            const requested = swap.requested_listing;

            return (
              <div key={swap.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('badge', statusColor(swap.status))}>{swap.status}</span>
                    <span className="text-xs text-slate-400">{isProposer ? 'You proposed' : 'Received from'} {otherUser?.full_name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{timeAgo(swap.created_at)}</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Offered Item */}
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">{isProposer ? 'You offered:' : 'They offered:'}</p>
                    <Link to={`/item/${offered?.id || ''}`} className="flex items-center gap-2 group">
                      {offered?.images?.[0] ? (
                        <img src={offered.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center text-navy-200 font-bold">{offered?.title?.charAt(0) || '?'}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 group-hover:text-navy-600 truncate">{offered?.title || 'Deleted item'}</p>
                        <p className="text-xs text-slate-400">{offered ? formatPrice(offered.price) : ''}</p>
                      </div>
                    </Link>
                  </div>

                  <ArrowRightLeft size={20} className="text-slate-300 flex-shrink-0" />

                  {/* Requested Item */}
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">{isProposer ? 'You wanted:' : 'They wanted:'}</p>
                    <Link to={`/item/${requested?.id || ''}`} className="flex items-center gap-2 group">
                      {requested?.images?.[0] ? (
                        <img src={requested.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center text-navy-200 font-bold">{requested?.title?.charAt(0) || '?'}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 group-hover:text-navy-600 truncate">{requested?.title || 'Deleted item'}</p>
                        <p className="text-xs text-slate-400">{requested ? formatPrice(requested.price) : ''}</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {swap.message && <p className="text-sm text-slate-500 mt-3 p-2 bg-slate-50 rounded-lg">"{swap.message}"</p>}

                {/* Actions */}
                {swap.status === 'pending' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {isProposer ? (
                      <button onClick={() => handleSwapAction(swap.id, 'cancelled')} className="btn-ghost text-sm text-red-500">
                        <X size={16} /> Cancel
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleSwapAction(swap.id, 'accepted')} className="btn-primary text-sm">
                          <Check size={16} /> Accept Swap
                        </button>
                        <button onClick={() => handleSwapAction(swap.id, 'rejected')} className="btn-ghost text-sm text-red-500">
                          <X size={16} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

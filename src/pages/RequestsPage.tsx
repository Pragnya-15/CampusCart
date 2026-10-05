import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Tag,
  MapPin,
  Calendar,
  IndianRupee,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { RequestBoardPost, Category, Request, Listing } from '@/types';
import { formatPrice, formatDate, statusColor, cn, timeAgo } from '@/utils/helpers';
import { EmptyState } from '@/components/ListingCard';

export function RequestsPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'board' | 'received' | 'sent'>('board');
  const [posts, setPosts] = useState<RequestBoardPost[]>([]);
  const [received, setReceived] = useState<Request[]>([]);
  const [sent, setSent] = useState<Request[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [postForm, setPostForm] = useState({
    title: '', description: '', categoryId: '', maxBudget: '', location: '', expiryDate: '',
  });

  useEffect(() => {
    if (!profile) return;
    loadAll();
  }, [profile]);

  async function loadAll() {
    setLoading(true);
    try {
      const [boardRes, receivedRes, sentRes, catRes] = await Promise.all([
        supabase.from('request_board_posts').select('*, user:profiles(*), category:categories(*)').order('created_at', { ascending: false }),
        supabase.from('requests').select('*, listing:listings(*, category:categories(*)), buyer:profiles(*)').in('status', ['pending', 'countered']).order('created_at', { ascending: false }),
        supabase.from('requests').select('*, listing:listings(*, category:categories(*), seller:profiles(*))').eq('buyer_id', profile!.id).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      // Filter received requests to only those for listings owned by this user
      const myListingsIds = new Set<string>();
      const allReceived = (receivedRes.data as unknown as Request[]) || [];
      const filteredReceived = allReceived.filter((r) => {
        if (r.listing?.seller_id === profile!.id) {
          myListingsIds.add(r.listing_id);
          return true;
        }
        return false;
      });

      setPosts((boardRes.data as unknown as RequestBoardPost[]) || []);
      setReceived(filteredReceived);
      setSent((sentRes.data as unknown as Request[]) || []);
      setCategories((catRes.data as Category[]) || []);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setActionError('');
    if (!postForm.title.trim()) { setActionError('Title is required'); return; }
    try {
      const { error } = await supabase.from('request_board_posts').insert({
        user_id: profile.id,
        title: postForm.title.trim(),
        description: postForm.description.trim() || null,
        category_id: postForm.categoryId || null,
        max_budget: postForm.maxBudget ? parseFloat(postForm.maxBudget) : null,
        location: postForm.location.trim() || null,
        college: profile.college || null,
        expiry_date: postForm.expiryDate || null,
      });
      if (error) throw error;
      setActionSuccess('Request posted to the board!');
      setShowPostModal(false);
      setPostForm({ title: '', description: '', categoryId: '', maxBudget: '', location: '', expiryDate: '' });
      loadAll();
    } catch {
      setActionError('Failed to post request.');
    }
  }

  async function handleRequestAction(requestId: string, status: string, listingId: string) {
    try {
      const { error } = await supabase.from('requests').update({ status }).eq('id', requestId);
      if (error) throw error;

      // If accepted, create notification and optionally mark listing as sold
      if (status === 'accepted') {
        const req = received.find((r) => r.id === requestId);
        if (req) {
          await supabase.from('notifications').insert({
            user_id: req.buyer_id,
            type: 'request_accepted',
            title: 'Your request was accepted!',
            body: `The seller accepted your offer for ${req.listing?.title}.`,
            link: `/item/${req.listing_id}`,
          });
        }
      } else if (status === 'rejected') {
        const req = received.find((r) => r.id === requestId);
        if (req) {
          await supabase.from('notifications').insert({
            user_id: req.buyer_id,
            type: 'request_rejected',
            title: 'Your request was declined',
            body: `The seller declined your offer for ${req.listing?.title}.`,
            link: `/item/${req.listing_id}`,
          });
        }
      }

      loadAll();
      setActionSuccess(`Request ${status}.`);
    } catch {
      setActionError('Failed to update request.');
    }
  }

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy-900">Requests</h1>
          <p className="text-slate-500 mt-1">Post what you need, or manage offers on your items.</p>
        </div>
        <button onClick={() => setShowPostModal(true)} className="btn-primary text-sm">
          <Plus size={16} /> Post a Request
        </button>
      </div>

      {actionSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} /> {actionSuccess}
          <button onClick={() => setActionSuccess('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { key: 'board', label: 'Request Board', icon: Package },
          { key: 'received', label: 'Received Offers', icon: Tag },
          { key: 'sent', label: 'My Requests', icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.key ? 'border-navy-600 text-navy-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={16} /> {t.label}
            {t.key === 'received' && received.length > 0 && (
              <span className="badge bg-navy-100 text-navy-700">{received.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : tab === 'board' ? (
        posts.length === 0 ? (
          <EmptyState icon={Package} title="No requests on the board" description="Be the first to post what you need!" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800">{post.title}</h3>
                  {post.category && <span className="badge bg-navy-50 text-navy-600 text-xs flex-shrink-0">{post.category.name}</span>}
                </div>
                {post.description && <p className="text-sm text-slate-500 mb-3">{post.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {post.max_budget && (
                    <span className="flex items-center gap-1"><IndianRupee size={12} /> Max: {formatPrice(post.max_budget)}</span>
                  )}
                  {post.location && <span className="flex items-center gap-1"><MapPin size={12} /> {post.location}</span>}
                  {post.expiry_date && <span className="flex items-center gap-1"><Calendar size={12} /> By {formatDate(post.expiry_date)}</span>}
                  <span>{timeAgo(post.created_at)}</span>
                </div>
                {post.user && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-400 to-brand-500 flex items-center justify-center text-white text-xs font-semibold">
                      {post.user.full_name.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-500">{post.user.full_name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === 'received' ? (
          received.length === 0 ? (
            <EmptyState icon={Tag} title="No offers received" description="When someone makes an offer on your items, it'll show up here." />
          ) : (
            <div className="space-y-3">
              {received.map((req) => (
                <div key={req.id} className="card p-4 flex items-center gap-4">
                  {req.listing?.images?.[0] ? (
                    <img src={req.listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-navy-50 flex items-center justify-center text-navy-200 font-bold text-xl">
                      {req.listing?.title?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/item/${req.listing_id}`} className="font-medium text-slate-800 hover:text-navy-600 line-clamp-1">
                      {req.listing?.title || 'Unknown item'}
                    </Link>
                    <p className="text-sm text-slate-500">
                      Offer: <span className="font-semibold text-navy-700">{req.offer_price ? formatPrice(req.offer_price) : 'Listed price'}</span>
                    </p>
                    {req.message && <p className="text-xs text-slate-400 mt-1 line-clamp-1">"{req.message}"</p>}
                    <p className="text-xs text-slate-400 mt-1">{req.buyer?.full_name} • {timeAgo(req.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('badge text-xs', statusColor(req.status))}>{req.status}</span>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleRequestAction(req.id, 'accepted', req.listing_id)} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100">Accept</button>
                        <button onClick={() => handleRequestAction(req.id, 'rejected', req.listing_id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : sent.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No requests sent" description="Browse the marketplace and make an offer on an item to get started." action={<Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>} />
        ) : (
          <div className="space-y-3">
            {sent.map((req) => (
              <div key={req.id} className="card p-4 flex items-center gap-4">
                {req.listing?.images?.[0] ? (
                  <img src={req.listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-navy-50 flex items-center justify-center text-navy-200 font-bold text-xl">
                    {req.listing?.title?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/item/${req.listing_id}`} className="font-medium text-slate-800 hover:text-navy-600 line-clamp-1">
                    {req.listing?.title || 'Unknown item'}
                  </Link>
                  <p className="text-sm text-slate-500">
                    Your offer: <span className="font-semibold text-navy-700">{req.offer_price ? formatPrice(req.offer_price) : 'Listed price'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(req.created_at)}</p>
                </div>
                <span className={cn('badge text-xs', statusColor(req.status))}>{req.status}</span>
              </div>
            ))}
          </div>
        )}

      {/* Post Request Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPostModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-navy-900">Post a Request</h2>
              <button onClick={() => setShowPostModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handlePostRequest} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input type="text" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required placeholder="I need a DBMS textbook for 3rd semester" className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} rows={3} placeholder="Describe what you need..." className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={postForm.categoryId} onChange={(e) => setPostForm({ ...postForm, categoryId: e.target.value })} className="input">
                    <option value="">Any</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Max Budget (₹)</label>
                  <input type="number" value={postForm.maxBudget} onChange={(e) => setPostForm({ ...postForm, maxBudget: e.target.value })} placeholder="500" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input type="text" value={postForm.location} onChange={(e) => setPostForm({ ...postForm, location: e.target.value })} placeholder="Campus" className="input" />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="date" value={postForm.expiryDate} onChange={(e) => setPostForm({ ...postForm, expiryDate: e.target.value })} className="input" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Post Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

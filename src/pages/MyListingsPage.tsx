import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Package,
  AlertCircle,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Listing, Category } from '@/types';
import { formatPrice, formatDate, statusColor, conditionLabel, listingTypeLabel, cn } from '@/utils/helpers';
import { EmptyState } from '@/components/ListingCard';

export function MyListingsPage() {
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '', condition: '', status: '' });

  useEffect(() => {
    if (!profile) return;
    async function loadListings() {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*, category:categories(*)')
          .eq('seller_id', profile!.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setListings((data as unknown as Listing[]) || []);
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        setCategories((cats as Category[]) || []);
      } catch {
        setError('Unable to load your listings.');
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, [profile]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('listings').update({ status }).eq('id', id);
    if (!error) {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: status as Listing['status'] } : l));
    }
  }

  async function deleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  }

  function startEdit(listing: Listing) {
    setEditing(listing);
    setEditForm({
      title: listing.title,
      price: String(listing.price),
      description: listing.description || '',
      condition: listing.condition,
      status: listing.status,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase.from('listings').update({
      title: editForm.title,
      price: parseFloat(editForm.price),
      description: editForm.description,
      condition: editForm.condition,
      status: editForm.status,
    }).eq('id', editing.id);
    if (!error) {
      setListings((prev) => prev.map((l) => l.id === editing.id ? {
        ...l,
        title: editForm.title,
        price: parseFloat(editForm.price),
        description: editForm.description,
        condition: editForm.condition as Listing['condition'],
        status: editForm.status as Listing['status'],
      } : l));
      setEditing(null);
    }
  }

  if (loading) {
    return (
      <div className="container-max px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy-900">My Listings</h1>
          <p className="text-slate-500 mt-1">Manage your items on the marketplace.</p>
        </div>
        <Link to="/sell" className="btn-primary text-sm">
          <Tag size={16} /> Sell New Item
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 mb-4">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No listings yet"
          description="Start selling by creating your first listing on CampusCart."
          action={<Link to="/sell" className="btn-primary"><Tag size={16} /> Sell an Item</Link>}
        />
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="card p-4 flex items-center gap-4">
              <Link to={`/item/${listing.id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-navy-50 text-navy-200 font-bold text-xl">
                    {listing.title.charAt(0)}
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/item/${listing.id}`} className="font-medium text-slate-800 hover:text-navy-600 line-clamp-1">
                  {listing.title}
                </Link>
                <p className="font-display font-bold text-navy-700">{formatPrice(listing.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('badge text-xs', statusColor(listing.status))}>
                    {listing.status.toUpperCase()}
                  </span>
                  <span className="badge bg-slate-100 text-slate-600 text-xs">{conditionLabel(listing.condition)}</span>
                  <span className="text-xs text-slate-400">{listing.views || 0} views</span>
                  <span className="text-xs text-slate-400">• {formatDate(listing.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {listing.status === 'active' && (
                  <button onClick={() => updateStatus(listing.id, 'paused')} title="Pause" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                    <EyeOff size={16} />
                  </button>
                )}
                {listing.status === 'paused' && (
                  <button onClick={() => updateStatus(listing.id, 'active')} title="Resume" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                    <Eye size={16} />
                  </button>
                )}
                {listing.status === 'active' && (
                  <button onClick={() => updateStatus(listing.id, 'sold')} title="Mark Sold" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={16} />
                  </button>
                )}
                <button onClick={() => startEdit(listing)} title="Edit" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteListing(listing.id)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-navy-900">Edit Listing</h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Price (₹)</label>
                <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Condition</label>
                <select value={editForm.condition} onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })} className="input">
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="input">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="swapped">Swapped</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="input" />
              </div>
              <button onClick={saveEdit} className="btn-primary w-full">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

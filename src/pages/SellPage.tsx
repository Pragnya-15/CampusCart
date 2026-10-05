import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  ImagePlus,
  X,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Category, ItemCondition, ListingType } from '@/types';
import { recommendPrice, generateDescription, detectSuspiciousListing, type PriceRecommendation } from '@/utils/ai';
import { formatPrice } from '@/utils/helpers';

export function SellPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    originalPrice: '',
    condition: 'good' as ItemCondition,
    listingType: 'sell' as ListingType,
    location: '',
    college: '',
    availability: 'available',
    ageYears: '0',
    features: '',
    rentalRate: '',
    rentalUnit: 'day',
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [priceRec, setPriceRec] = useState<PriceRecommendation | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [suspiciousWarning, setSuspiciousWarning] = useState<string[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories((data as Category[]) || []);
    }
    loadCategories();
    if (profile?.college) setForm((prev) => ({ ...prev, college: profile.college || '' }));
  }, [profile]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setError('');
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be under 5MB.');
        continue;
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${profile!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (uploadError) {
        setError('Failed to upload image. Please try again.');
        continue;
      }
      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);
      newUrls.push(urlData.publicUrl);
    }

    setImageUrls((prev) => [...prev, ...newUrls].slice(0, 5));
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePriceRecommendation() {
    if (!form.title.trim() || !form.condition) return;
    setPriceLoading(true);
    const rec = await recommendPrice(
      form.title,
      form.categoryId || null,
      form.condition,
      form.originalPrice ? parseFloat(form.originalPrice) : null,
      parseInt(form.ageYears) || 0,
    );
    setPriceRec(rec);
    setPriceLoading(false);
  }

  function handleGenerateDescription() {
    if (!form.title.trim()) return;
    setDescLoading(true);
    const desc = generateDescription(
      form.title,
      form.condition,
      parseInt(form.ageYears) || 0,
      form.features,
      form.listingType,
    );
    update('description', desc);
    setDescLoading(false);
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Item name is required';
    if (form.title.trim().length < 3) return 'Item name must be at least 3 characters';
    if (!form.categoryId) return 'Please select a category';
    if (!form.price && form.listingType === 'sell') return 'Price is required for sale listings';
    if (form.listingType === 'rent' && !form.rentalRate) return 'Rental rate is required for rent listings';
    if (!form.condition) return 'Please select a condition';
    if (!form.location.trim()) return 'Location is required';
    if (!form.college.trim()) return 'College is required';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for suspicious content
    const suspicious = detectSuspiciousListing(
      form.title,
      form.description,
      parseFloat(form.price) || 0,
      imageUrls,
      form.categoryId,
    );
    setSuspiciousWarning(suspicious.reasons);

    setLoading(true);
    try {
      const { data, error } = await supabase.from('listings').insert({
        seller_id: profile!.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category_id: form.categoryId,
        price: parseFloat(form.price) || 0,
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        condition: form.condition,
        listing_type: form.listingType,
        location: form.location.trim(),
        college: form.college.trim(),
        status: 'active',
        images: imageUrls,
        rental_rate: form.listingType === 'rent' ? parseFloat(form.rentalRate) : null,
        rental_unit: form.listingType === 'rent' ? form.rentalUnit : null,
      }).select('id').single();

      if (error) throw error;

      setSuccess('Your item has been listed successfully!');
      setTimeout(() => navigate(`/item/${data.id}`), 1500);
    } catch {
      setError('Failed to create listing. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-navy-900 flex items-center gap-2">
          <Tag size={28} className="text-navy-600" /> Sell an Item
        </h1>
        <p className="text-slate-500 mt-1">List your item on the CampusCart marketplace.</p>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 animate-slide-down">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {suspiciousWarning.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <p className="font-medium flex items-center gap-1 mb-1"><Info size={16} /> Listing flagged for review:</p>
          <ul className="list-disc list-inside text-xs">
            {suspiciousWarning.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <p className="text-xs mt-1">Your listing is still published, but an admin may review it.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="card p-5">
          <label className="label">Item Images (up to 5)</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {imageUrls.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-navy-400 flex items-center justify-center cursor-pointer transition-colors">
                <ImagePlus size={24} className="text-slate-400" />
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Item Name</label>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required placeholder="Casio Scientific Calculator" className="input" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required className="input">
                <option value="">Select category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Condition</label>
              <select value={form.condition} onChange={(e) => update('condition', e.target.value as ItemCondition)} required className="input">
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Listing Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['sell', 'rent', 'swap'] as ListingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update('listingType', type)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    form.listingType === type
                      ? 'bg-navy-600 text-white border-navy-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type === 'sell' ? 'For Sale' : type === 'rent' ? 'For Rent' : 'For Swap'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {form.listingType === 'sell' && (
              <div>
                <label className="label">Price (₹)</label>
                <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} required={form.listingType === 'sell'} placeholder="450" className="input" />
              </div>
            )}
            <div>
              <label className="label">Original Price (₹) — optional</label>
              <input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} placeholder="1200" className="input" />
            </div>
            {form.listingType === 'rent' && (
              <>
                <div>
                  <label className="label">Rental Rate (₹)</label>
                  <input type="number" value={form.rentalRate} onChange={(e) => update('rentalRate', e.target.value)} required={form.listingType === 'rent'} placeholder="30" className="input" />
                </div>
                <div>
                  <label className="label">Rental Unit</label>
                  <select value={form.rentalUnit} onChange={(e) => update('rentalUnit', e.target.value)} className="input">
                    <option value="day">Per Day</option>
                    <option value="week">Per Week</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="label">Age (years)</label>
              <input type="number" value={form.ageYears} onChange={(e) => update('ageYears', e.target.value)} placeholder="2" className="input" />
            </div>
          </div>

          {/* AI Price Recommendation */}
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-brand-500" />
              <span className="font-medium text-sm text-brand-700">AI Price Recommendation</span>
            </div>
            <button
              type="button"
              onClick={handlePriceRecommendation}
              disabled={priceLoading || !form.title.trim()}
              className="btn-secondary text-sm bg-white border-brand-200 text-brand-600 hover:bg-brand-50"
            >
              {priceLoading ? (
                <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              ) : (
                <><TrendingUp size={16} /> Get Price Suggestion</>
              )}
            </button>
            {priceRec && (
              <div className="mt-3 p-3 bg-white rounded-xl space-y-2">
                <p className="font-display font-bold text-lg text-navy-700">
                  Suggested: {formatPrice(priceRec.recommended)}
                  <span className="text-sm font-normal text-slate-500 ml-2">({formatPrice(priceRec.low)} – {formatPrice(priceRec.high)})</span>
                </p>
                <p className="text-xs text-slate-600">{priceRec.explanation}</p>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-slate-400">• {priceRec.factors.condition}</p>
                  <p className="text-xs text-slate-400">• {priceRec.factors.age}</p>
                  <p className="text-xs text-slate-400">• {priceRec.factors.market}</p>
                </div>
                <button
                  type="button"
                  onClick={() => update('price', String(priceRec.recommended))}
                  className="btn-primary text-xs mt-2"
                >
                  Use Suggested Price
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description with AI Assistant */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Description</label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={descLoading || !form.title.trim()}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              {descLoading ? (
                <div className="w-3 h-3 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              ) : (
                <><Sparkles size={14} /> Generate with AI</>
              )}
            </button>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={5}
            placeholder="Describe your item — condition, features, what's included..."
            className="input"
          />
          <div>
            <label className="label">Key Features (comma-separated, for AI description)</label>
            <input type="text" value={form.features} onChange={(e) => update('features', e.target.value)} placeholder="Scientific functions, battery included, cover" className="input" />
          </div>
        </div>

        {/* Location */}
        <div className="card p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} required placeholder="Hostel Block A, Campus" className="input" />
            </div>
            <div>
              <label className="label">College</label>
              <input type="text" value={form.college} onChange={(e) => update('college', e.target.value)} required placeholder="Your College" className="input" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}

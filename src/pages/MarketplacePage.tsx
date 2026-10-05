import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Package, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ListingCard, ListingCardSkeleton, EmptyState, ErrorState } from '@/components/ListingCard';
import type { Listing, Category } from '@/types';
import { parseSmartSearch } from '@/utils/ai';

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [smartSearchActive, setSmartSearchActive] = useState(false);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [listingType, setListingType] = useState(searchParams.get('type') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories((data as Category[]) || []);
    }
    loadCategories();
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('listings')
        .select('*, category:categories(*), seller:profiles(*)')
        .eq('status', 'active');

      // Smart search or regular search
      if (search.trim()) {
        if (smartSearchActive) {
          const parsed = await parseSmartSearch(search, categories);
          query = query.ilike('title', `%${parsed.keyword}%`);
          if (parsed.categoryId) query = query.eq('category_id', parsed.categoryId);
          if (parsed.maxPrice) query = query.lte('price', parsed.maxPrice);
          if (parsed.minPrice) query = query.gte('price', parsed.minPrice);
          if (parsed.condition) query = query.eq('condition', parsed.condition);
          if (parsed.listingType) query = query.eq('listing_type', parsed.listingType);
          if (parsed.location) query = query.ilike('location', `%${parsed.location}%`);
        } else {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }
      }

      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (minPrice) query = query.gte('price', parseInt(minPrice));
      if (maxPrice) query = query.lte('price', parseInt(maxPrice));
      if (condition) query = query.eq('condition', condition);
      if (listingType) query = query.eq('listing_type', listingType);
      if (location) query = query.ilike('location', `%${location}%`);

      switch (sortBy) {
        case 'price-low': query = query.order('price', { ascending: true }); break;
        case 'price-high': query = query.order('price', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(60);
      if (error) throw error;
      setListings((data as unknown as Listing[]) || []);
    } catch (err) {
      setError('Unable to load listings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, categorySlug, minPrice, maxPrice, condition, listingType, location, sortBy, categories, smartSearchActive]);

  useEffect(() => {
    if (categories.length === 0) return;
    fetchListings();
  }, [fetchListings, categories.length]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (categorySlug) params.category = categorySlug;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (condition) params.condition = condition;
    if (listingType) params.type = listingType;
    if (location) params.location = location;
    if (sortBy) params.sort = sortBy;
    setSearchParams(params);
    fetchListings();
  }

  function clearFilters() {
    setSearch('');
    setCategorySlug('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setListingType('');
    setLocation('');
    setSortBy('newest');
    setSmartSearchActive(false);
    setSearchParams({});
  }

  const hasFilters = search || categorySlug || minPrice || maxPrice || condition || listingType || location;

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-navy-900">Marketplace</h1>
        <p className="text-slate-500 mt-1">Browse items listed by students across campus.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search textbooks, calculators, lab items..."
              className="input pl-10"
            />
          </div>
          <button
            type="button"
            onClick={() => setSmartSearchActive(!smartSearchActive)}
            className={`px-3 rounded-xl border transition-colors flex items-center gap-1.5 text-sm font-medium ${
              smartSearchActive
                ? 'bg-brand-50 border-brand-300 text-brand-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Smart Search: type naturally like 'I need a DBMS book under ₹500'"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">AI Search</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button type="submit" className="btn-primary">Search</button>
        </div>
        {smartSearchActive && (
          <p className="mt-2 text-xs text-brand-600 flex items-center gap-1">
            <Sparkles size={12} />
            Smart search is ON — try: "I need a DBMS book under ₹500 near my college"
          </p>
        )}
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="input">
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Min Price (₹)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Max Price (₹)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="10000" className="input" />
            </div>
            <div>
              <label className="label">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input">
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="input">
                <option value="">All Types</option>
                <option value="sell">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="swap">For Swap</option>
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or area" className="input" />
            </div>
            <div>
              <label className="label">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-ghost w-full text-sm">
                <X size={16} /> Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
        <button
          onClick={() => { setCategorySlug(''); setSearchParams({}); fetchListings(); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !categorySlug ? 'bg-navy-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategorySlug(cat.slug); fetchListings(); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categorySlug === cat.slug ? 'bg-navy-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {error ? (
        <ErrorState message={error} onRetry={fetchListings} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No listings found"
          description={hasFilters ? "Try adjusting your search or filters to see more results." : "Be the first to list an item on CampusCart!"}
        />
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{listings.length} item{listings.length !== 1 ? 's' : ''} found</p>
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

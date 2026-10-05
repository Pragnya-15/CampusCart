import type {
  ItemCondition,
  ListingType,
  Listing,
} from '@/types';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function conditionLabel(condition: ItemCondition): string {
  const labels: Record<ItemCondition, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
  };
  return labels[condition] || condition;
}

export function listingTypeLabel(type: ListingType): string {
  const labels: Record<ListingType, string> = {
    sell: 'For Sale',
    rent: 'For Rent',
    swap: 'For Swap',
  };
  return labels[type] || type;
}

export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    sold: 'bg-blue-100 text-blue-700',
    rented: 'bg-purple-100 text-purple-700',
    swapped: 'bg-amber-100 text-amber-700',
    paused: 'bg-gray-100 text-gray-700',
    expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    countered: 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-700',
    verified: 'bg-emerald-100 text-emerald-700',
    open: 'bg-emerald-100 text-emerald-700',
    reviewed: 'bg-blue-100 text-blue-700',
    resolved: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  books: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  calculators: 'https://images.pexels.com/photos/5776/calculator-scientific.jpg?auto=compress&cs=tinysrgb&h=650&w=940',
  electronics: 'https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'lab-equipment': 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  stationery: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  bags: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'hostel-items': 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  sports: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-ball-46798.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  fashion: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  accessories: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  other: 'https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function getCategoryFallbackImage(categorySlug?: string | null): string {
  if (!categorySlug) return CATEGORY_FALLBACK_IMAGES.other;
  return CATEGORY_FALLBACK_IMAGES[categorySlug] || CATEGORY_FALLBACK_IMAGES.other;
}

export function getListingImage(listing: Listing): string {
  if (listing.images && listing.images.length > 0 && listing.images[0]) {
    return listing.images[0];
  }
  return getCategoryFallbackImage(listing.category?.slug);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '...';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

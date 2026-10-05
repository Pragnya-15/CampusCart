export type UserRole = 'user' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type ListingStatus = 'active' | 'sold' | 'rented' | 'swapped' | 'paused' | 'expired';
export type ListingType = 'sell' | 'rent' | 'swap';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'completed' | 'cancelled';
export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type RentalStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';
export type NotificationType =
  | 'message'
  | 'request'
  | 'request_accepted'
  | 'request_rejected'
  | 'counter_offer'
  | 'listing_sold'
  | 'swap_request'
  | 'swap_accepted'
  | 'swap_rejected'
  | 'verification'
  | 'rental_request'
  | 'rental_accepted'
  | 'rental_rejected'
  | 'favorite_update'
  | 'report';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  college: string | null;
  department: string | null;
  year_of_study: string | null;
  phone: string | null;
  profile_image: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  rating: number;
  rating_count: number;
  items_sold: number;
  items_bought: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  condition: ItemCondition;
  listing_type: ListingType;
  location: string | null;
  college: string | null;
  status: ListingStatus;
  images: string[];
  views: number;
  rental_rate: number | null;
  rental_unit: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  seller?: Profile | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing | null;
}

export interface Request {
  id: string;
  buyer_id: string;
  listing_id: string;
  offer_price: number | null;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  listing?: Listing | null;
  buyer?: Profile | null;
}

export interface RentalRequest {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: RentalStatus;
  created_at: string;
  listing?: Listing | null;
  renter?: Profile | null;
}

export interface Swap {
  id: string;
  proposer_id: string;
  receiver_id: string;
  offered_listing_id: string | null;
  requested_listing_id: string | null;
  message: string | null;
  status: SwapStatus;
  created_at: string;
  offered_listing?: Listing | null;
  requested_listing?: Listing | null;
  proposer?: Profile | null;
  receiver?: Profile | null;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  listing_id: string | null;
  created_at: string;
  listing?: Listing | null;
  participant1?: Profile | null;
  participant2?: Profile | null;
  last_message?: Message | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read_status: boolean;
  created_at: string;
  sender?: Profile | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read_status: boolean;
  link: string | null;
  created_at: string;
}

export interface StudentVerification {
  id: string;
  user_id: string;
  college: string;
  student_id_reference: string;
  college_email: string | null;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  user?: Profile | null;
}

export interface Report {
  id: string;
  reporter_id: string;
  listing_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  listing?: Listing | null;
  reporter?: Profile | null;
}

export interface RequestBoardPost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  max_budget: number | null;
  location: string | null;
  college: string | null;
  expiry_date: string | null;
  status: string;
  created_at: string;
  user?: Profile | null;
  category?: Category | null;
}

export interface Transaction {
  id: string;
  listing_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  transaction_type: string;
  amount: number | null;
  status: string;
  created_at: string;
}

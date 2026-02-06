export interface Booking {
  id: string;
  concert_id: string;
  user_id: string;
  idempotency_key: string;
  status: BookingStatus;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  tier_id: string;
  quantity: number;
  price_per_ticket: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface BookingWithItems extends Booking {
  items: BookingItem[];
}

export interface LockedTier {
  id: string;
  tier_name: string;
  available_quantity: number;
  price: number;
  version: number;
}

export interface CreateBookingResult {
  success: boolean;
  bookingId?: string;
  booking?: BookingWithItems;
  duplicate?: boolean;
  error?: string;
}

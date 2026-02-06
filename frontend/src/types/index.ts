export interface Concert {
  id: string;
  name: string;
  venue: string;
  event_date: string;
  created_at: string;
}

export interface TicketTier {
  id: string;
  tier_name: string;
  price: number; // Transformed to number
  available_quantity: number;
  total_quantity: number;
}

export interface BookingTicket {
  tierId: string;
  quantity: number;
}

export interface CreateBookingRequest {
  concertId: string;
  userId: string;
  tickets: BookingTicket[];
  idempotencyKey: string;
  totalAmount: number;
}

export interface BookingItem {
  id: string;
  tier_id: string;
  quantity: number;
  price_per_ticket: number; // Now a number (transformed)
}

export interface Booking {
  id: string;
  concert_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'failed';
  total_amount: number; // Now a number (transformed)
  created_at: string;
  items: BookingItem[];
}
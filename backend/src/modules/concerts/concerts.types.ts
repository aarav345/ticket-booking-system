export interface Concert {
  id: string;
  name: string;
  venue: string;
  event_date: Date;
  created_at: Date;
}

export interface TicketTier {
  id: string;
  concert_id: string;
  tier_name: string;
  price: number;
  total_quantity: number;
  available_quantity: number;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface TicketAvailability {
  id: string;
  tier_name: string;
  price: number;
  total_quantity: number;
  available_quantity: number;
}

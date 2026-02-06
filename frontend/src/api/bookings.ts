import { apiClient } from './client';
import type { CreateBookingRequest, Booking, BookingItem } from '../types';

// Raw response types from API (before transformation)
interface RawBookingItem {
  id: string;
  tier_id: string;
  quantity: number;
  price_per_ticket: string; // Comes as string from DB
}

interface RawBooking {
  id: string;
  concert_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'failed';
  total_amount: string; // Comes as string from DB
  created_at: string;
  items: RawBookingItem[];
}

const transformBookingItem = (item: RawBookingItem): BookingItem => ({
  ...item,
  price_per_ticket: Number(item.price_per_ticket),
});

const transformBooking = (rawBooking: RawBooking): Booking => ({
  ...rawBooking,
  total_amount: Number(rawBooking.total_amount),
  items: rawBooking.items.map(transformBookingItem),
});

export const bookingApi = {
  create: async (request: CreateBookingRequest): Promise<Booking> => {
    const { data } = await apiClient.post<{ data: RawBooking }>(
      '/bookings',
      request
    );
    return transformBooking(data.data);
  },

  getById: async (id: string): Promise<Booking> => {
    const { data } = await apiClient.get<{ data: RawBooking }>(`/bookings/${id}`);
    return transformBooking(data.data);
  },
};
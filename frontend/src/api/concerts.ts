import { apiClient } from './client';
import type { Concert, TicketTier } from '../types';

export const concertApi = {
  getAll: async (): Promise<Concert[]> => {
    const { data } = await apiClient.get<{ data: Concert[] }>('/concerts');
    return data.data;
  },

  getById: async (id: string): Promise<Concert> => {
    const { data } = await apiClient.get<{ data: Concert }>(`/concerts/${id}`);
    return data.data;
  },

  getAvailability: async (id: string): Promise<TicketTier[]> => {
    const { data } = await apiClient.get<{ data: TicketTier[] }>(
      `/concerts/${id}/availability`
    );
    // Transform price to number
    return data.data.map(tier => ({
      ...tier,
      price: Number(tier.price)
    }));
  },
};
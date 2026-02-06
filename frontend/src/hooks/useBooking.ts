import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/bookings';
import type { CreateBookingRequest } from '../types';

// Omit idempotencyKey since the hook will provide it
type BookingInput = Omit<CreateBookingRequest, 'idempotencyKey'>;

export function useBooking() {
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const mutation = useMutation({
    mutationFn: (request: BookingInput) => 
      bookingApi.create({ 
        ...request, 
        idempotencyKey  // Automatically inject the idempotency key
      }),
    onSuccess: () => {
      // Invalidate availability cache to show updated quantities
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  return {
    createBooking: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    booking: mutation.data,
    reset: mutation.reset,
  };
}
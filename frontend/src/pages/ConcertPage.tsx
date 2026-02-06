import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { concertApi } from '../api/concerts';
import { TierCard } from '../components/TierCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BookingSuccess } from './BookingSuccess';
import { useBooking } from '../hooks/useBooking';

const CONCERT_ID = 'concert_001'; // Hardcoded for demo
const USER_ID = 'user_demo'; // Mock user


export function ConcertPage() {
  const [selections, setSelections] = useState<Record<string, number>>({});

  // Fetch concert details
  const { data: concert, isLoading: concertLoading } = useQuery({
    queryKey: ['concert', CONCERT_ID],
    queryFn: () => concertApi.getById(CONCERT_ID),
  });

  // Fetch availability (polls every 5 seconds to show real-time updates)
  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['availability', CONCERT_ID],
    queryFn: () => concertApi.getAvailability(CONCERT_ID),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const booking = useBooking();

  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelections((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const calculateTotal = () => {
    if (!tiers) return 0;
    return Object.entries(selections).reduce((total, [tierId, quantity]) => {
      const tier = tiers.find((t) => t.id === tierId);
      return total + (tier ? tier.price * quantity : 0);
    }, 0);
  };

  const handleSubmit = () => {
    if (!tiers) return;

    const tickets = Object.entries(selections)
      .filter(([, quantity]) => quantity > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity }));

    if (tickets.length === 0) {
      alert('Please select at least one ticket');
      return;
    }

    booking.createBooking({
      concertId: CONCERT_ID,
      userId: USER_ID,
      tickets,
      totalAmount: calculateTotal(),
    });
  };

  const handleNewBooking = () => {
    setSelections({});
    booking.reset();
  };

  if (concertLoading || tiersLoading) {
    return <LoadingSpinner />;
  }

  if (!concert || !tiers) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load concert information</p>
      </div>
    );
  }

  // Show success screen after booking
  if (booking.isSuccess && booking.booking) {
    return <BookingSuccess booking={booking.booking} onNewBooking={handleNewBooking} />;
  }

  const totalAmount = calculateTotal();
  const hasSelections = totalAmount > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {concert.name}
        </h1>
        <p className="text-lg text-gray-600">{concert.venue}</p>
        <p className="text-gray-500">
          {new Date(concert.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Error Alert */}
      {booking.isError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">
            {booking.error instanceof Error
              ? booking.error.message
              : 'Failed to complete booking. Please try again.'}
          </p>
        </div>
      )}

      {/* Ticket Tiers */}
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Select Tickets
        </h2>
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            quantity={selections[tier.id] || 0}
            onQuantityChange={(qty) => handleQuantityChange(tier.id, qty)}
          />
        ))}
      </div>

      {/* Checkout Section */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-2xl font-bold text-gray-900">Total</span>
          <span className="text-3xl font-bold text-blue-600">
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!hasSelections || booking.isLoading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
            hasSelections && !booking.isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {booking.isLoading ? 'Processing...' : 'Complete Booking'}
        </button>

        {hasSelections && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Secure checkout • No payment required (demo)
          </p>
        )}
      </div>
    </div>
  );
}
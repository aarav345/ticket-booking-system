import { type Booking } from '../types';

interface BookingSuccessProps {
  booking: Booking;
  onNewBooking: () => void;
}

export function BookingSuccess({ booking, onNewBooking }: BookingSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-green-50 border border-green-200 rounded-lg">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-gray-600 mb-6">
          Your tickets have been reserved successfully.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Booking ID</p>
            <p className="font-mono text-sm font-medium">{booking.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold text-green-600 uppercase">
              {booking.status}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Tickets</h3>
          <div className="space-y-2">
            {booking.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x tickets @ ${item.price_per_ticket.toFixed(2)}
                </span>
                <span className="font-medium">
                  ${(item.quantity * item.price_per_ticket).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${booking.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNewBooking}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Make Another Booking
      </button>
    </div>
  );
}
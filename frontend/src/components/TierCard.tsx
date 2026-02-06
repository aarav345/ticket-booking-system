import { type TicketTier } from '../types';

interface TierCardProps {
  tier: TicketTier;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export function TierCard({ tier, quantity, onQuantityChange }: TierCardProps) {
  const isAvailable = tier.available_quantity > 0;
  const maxQuantity = Math.min(10, tier.available_quantity); // Cap at 10

  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {tier.tier_name}
          </h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            ${tier.price.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Available</p>
          <p className={`text-lg font-semibold ${
            tier.available_quantity < 10 ? 'text-red-600' : 'text-green-600'
          }`}>
            {tier.available_quantity} / {tier.total_quantity}
          </p>
        </div>
      </div>

      {isAvailable ? (
        <div className="flex items-center gap-4">
          <label htmlFor={`quantity-${tier.id}`} className="text-sm font-medium text-gray-700">
            Quantity:
          </label>
          <select
            id={`quantity-${tier.id}`}
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={0}>0</option>
            {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          {quantity > 0 && (
            <span className="text-sm text-gray-600">
              Subtotal: ${(tier.price * quantity).toFixed(2)}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-2 text-center">
          <span className="text-red-700 font-medium">SOLD OUT</span>
        </div>
      )}
    </div>
  );
}
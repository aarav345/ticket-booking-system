// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  // Concert messages
  CONCERT_RETRIEVED: 'Concert retrieved successfully',
  CONCERTS_RETRIEVED: 'Concerts retrieved successfully',
  AVAILABILITY_RETRIEVED: 'Ticket availability retrieved successfully',

  // Booking messages
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_RETRIEVED: 'Booking details retrieved successfully',
  BOOKINGS_RETRIEVED: 'Bookings retrieved successfully',
  PAYMENT_SUCCESSFUL: 'Payment processed successfully',

  // General
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Concert errors
  CONCERT_NOT_FOUND: 'Concert not found',
  NO_TIERS_FOUND: 'No ticket tiers available for this concert',
  CONCERT_INACTIVE: 'This concert is no longer accepting bookings',

  // Booking errors
  BOOKING_NOT_FOUND: 'Booking not found',
  BOOKING_FAILED: 'Booking creation failed',
  DUPLICATE_BOOKING: 'This booking has already been processed',

  // Inventory errors
  INSUFFICIENT_INVENTORY: 'Insufficient tickets available',
  TIER_NOT_FOUND: 'Ticket tier not found',
  TIER_SOLD_OUT: 'This ticket tier is sold out',
  INVALID_QUANTITY: 'Invalid ticket quantity requested',

  // Payment errors
  PAYMENT_FAILED: 'Payment processing failed',
  PAYMENT_TIMEOUT: 'Payment processing timed out',
  INVALID_AMOUNT: 'Invalid payment amount',

  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_ID_FORMAT: 'Invalid ID format',
  INVALID_IDEMPOTENCY_KEY: 'Invalid or missing idempotency key',

  // Concurrency errors
  CONCURRENT_MODIFICATION:
    'Resource was modified by another request. Please retry.',
  TRANSACTION_TIMEOUT: 'Transaction timed out. Please try again.',
  LOCK_TIMEOUT: 'Unable to acquire lock. Please try again.',

  // Database errors
  DATABASE_ERROR: 'Database operation failed',
  CONNECTION_ERROR: 'Database connection error',
  TRANSACTION_FAILED: 'Transaction failed and was rolled back',

  // General errors
  INTERNAL_SERVER_ERROR: 'Internal server error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
} as const;

// ============================================================================
// RESOURCE NAMES (for NotFoundError)
// ============================================================================

export const RESOURCE_NAMES = {
  CONCERT: 'concert',
  TICKET_TIER: 'ticket_tier',
  BOOKING: 'booking',
  BOOKING_ITEM: 'booking_item',
  USER: 'user',
} as const;

// ============================================================================
// ERROR CODES (for client-side error handling)
// ============================================================================

export const ERROR_CODES = {
  // Concert codes
  CONCERT_NOT_FOUND: 'CONCERT_NOT_FOUND',
  NO_TIERS_FOUND: 'NO_TIERS_FOUND',

  // Booking codes
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',

  // Inventory codes
  INSUFFICIENT_INVENTORY: 'INSUFFICIENT_INVENTORY',
  TIER_NOT_FOUND: 'TIER_NOT_FOUND',
  TIER_SOLD_OUT: 'TIER_SOLD_OUT',

  // Payment codes
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',

  // Validation codes
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_IDEMPOTENCY_KEY: 'INVALID_IDEMPOTENCY_KEY',

  // Concurrency codes
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',

  // Database codes
  DATABASE_ERROR: 'DATABASE_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
} as const;

// ============================================================================
// USER-FRIENDLY MESSAGES (for frontend display)
// ============================================================================

export const USER_MESSAGES = {
  INSUFFICIENT_INVENTORY:
    "Sorry, there aren't enough tickets available. Please adjust your selection.",
  TIER_SOLD_OUT: 'Sorry, this ticket tier is sold out.',
  PAYMENT_FAILED:
    'Your payment could not be processed. Please check your payment details and try again.',
  BOOKING_FAILED: "We couldn't complete your booking. Please try again.",
  CONCURRENT_MODIFICATION:
    'Someone else just booked these tickets. Please refresh and try again.',
  TRANSACTION_TIMEOUT: 'Your request took too long. Please try booking again.',
  TRY_AGAIN: 'Something went wrong. Please try again in a moment.',
} as const;

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `${field} has an invalid format`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must not exceed ${max}`,
  MIN_LENGTH: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field} must not exceed ${max} characters`,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate detailed insufficient inventory message
 */
export function insufficientInventoryMessage(
  tierName: string,
  requested: number,
  available: number
): string {
  return `Only ${available} ${tierName} ticket${available === 1 ? '' : 's'} remaining, you requested ${requested}`;
}

/**
 * Generate booking confirmation message
 */
export function bookingConfirmationMessage(
  bookingId: string,
  totalAmount: number
): string {
  return `Booking ${bookingId} confirmed. Total amount: $${totalAmount.toFixed(2)}`;
}

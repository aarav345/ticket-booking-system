-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Concerts table
CREATE TABLE concerts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ticket tiers table (inventory management)
CREATE TABLE ticket_tiers (
    id VARCHAR(50) PRIMARY KEY,
    concert_id VARCHAR(50) REFERENCES concerts(id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL, -- 'VIP', 'FRONT_ROW', 'GA'
    price DECIMAL(10,2) NOT NULL,
    total_quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    version INTEGER DEFAULT 0, -- For optimistic locking
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_quantity CHECK (available_quantity >= 0),
    CONSTRAINT check_total CHECK (total_quantity >= available_quantity)
);

-- Bookings table
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY,
    concert_id VARCHAR(50) REFERENCES concerts(id),
    user_id VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'confirmed', 'failed', 'cancelled'
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking items table (line items per booking)
CREATE TABLE booking_items (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE,
    tier_id VARCHAR(50) REFERENCES ticket_tiers(id),
    quantity INTEGER NOT NULL,
    price_per_ticket DECIMAL(10,2) NOT NULL,
    CONSTRAINT check_item_quantity CHECK (quantity > 0)
);

-- Indexes for performance
CREATE INDEX idx_bookings_idempotency ON bookings(idempotency_key);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_tiers_concert ON ticket_tiers(concert_id);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_tiers_updated_at BEFORE UPDATE ON ticket_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
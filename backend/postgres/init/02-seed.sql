-- Insert sample concert
INSERT INTO concerts (id, name, venue, event_date)
VALUES (
    'concert_001',
    'Summer Music Festival 2026',
    'Madison Square Garden',
    '2026-07-15 19:00:00'
);

-- Insert ticket tiers for the concert
INSERT INTO ticket_tiers (id, concert_id, tier_name, price, total_quantity, available_quantity)
VALUES 
    ('tier_vip_001', 'concert_001', 'VIP', 100.00, 100, 100),
    ('tier_fr_001', 'concert_001', 'FRONT_ROW', 50.00, 200, 200),
    ('tier_ga_001', 'concert_001', 'GA', 10.00, 500, 500);

-- Log seed data
DO $$
DECLARE
    total_tickets INTEGER;
BEGIN
    SELECT SUM(total_quantity) INTO total_tickets FROM ticket_tiers;
    RAISE NOTICE 'Seeded concert with % total tickets', total_tickets;
END $$;
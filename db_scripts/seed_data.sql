-- CarbonCalc Seed Data

-- Admin user (password: Admin@123 bcrypt-encoded)
INSERT INTO users (name, email, password, role, enabled, created_at)
VALUES (
    'Admin User',
    'admin@carboncalc.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Marketplace items
INSERT INTO marketplace (item_name, item_type, price, description, carbon_offset_value) VALUES
('Plant a Tree',          'tree_planting',     5.00,  'Sponsor the planting of one tree in a reforestation project.',        10.0),
('10 Trees Bundle',       'tree_planting',    40.00,  'Sponsor planting of 10 trees and offset about 240 kg CO2/year.',    75.0),
('1 Tonne Carbon Credit', 'carbon_credit',    25.00,  'Purchase a verified carbon credit for 1 tonne CO2 offset.',       1000.0),
('5 Tonne Carbon Credit', 'carbon_credit',   100.00,  'Purchase 5 verified carbon credits.',                             5000.0),
('Solar Energy Support',  'renewable_energy', 60.00,  'Support a community solar installation and offset grid emissions.', 120.0),
('Community Garden',      'tree_planting',    15.00,  'Support your local community garden initiative.',                   18.0);

-- Default admin-created badges
INSERT INTO badges (name, description, icon, category, threshold_kg, color, bg_color, active) VALUES
('Climate Champion', 'Save 500 kg CO2e total emissions',          'Trophy',   'general',   500,  'text-amber-600',  'bg-amber-100',  TRUE),
('Eco Warrior',      'Save 1000 kg CO2e total emissions',         'Shield',   'general',   1000, 'text-indigo-600', 'bg-indigo-100', TRUE),
('Green Commuter',   'Log 100 kg of transport emissions tracked', 'Car',      'transport', 100,  'text-blue-600',   'bg-blue-100',   TRUE),
('Energy Expert',    'Log 50 kg of energy emissions tracked',     'Zap',      'energy',    50,   'text-yellow-600', 'bg-yellow-100', TRUE),
('Food Fighter',     'Log 25 kg of food emissions tracked',       'Utensils', 'food',      25,   'text-orange-600', 'bg-orange-100', TRUE);

-- Sample goals for the seeded admin user
INSERT INTO goals (
    user_id,
    title,
    description,
    category,
    baseline_amount,
    target_amount,
    current_progress,
    timeframe_days,
    recurrence,
    estimated_savings,
    deadline,
    status
)
SELECT
    u.id,
    'Reduce transport emissions',
    'Swap at least three commute days a week to metro, biking, or walking.',
    'transport',
    180,
    40,
    18,
    30,
    'WEEKLY',
    40,
    CURRENT_DATE + INTERVAL '21 day',
    'ACTIVE'
FROM users u
WHERE u.email = 'admin@carboncalc.com'
  AND NOT EXISTS (
      SELECT 1
      FROM goals g
      WHERE g.user_id = u.id
        AND g.title = 'Reduce transport emissions'
  );

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT u.id, 'Purchase confirmed', 'You purchased Plant a Tree and offset 10 kg CO2e.', 'MARKETPLACE', FALSE, CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'admin@carboncalc.com';

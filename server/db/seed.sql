-- ============================================================
-- ECP Platform Seed Data
-- ============================================================

-- ---------------------- Markets ----------------------
INSERT INTO markets (name, code) VALUES
  ('US - California',  'US-CA'),
  ('US - General',     'US-GEN'),
  ('EU - Germany',     'EU-DE'),
  ('United Kingdom',   'UK')
ON CONFLICT (code) DO NOTHING;

-- ---------------------- Models ----------------------
INSERT INTO models (name, base_price, description) VALUES
  ('Sedan',  35000.00, 'A sleek and efficient 4-door sedan for everyday driving.'),
  ('SUV',    45000.00, 'A powerful sport utility vehicle built for adventure.'),
  ('Coupe',  55000.00, 'A premium 2-door coupe with sports performance.')
ON CONFLICT (name) DO NOTHING;

-- ---------------------- Engines ----------------------
INSERT INTO engines (name, type, price, horsepower, description) VALUES
  ('2.0L Turbo Petrol',     'petrol',   0.00,     250, 'Standard turbocharged 4-cylinder engine.'),
  ('3.0L Diesel',           'diesel',   2500.00,  280, 'Efficient turbo-diesel for long-range driving.'),
  ('Electric Drive',        'electric', 5000.00,  350, 'Zero-emission fully electric powertrain.'),
  ('2.5L Hybrid',           'hybrid',   3500.00,  300, 'Plug-in hybrid with petrol + electric combined.'),
  ('4.4L V8 Twin-Turbo',    'v8',       12000.00, 520, 'High-performance V8 for ultimate power.');

-- Model-Engine compatibility (SUV & Sedan get all, Coupe gets petrol/electric/v8)
INSERT INTO model_engines (model_id, engine_id)
SELECT m.id, e.id FROM models m, engines e
WHERE m.name IN ('Sedan', 'SUV');

INSERT INTO model_engines (model_id, engine_id)
SELECT m.id, e.id FROM models m, engines e
WHERE m.name = 'Coupe' AND e.type IN ('petrol', 'electric', 'v8');

-- ---------------------- Transmissions ----------------------
INSERT INTO transmissions (name, type, price) VALUES
  ('6-Speed Manual',       'manual',    0.00),
  ('8-Speed Automatic',    'automatic', 1500.00);

-- All models support both transmissions
INSERT INTO model_transmissions (model_id, transmission_id)
SELECT m.id, t.id FROM models m, transmissions t;

-- ---------------------- Trims ----------------------
INSERT INTO trims (name, price, description) VALUES
  ('Base',    0.00,     'Standard trim with essential features.'),
  ('Sport',   4500.00,  'Sport suspension, aggressive styling, performance tuning.'),
  ('Luxury',  8000.00,  'Premium materials, advanced tech, comfort package.');

-- All models support all trims
INSERT INTO model_trims (model_id, trim_id)
SELECT m.id, t.id FROM models m, trims t;

-- ---------------------- Exterior Options ----------------------
INSERT INTO exterior_options (name, category, price, color_hex, description) VALUES
  -- Paints
  ('Alpine White',         'paint', 0.00,     '#F2F2F2', 'Classic solid white finish.'),
  ('Jet Black',            'paint', 0.00,     '#1A1A1A', 'Deep solid black finish.'),
  ('Mineral Grey Metallic','paint', 800.00,   '#6B6B6B', 'Shimmering grey metallic paint.'),
  ('Sapphire Blue Metallic','paint', 800.00,  '#1E3A5F', 'Rich blue metallic finish.'),
  ('Melbourne Red Metallic','paint', 1200.00, '#8B1A1A', 'Vivid red with metallic flake.'),
  ('Frozen Silver Matte',  'paint', 2500.00,  '#C0C0C0', 'Premium matte silver finish.'),
  -- Body Kits
  ('Standard Body Kit',    'body_kit', 0.00,    NULL, 'Factory standard body styling.'),
  ('Aero Body Kit',        'body_kit', 3500.00, NULL, 'Aerodynamic body kit with front splitter and rear diffuser.'),
  ('Off-Road Body Kit',    'body_kit', 4000.00, NULL, 'Rugged body cladding with skid plates.'),
  -- Roof Types
  ('Standard Roof',        'roof_type', 0.00,    NULL, 'Solid standard roof.'),
  ('Panoramic Sunroof',    'roof_type', 1800.00, NULL, 'Full-length glass panoramic sunroof.'),
  ('Convertible Soft-Top', 'roof_type', 5000.00, NULL, 'Power-retractable soft-top roof.');

-- ---------------------- Interior Options ----------------------
INSERT INTO interior_options (name, category, price, color_hex, description) VALUES
  -- Seat Material
  ('Cloth',               'seat_material', 0.00,     NULL, 'Durable woven cloth upholstery.'),
  ('Leatherette (Synthetic)','seat_material', 1200.00, NULL, 'Synthetic leather with premium feel.'),
  ('Full Leather',        'seat_material', 2800.00,  NULL, 'Genuine Nappa leather upholstery.'),
  ('Alcantara',           'seat_material', 3200.00,  NULL, 'Suede-like Alcantara sport upholstery.'),
  -- Seat Color
  ('Black',               'seat_color', 0.00,    '#1A1A1A', 'Classic black interior.'),
  ('Ivory White',         'seat_color', 0.00,    '#FFFFF0', 'Light ivory interior.'),
  ('Cognac Brown',        'seat_color', 500.00,  '#834A20', 'Warm cognac brown interior.'),
  ('Red',                 'seat_color', 800.00,  '#8B1A1A', 'Bold red sport interior.'),
  -- Dashboard
  ('Standard Dashboard',  'dashboard', 0.00,    NULL, 'Standard finish dashboard.'),
  ('Carbon Fiber Trim',   'dashboard', 1500.00, NULL, 'Lightweight carbon fiber dashboard accents.'),
  ('Wood Grain Trim',     'dashboard', 1200.00, NULL, 'Natural wood grain dashboard accents.'),
  -- Ambient Lighting
  ('Standard Lighting',   'ambient_lighting', 0.00,   NULL, 'Basic interior lighting.'),
  ('Ambient LED Pack',    'ambient_lighting', 600.00,  NULL, 'Multi-color LED ambient lighting with 11 zones.'),
  ('Premium LED Pack',    'ambient_lighting', 1200.00, NULL, 'Extended ambient lighting with 64-color spectrum.');

-- ---------------------- Wheels ----------------------
INSERT INTO wheels (name, size, price, description) VALUES
  ('17" Standard Alloy',     17, 0.00,     'Standard lightweight alloy wheels.'),
  ('18" Sport Alloy',        18, 1200.00,  'Sporty design with wider stance.'),
  ('19" M-Sport Alloy',      19, 2000.00,  'Performance-oriented alloy wheels.'),
  ('20" Premium Forged',     20, 3500.00,  'Forged lightweight performance wheels.'),
  ('21" Black M-Performance',21, 4500.00,  'Oversized black performance wheels.'),
  ('17" Off-Road All-Terrain',17, 1800.00, 'Heavy-duty all-terrain wheels for off-road use.');

-- ---------------------- Packages ----------------------
INSERT INTO packages (name, price, description, includes) VALUES
  ('Technology Package',   3500.00,  'Advanced driver assistance and infotainment.',
    ARRAY['Head-up Display', 'Surround View Camera', '12-Speaker HiFi System', 'Wireless CarPlay']),
  ('Winter Package',       1800.00,  'Cold weather comfort essentials.',
    ARRAY['Heated Front Seats', 'Heated Steering Wheel', 'Heated Washer Jets']),
  ('Safety Package',       2500.00,  'Comprehensive active safety suite.',
    ARRAY['Adaptive Cruise Control', 'Lane Keep Assist', 'Blind Spot Monitoring', 'Auto Emergency Braking']),
  ('Tow Package',          1500.00,  'Towing capability add-on.',
    ARRAY['Trailer Hitch', 'Tow Wiring Harness', 'Trailer Sway Control']);

-- ---------------------- Rules ----------------------
INSERT INTO rules (rule_type, condition_key, condition_val, action, target_table, target_name, description) VALUES
  -- Market exclusions
  ('exclusion', 'market',   'US-CA',      'exclude', 'engines',   'diesel',       'California does not allow diesel engines.'),
  -- Model exclusions
  ('exclusion', 'model',    'Coupe',      'exclude', 'engines',   'diesel',       'Coupe model does not offer diesel option.'),
  ('exclusion', 'model',    'Coupe',      'exclude', 'engines',   'hybrid',       'Coupe model does not offer hybrid option.'),
  ('exclusion', 'model',    'Sedan',      'exclude', 'engines',   'v8',           'Sedan does not support V8 engine.'),
  -- Engine → Transmission forced
  ('forced',    'engine',   'electric',   'force',   'transmissions', 'automatic', 'Electric drivetrain requires automatic transmission.'),
  -- Trim impacts
  ('inclusion', 'trim',     'Sport',      'include', 'features',  'Sport Suspension', 'Sport trim includes sport suspension.'),
  ('exclusion', 'trim',     'Base',       'exclude', 'exterior_options', 'Metallic Paint', 'Base trim does not support metallic paint.'),
  -- Interior constraint
  ('exclusion', 'trim',     'Base',       'exclude', 'interior_options', 'Red',      'Red interior not available with Base trim.'),
  -- Exterior cross-dependency
  ('exclusion', 'roof',     'panoramic',  'exclude', 'exterior_options', 'roof_rails', 'Panoramic sunroof excludes roof rails.'),
  -- Wheel constraints
  ('exclusion', 'wheel_size','21',        'exclude', 'features',  'snow_chains',   '21-inch wheels are not compatible with snow chains.'),
  ('dependency','drivetrain','non-AWD',   'exclude', 'wheels',    'Off-Road All-Terrain', 'Off-road wheels require AWD drivetrain.'),
  -- Package constraints
  ('dependency','engine',   'electric',   'exclude', 'packages',  'Tow Package',  'Electric vehicles cannot use the tow package.'),
  ('inclusion', 'package',  'Winter Package', 'include', 'features', 'Heated Front Seats', 'Winter Package auto-includes heated seats.'),
  ('inclusion', 'package',  'Winter Package', 'include', 'features', 'Heated Steering Wheel', 'Winter Package auto-includes heated steering.');

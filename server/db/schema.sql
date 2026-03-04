-- ============================================================
-- ECP Platform Database Schema
-- ============================================================

-- Models (Sedan, SUV, Coupe)
CREATE TABLE IF NOT EXISTS models (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  base_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Engines
CREATE TABLE IF NOT EXISTS engines (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(50) NOT NULL,  -- petrol, diesel, electric, hybrid, v8
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  horsepower  INTEGER,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Model-Engine compatibility (which engines are available for which models)
CREATE TABLE IF NOT EXISTS model_engines (
  id        SERIAL PRIMARY KEY,
  model_id  INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  engine_id INTEGER NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
  UNIQUE(model_id, engine_id)
);

-- Transmissions
CREATE TABLE IF NOT EXISTS transmissions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(50) NOT NULL,  -- manual, automatic
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Model-Transmission compatibility
CREATE TABLE IF NOT EXISTS model_transmissions (
  id              SERIAL PRIMARY KEY,
  model_id        INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  transmission_id INTEGER NOT NULL REFERENCES transmissions(id) ON DELETE CASCADE,
  UNIQUE(model_id, transmission_id)
);

-- Trims (Base, Sport, Luxury)
CREATE TABLE IF NOT EXISTS trims (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Model-Trim compatibility
CREATE TABLE IF NOT EXISTS model_trims (
  id        SERIAL PRIMARY KEY,
  model_id  INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  trim_id   INTEGER NOT NULL REFERENCES trims(id) ON DELETE CASCADE,
  UNIQUE(model_id, trim_id)
);

-- Exterior options
CREATE TABLE IF NOT EXISTS exterior_options (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(50) NOT NULL,  -- paint, body_kit, roof_type
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  color_hex   VARCHAR(7),            -- for paint colors
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Interior options
CREATE TABLE IF NOT EXISTS interior_options (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(50) NOT NULL,  -- seat_material, seat_color, dashboard, ambient_lighting
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  color_hex   VARCHAR(7),
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Wheels
CREATE TABLE IF NOT EXISTS wheels (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  size        INTEGER NOT NULL,       -- rim size in inches
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Packages (Technology, Winter, Safety, Tow)
CREATE TABLE IF NOT EXISTS packages (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  includes    TEXT[],                 -- list of included feature names
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Markets
CREATE TABLE IF NOT EXISTS markets (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,  -- US-California, EU-Germany, UK
  code        VARCHAR(20) NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Rules (constraint rules stored in DB)
CREATE TABLE IF NOT EXISTS rules (
  id            SERIAL PRIMARY KEY,
  rule_type     VARCHAR(50) NOT NULL,  -- exclusion, dependency, forced, inclusion
  condition_key VARCHAR(100) NOT NULL, -- e.g. "market", "model", "engine", "trim"
  condition_val VARCHAR(200) NOT NULL, -- e.g. "California", "Compact", "Electric"
  action        VARCHAR(50) NOT NULL,  -- exclude, include, force
  target_table  VARCHAR(50) NOT NULL,  -- engines, transmissions, exterior_options, etc.
  target_id     INTEGER,               -- specific option id (NULL = use target_name)
  target_name   VARCHAR(200),          -- target option name for display
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Saved Configurations
CREATE TABLE IF NOT EXISTS configurations (
  id              SERIAL PRIMARY KEY,
  session_id      VARCHAR(100),
  model_id        INTEGER REFERENCES models(id),
  engine_id       INTEGER REFERENCES engines(id),
  transmission_id INTEGER REFERENCES transmissions(id),
  trim_id         INTEGER REFERENCES trims(id),
  market_id       INTEGER REFERENCES markets(id),
  base_price      NUMERIC(12,2),
  total_price     NUMERIC(12,2),
  status          VARCHAR(20) DEFAULT 'draft',  -- draft, quoted, ordered
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Configuration selected items (options chosen)
CREATE TABLE IF NOT EXISTS configuration_items (
  id                SERIAL PRIMARY KEY,
  configuration_id  INTEGER NOT NULL REFERENCES configurations(id) ON DELETE CASCADE,
  option_type       VARCHAR(50) NOT NULL,  -- exterior, interior, wheel, package
  option_id         INTEGER NOT NULL,
  option_name       VARCHAR(200),
  price_at_selection NUMERIC(12,2) NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  configuration_id  INTEGER NOT NULL REFERENCES configurations(id),
  order_number      VARCHAR(50) NOT NULL UNIQUE,
  customer_name     VARCHAR(200),
  customer_email    VARCHAR(200),
  total_price       NUMERIC(12,2) NOT NULL,
  status            VARCHAR(20) DEFAULT 'confirmed',
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id                SERIAL PRIMARY KEY,
  configuration_id  INTEGER NOT NULL REFERENCES configurations(id),
  quote_number      VARCHAR(50) NOT NULL UNIQUE,
  customer_name     VARCHAR(200),
  customer_email    VARCHAR(200),
  total_price       NUMERIC(12,2) NOT NULL,
  valid_until       TIMESTAMP,
  status            VARCHAR(20) DEFAULT 'active',
  created_at        TIMESTAMP DEFAULT NOW()
);

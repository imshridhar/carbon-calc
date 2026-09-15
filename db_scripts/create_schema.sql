-- CarbonCalc Database Schema (PostgreSQL)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255),
    email           VARCHAR(255) UNIQUE,
    password        VARCHAR(255),
    role            VARCHAR(20) DEFAULT 'USER',
    enabled         BOOLEAN DEFAULT FALSE,
    otp             VARCHAR(10),
    otp_expiry      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lifestyle Surveys
CREATE TABLE IF NOT EXISTS lifestyle_surveys (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT UNIQUE REFERENCES users(id),
    primary_transport           VARCHAR(50),
    weekly_driving_km           NUMERIC,
    car_type                    VARCHAR(50),
    home_heating                VARCHAR(50),
    monthly_electricity_kwh     NUMERIC,
    has_renewable_energy        BOOLEAN,
    diet_type                   VARCHAR(50),
    meat_meals_per_week         INT,
    buys_local_food             BOOLEAN,
    shopping_habits             VARCHAR(100),
    buys_second_hand            BOOLEAN,
    short_flights_per_year      INT,
    long_flights_per_year       INT,
    estimated_annual_footprint  NUMERIC
);

-- Carbon Entries (logs)
CREATE TABLE IF NOT EXISTS carbon_entries (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    category    VARCHAR(50),
    activity    VARCHAR(255),
    amount      NUMERIC,
    unit        VARCHAR(50) DEFAULT 'kg CO2',
    notes       VARCHAR(500),
    date        DATE DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id),
    title             VARCHAR(255),
    description       TEXT,
    category          VARCHAR(50),
    baseline_amount   NUMERIC,
    target_amount     NUMERIC,
    current_progress  NUMERIC DEFAULT 0,
    timeframe_days    INT DEFAULT 30,
    recurrence        VARCHAR(20) DEFAULT 'WEEKLY',
    estimated_savings NUMERIC DEFAULT 0,
    deadline          DATE,
    status            VARCHAR(20) DEFAULT 'ACTIVE',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE goals ADD COLUMN IF NOT EXISTS baseline_amount NUMERIC;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS timeframe_days INT DEFAULT 30;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT 'WEEKLY';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS estimated_savings NUMERIC DEFAULT 0;

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255),
    description     TEXT,
    icon            VARCHAR(50),
    category        VARCHAR(50),
    threshold_kg    NUMERIC,
    color           VARCHAR(50),
    bg_color        VARCHAR(50),
    active          BOOLEAN DEFAULT TRUE,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
    id          BIGSERIAL PRIMARY KEY,
    team_name   VARCHAR(255),
    user_id     BIGINT REFERENCES users(id),
    score       NUMERIC,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace
CREATE TABLE IF NOT EXISTS marketplace (
    id          BIGSERIAL PRIMARY KEY,
    item_name   VARCHAR(255),
    item_type   VARCHAR(50) CHECK (item_type IN ('tree_planting', 'carbon_credit', 'renewable_energy')),
    price       NUMERIC,
    description TEXT,
    carbon_offset_value NUMERIC DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT REFERENCES users(id),
    marketplace_item_id BIGINT REFERENCES marketplace(id),
    amount              NUMERIC,
    status              VARCHAR(20) DEFAULT 'COMPLETED',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    title       VARCHAR(255),
    message     TEXT,
    type        VARCHAR(50),
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP table
CREATE TABLE IF NOT EXISTS otps (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255),
    otp         VARCHAR(10),
    expiry_time TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carbon_entries_user     ON carbon_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_entries_date     ON carbon_entries(date);
CREATE INDEX IF NOT EXISTS idx_goals_user              ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_active           ON badges(active);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user       ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user       ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_otps_email              ON otps(email);

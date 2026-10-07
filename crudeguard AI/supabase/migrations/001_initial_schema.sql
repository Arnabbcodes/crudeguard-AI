-- ========================================================
-- CrudeGuard AI - Initial Database Migration Schema
-- PostgreSQL for Supabase
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Suppliers & Crude Grades Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,
    crude_grade TEXT NOT NULL,
    api_gravity NUMERIC(4, 1) NOT NULL,
    sulfur_pct NUMERIC(4, 2) NOT NULL,
    contracted_bpd INTEGER NOT NULL,
    unit_cost_usd NUMERIC(6, 2) NOT NULL,
    origin_port TEXT NOT NULL,
    port_coordinates JSONB NOT NULL,
    transit_days_normal INTEGER NOT NULL,
    primary_route TEXT,
    chokepoints JSONB DEFAULT '[]'::jsonb,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL,
    risk_factors JSONB NOT NULL,
    reliability_history_pct NUMERIC(4, 1) DEFAULT 98.0,
    contract_type TEXT DEFAULT 'Term 12-Month',
    flexibility_rating TEXT DEFAULT 'Medium',
    alternative_substitute_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Maritime & Geopolitical Disruption Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    location TEXT NOT NULL,
    coordinates JSONB,
    affected_suppliers JSONB DEFAULT '[]'::jsonb,
    headline TEXT NOT NULL,
    estimated_flow_impact_bpd INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 90,
    ai_summary TEXT,
    recommended_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Simulation History Table
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    params JSONB NOT NULL,
    daily_deficit_bpd INTEGER NOT NULL,
    total_barrels_lost BIGINT NOT NULL,
    refinery_utilization_drop_pct NUMERIC(5, 2) NOT NULL,
    reserve_depletion_days NUMERIC(5, 2) NOT NULL,
    projected_cost_increase_usd BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Executive Intelligence Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    refinery TEXT NOT NULL,
    simulation JSONB NOT NULL,
    strategy JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for demo & analyst frontend (Idempotent)
DROP POLICY IF EXISTS "Allow public read suppliers" ON public.suppliers;
CREATE POLICY "Allow public read suppliers" ON public.suppliers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read events" ON public.events;
CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read simulations" ON public.simulations;
CREATE POLICY "Allow public read simulations" ON public.simulations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert simulations" ON public.simulations;
CREATE POLICY "Allow public insert simulations" ON public.simulations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read reports" ON public.reports;
CREATE POLICY "Allow public read reports" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert reports" ON public.reports;
CREATE POLICY "Allow public insert reports" ON public.reports FOR INSERT WITH CHECK (true);

-- ========================================================
-- Seed Data Insertion
-- ========================================================

INSERT INTO public.suppliers (
    id, name, country, region, crude_grade, api_gravity, sulfur_pct,
    contracted_bpd, unit_cost_usd, origin_port, port_coordinates,
    transit_days_normal, primary_route, chokepoints, risk_score, risk_level,
    risk_factors, reliability_history_pct, contract_type, flexibility_rating, alternative_substitute_ids
) VALUES 
(
    'sup-01', 'Saudi Aramco', 'Saudi Arabia', 'Middle East', 'Arab Light', 33.4, 1.77,
    110000, 78.40, 'Ras Tanura', '[26.6378, 50.1654]'::jsonb, 22,
    'Persian Gulf -> Strait of Hormuz -> Bab-el-Mandeb -> Suez Canal -> Rotterdam',
    '["Strait of Hormuz", "Bab-el-Mandeb", "Suez Canal"]'::jsonb,
    76, 'High',
    '{"geopolitical": 88, "maritime_chokepoint": 84, "operational": 24, "financial_sovereign": 18}'::jsonb,
    98.2, 'Term 24-Month', 'Medium', '["sup-04", "sup-05", "sup-07"]'::jsonb
),
(
    'sup-02', 'Abu Dhabi National Oil Co (ADNOC)', 'United Arab Emirates', 'Middle East', 'Murban', 40.2, 0.78,
    75000, 81.20, 'Fujairah', '[25.1288, 56.3265]'::jsonb, 20,
    'Gulf of Oman -> Bab-el-Mandeb -> Suez Canal -> Rotterdam',
    '["Bab-el-Mandeb", "Suez Canal"]'::jsonb,
    58, 'Medium',
    '{"geopolitical": 62, "maritime_chokepoint": 65, "operational": 18, "financial_sovereign": 14}'::jsonb,
    99.4, 'Term 12-Month', 'High', '["sup-06", "sup-08"]'::jsonb
),
(
    'sup-03', 'Basrah Oil Company', 'Iraq', 'Middle East', 'Basrah Medium', 29.8, 2.85,
    60000, 74.10, 'Al Basrah Oil Terminal', '[29.6806, 48.8108]'::jsonb, 24,
    'Persian Gulf -> Strait of Hormuz -> Bab-el-Mandeb -> Suez Canal -> Rotterdam',
    '["Strait of Hormuz", "Bab-el-Mandeb", "Suez Canal"]'::jsonb,
    84, 'Critical',
    '{"geopolitical": 92, "maritime_chokepoint": 86, "operational": 62, "financial_sovereign": 55}'::jsonb,
    89.1, 'Term 12-Month', 'Low', '["sup-04", "sup-07"]'::jsonb
),
(
    'sup-04', 'Equinor ASA', 'Norway', 'North Sea', 'Johan Sverdrup', 28.7, 0.81,
    50000, 80.50, 'Mongstad', '[60.8062, 5.0315]'::jsonb, 3,
    'North Sea Direct -> Rotterdam',
    '[]'::jsonb,
    15, 'Low',
    '{"geopolitical": 12, "maritime_chokepoint": 5, "operational": 14, "financial_sovereign": 8}'::jsonb,
    99.8, 'Flexible Spot + Term', 'Very High', '["sup-06", "sup-07"]'::jsonb
),
(
    'sup-05', 'Petrobras', 'Brazil', 'Latin America', 'Tupi (Lula)', 30.5, 0.38,
    40000, 82.30, 'Angra dos Reis (TEBIG)', '[-23.0189, -44.2981]'::jsonb, 16,
    'South Atlantic -> North Atlantic -> English Channel -> Rotterdam',
    '["English Channel"]'::jsonb,
    28, 'Low',
    '{"geopolitical": 25, "maritime_chokepoint": 10, "operational": 22, "financial_sovereign": 26}'::jsonb,
    96.5, 'Spot Indexed', 'High', '["sup-01", "sup-04"]'::jsonb
),
(
    'sup-06', 'BP / Shell North Sea Consortium', 'United Kingdom', 'North Sea', 'Forties Blend', 39.0, 0.65,
    30000, 83.10, 'Hound Point', '[55.9986, -3.3752]'::jsonb, 2,
    'North Sea Coastal -> Rotterdam',
    '[]'::jsonb,
    18, 'Low',
    '{"geopolitical": 14, "maritime_chokepoint": 6, "operational": 21, "financial_sovereign": 10}'::jsonb,
    98.9, 'Spot Monthly', 'High', '["sup-02", "sup-08"]'::jsonb
),
(
    'sup-07', 'Nigerian National Petroleum Corp (NNPC)', 'Nigeria', 'West Africa', 'Bonny Light', 35.3, 0.15,
    20000, 84.70, 'Bonny Island Terminal', '[4.4533, 7.1638]'::jsonb, 14,
    'Gulf of Guinea -> Atlantic Ocean -> Rotterdam',
    '["Gulf of Guinea Piracy Corridor"]'::jsonb,
    64, 'Medium',
    '{"geopolitical": 72, "maritime_chokepoint": 48, "operational": 54, "financial_sovereign": 62}'::jsonb,
    87.4, 'Term 12-Month', 'Medium', '["sup-02", "sup-08"]'::jsonb
),
(
    'sup-08', 'Enterprise Products / Chevron Permian', 'United States', 'North America', 'WTI Midland', 41.5, 0.22,
    10000, 82.90, 'Corpus Christi, Texas', '[27.8146, -97.3964]'::jsonb, 15,
    'Gulf of Mexico -> North Atlantic -> Rotterdam',
    '["Florida Straits"]'::jsonb,
    22, 'Low',
    '{"geopolitical": 18, "maritime_chokepoint": 14, "operational": 19, "financial_sovereign": 10}'::jsonb,
    98.0, 'Spot Optionality', 'Very High', '["sup-02", "sup-06"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (
    id, title, date, category, severity, status, location, coordinates, affected_suppliers, headline, estimated_flow_impact_bpd, confidence_score, ai_summary, recommended_action
) VALUES
(
    'evt-101', 'Hormuz Naval Seizure Warning & Satellite Spoofing', '2026-10-06T18:30:00Z', 'Geopolitical', 'Critical', 'Active', 'Strait of Hormuz, Persian Gulf', '[26.5667, 56.2500]'::jsonb,
    '["Saudi Aramco", "Basrah Oil Company"]'::jsonb,
    'UKMTO and Joint Maritime Information Center issue urgent advisory following GPS denial and patrol craft maneuvers near Musandam Peninsula.',
    170000, 93,
    'High likelihood of transit delays (+5 to 7 days) as underwriters demand war-risk surcharges. Tankers carrying Arab Light and Basrah Medium face potential transit rationing.',
    'Activate spot replacement from North Sea (Johan Sverdrup) and permit West Atlantic lifting from Petrobras TEBIG.'
),
(
    'evt-102', 'Red Sea / Bab-el-Mandeb Anti-Ship Drone Escalation', '2026-10-05T09:15:00Z', 'Maritime Security', 'High', 'Active', 'Southern Red Sea', '[13.2000, 43.1000]'::jsonb,
    '["Saudi Aramco", "ADNOC", "Basrah Oil Company"]'::jsonb,
    'Commercial tanker convoy reports swarm drone encounter; leading charterers divert chartered tonnage around the Cape of Good Hope.',
    115000, 96,
    'Transit time increases from 20 days to 33 days. Working inventory buffer at Rotterdam will deplete 42% faster unless prompt replacements arrive.',
    'Hedge bunker fuel differential and issue early notices for discharge window rescheduling at Rotterdam berth 7.'
)
ON CONFLICT (id) DO NOTHING;

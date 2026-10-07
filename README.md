# CrudeGuard AI 🛢️🛡️

> **AI-Powered Crude Oil Supply Risk and Sourcing Intelligence Platform**  
> *Built for energy supply/risk analysts, refinery managers, and trading operations.*

---

## 🎯 Executive Overview

**The Critical Question:**  
> *"If something goes wrong with our crude supply, how serious is the impact and what should we do?"*

**CrudeGuard AI** is an integrated full-stack intelligence platform that monitors crude oil shipping corridors, quantifies disruption shocks across critical maritime chokepoints (such as the Strait of Hormuz, Bab-el-Mandeb, and the Suez Canal), simulates refinery run cuts, and optimizes alternative sourcing options while preserving refinery crude diet constraints (API gravity and sulfur limits).

---

## 🏗️ System Architecture

```text
                                  +---------------------------------------+
                                  |         Browser (Frontend)            |
                                  |  HTML5 • CSS3 (Dark Petroleum Theme)  |
                                  |  Vanilla JS ES Modules • Chart.js     |
                                  |              Leaflet.js               |
                                  +-------------------+-------------------+
                                                      |
                          Direct Supabase JS Client   |   Protected Operations & AI Calls
                          (Database Reads / Inserts)  |   (Groq Llama-3.3-70b Inference)
                                                      v
                                        +-------------+-------------+
                                        |  Supabase Cloud Platform  |
                                        +-------------+-------------+
                                                      |
                        +-----------------------------+-----------------------------+
                        |                                                           |
                        v                                                           v
        +---------------+---------------+                           +---------------+---------------+
        |     Supabase PostgreSQL       |                           |    Supabase Edge Functions    |
        | - suppliers (crude assays)    |                           | - analyze-event               |
        | - events (threat advisories)  |                           | - generate-explanation        |
        | - simulations & audit trails  |                           | - calculate-risk              |
        | - reports (dossier archive)   |                           | - optimize-sourcing           |
        | - Row Level Security (RLS)    |                           +---------------+---------------+
        +-------------------------------+                                           |
                                                                                    v
                                                                    +---------------+---------------+
                                                                    |           Groq API            |
                                                                    |     llama-3.3-70b-versatile   |
                                                                    +-------------------------------+
```

---

## 🧭 Product Hierarchy & Workflow

```text
Monitor  ──>  Simulate  ──>  Optimize  ──>  Explain (Groq AI)  ──>  Report
```

1. **Monitor (`dashboard.html`, `suppliers.html`, `events.html`):**
   - Real-time tracking of contracted crude flows into the destination refinery (e.g. Rotterdam Gateway Energy Complex, 420,000 bpd capacity).
   - Interactive Leaflet map visualizing export terminals, tanker routes, and naval danger zones across strategic chokepoints.
   - Live multi-factor risk radar chart assessing geopolitical, maritime bottleneck, operational, and sovereign risk.
2. **Simulate (`simulator.html`):**
   - Stress-test supply disruptions by counterparty or preset scenarios (e.g., *Strait of Hormuz 50% Transit Curtailment*, *Bab-el-Mandeb Divert*, *West Africa Force Majeure*).
   - Interactive sliders for curtailment percentage, outage duration, freight surcharges, and crude price shocks.
   - Instant calculation of daily barrel deficits, refinery CDU run cuts, inventory depletion trajectories, and cost spikes.
3. **Optimize (`optimization.html`):**
   - Solves for optimal alternative nominations balancing landed cost, lead time, and refinery diet specifications.
   - Evaluates three strategic stances: **Cost-Minimized**, **Risk-Minimized**, and **Balanced Resilience (AI Recommended)**.
4. **Explain (`optimization.html`, `events.html`):**
   - Sub-second executive intelligence generation powered by **Groq Llama-3.3-70b**.
   - Translates complex simulation outputs into clear 72-hour operational directives on chartering, hedging, and tankage.
5. **Report (`reports.html`):**
   - Executive intelligence dossier ready for print / PDF export, JSON backup, and Supabase cloud archiving.

---

## 📂 Project Structure

```text
crude-guard-ai/
│
├── index.html                  # Landing page & architecture walkthrough
├── dashboard.html              # Executive risk command center & Leaflet map
├── suppliers.html              # Global crude suppliers directory & filter matrix
├── supplier-details.html       # Deep supplier risk profile & substitute grades
├── events.html                 # Geopolitical feed & Groq AI event analyzer
├── simulator.html              # Disruption shock builder & impact calculator
├── optimization.html           # Sourcing optimizer & Groq AI strategy brief
├── reports.html                # Executive dossier generator & PDF export
│
├── css/
│   ├── global.css              # Obsidian petroleum theme, glassmorphism, UI tokens
│   ├── dashboard.css           # KPI cards, map layout, alert items, radar chart
│   ├── suppliers.css           # Directory grid, filter bar, spec sheets
│   ├── simulator.css           # Sliders, impact cards, strategy presets
│   └── responsive.css          # Mobile and tablet responsiveness
│
├── js/
│   ├── config.js               # Centralized configuration & environment loader
│   ├── supabase.js             # Supabase JS client factory & connection tester
│   ├── api.js                  # Centralized API service layer
│   ├── dashboard.js            # Dashboard controller & KPIs
│   ├── suppliers.js            # Suppliers directory filter & search
│   ├── supplier-details.js     # Single supplier deep-dive & specs
│   ├── events.js               # Disruption feed & AI analyzer
│   ├── simulator.js            # Scenario simulation math & charts
│   ├── optimization.js         # Sourcing optimization & Groq briefing
│   ├── reports.js              # Print/PDF dossier controller & archiving
│   ├── charts.js               # Chart.js radar, bar, and depletion line charts
│   ├── map.js                  # Leaflet.js interactive dark-mode maritime map
│   └── utils.js                # Formatting, badges, toasts, modal helpers
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database tables, RLS policies, seed data
│   └── functions/
│       ├── analyze-event/          # Edge Function: Event impact analysis (Groq)
│       ├── generate-explanation/   # Edge Function: Executive briefings (Groq)
│       ├── calculate-risk/         # Edge Function: Multi-factor risk engine
│       └── optimize-sourcing/      # Edge Function: Multi-criteria optimization
│
├── data/
│   └── demo-data.json          # High-fidelity crude market & logistics demo data
│
├── .env.example                # Sample environment variables
├── .gitignore                  # Git ignore rules
└── README.md                   # Complete documentation
```

---

## ⚡ Quickstart & Local Development

No Node.js backend build step is strictly required to run the frontend because the application uses standard browser ES Modules.

### 1. Serve Locally
You can run any local static HTTP server (e.g., Python's built-in HTTP server or VS Code Live Server):

```bash
# Using Python 3
python -m http.server 8000

# Or using npx
npx serve -l 8000 .
```

Then open your browser at:
```text
http://localhost:8000
```

*Note: The application includes a self-contained high-fidelity fallback mode (`data/demo-data.json`). If Supabase credentials are not supplied, all features, maps, charts, scenario simulations, and heuristic optimization logic work seamlessly out-of-the-box.*

---

## 🗄️ Supabase Configuration

### Step 1: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **Anon Public Key** under `Project Settings -> API`.

### Step 2: Apply Database Migrations
1. In the Supabase Dashboard, navigate to the **SQL Editor**.
2. Open the file [`supabase/migrations/001_initial_schema.sql`](file:///supabase/migrations/001_initial_schema.sql).
3. Paste the contents into the SQL Editor and click **Run**.
   - This creates tables: `suppliers`, `events`, `simulations`, `reports`.
   - Enables Row Level Security (RLS) with permissive read/insert policies.
   - Seeds all 8 global crude counterparties and current maritime disruption alerts.

### Step 3: Configure Frontend Credentials
Create a `.env` file or set window credentials in [`js/config.js`](file:///js/config.js):

```javascript
// js/config.js
export const APP_CONFIG = {
  supabase: {
    url: 'https://your-project-ref.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    functionsUrl: 'https://your-project-ref.supabase.co/functions/v1'
  },
  // ...
};
```

---

## ⚡ Groq API & Supabase Edge Functions

### Step 1: Obtain a Groq API Key
1. Sign up at [console.groq.com](https://console.groq.com).
2. Generate an API Key (starts with `gsk_...`).
3. Model used: `llama-3.3-70b-versatile`.

### Step 2: Set Secrets in Supabase
Set the secret in Supabase so Edge Functions can access it securely:

```bash
supabase secrets set GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Step 3: Deploy Supabase Edge Functions
Using the Supabase CLI:

```bash
# Login to Supabase CLI
supabase login

# Link your remote project
supabase link --project-ref your-project-ref

# Deploy the 4 Edge Functions
supabase functions deploy analyze-event --no-verify-jwt
supabase functions deploy generate-explanation --no-verify-jwt
supabase functions deploy calculate-risk --no-verify-jwt
supabase functions deploy optimize-sourcing --no-verify-jwt
```

*(Client-Side Fallback: If you are presenting at a hackathon without deployed Edge Functions, you can paste your `GROQ_API_KEY` into `APP_CONFIG.groq.apiKey` in `js/config.js`, and the frontend client will invoke the Groq API directly).*

---

## 🚀 Production Deployment

### Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)
Because CrudeGuard AI consists of pure static HTML5, CSS3, and modern JavaScript ES modules:

1. Connect your repository to **Vercel**, **Netlify**, or **Cloudflare Pages**.
2. **Build Command:** *(leave empty)*
3. **Publish Directory:** `./`
4. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_FUNCTIONS_URL`

---

## 🛡️ License & Acknowledgements

Developed for hackathon energy security and refinery optimization challenges.  
Powered by **Supabase PostgreSQL**, **Groq LPU Inference**, **Chart.js**, and **Leaflet.js**.

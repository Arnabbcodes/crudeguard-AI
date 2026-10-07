/**
 * CrudeGuard AI - Centralized Runtime Configuration
 * Supports environment variables, localStorage overrides, and runtime fallbacks.
 */

function getEnv(key) {
  if (typeof window === 'undefined') return '';
  return window.ENV?.[key] || localStorage.getItem(key) || '';
}

export const APP_CONFIG = {
  appName: 'CrudeGuard AI',
  version: '1.0.0',
  
  // Supabase Configuration
  supabase: {
    url: getEnv('VITE_SUPABASE_URL') || 'https://xyzcompany.supabase.co',
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_demo',
    functionsUrl: getEnv('SUPABASE_FUNCTIONS_URL') || 'https://xyzcompany.supabase.co/functions/v1'
  },

  // Groq API Configuration
  groq: {
    apiKey: getEnv('GROQ_API_KEY'),
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },

  // Default Refinery Specifications (Rotterdam EuroPort)
  refinery: {
    id: 'ref-01',
    name: 'Rotterdam Gateway Energy Complex',
    location: 'Rotterdam, Netherlands',
    coordinates: [51.9244, 4.4777],
    nameplateCapacityBpd: 420000,
    dailyIntakeTargetBpd: 395000,
    currentUtilizationPct: 94.2,
    strategicReserveDays: 18,
    diet: {
      minApi: 30.5,
      maxApi: 39.5,
      maxSulfurPct: 1.85,
      sweetMinPct: 45
    }
  },

  // Local demo data path
  demoDataPath: './data/demo-data.json'
};

// Check if live Supabase credentials are configured
export function isSupabaseConfigured() {
  const url = APP_CONFIG.supabase.url || '';
  const key = APP_CONFIG.supabase.anonKey || '';
  return Boolean(url && !url.includes('xyzcompany') && key && !key.includes('dummy'));
}

// Check if Groq API is configured
export function isGroqConfigured() {
  return Boolean(APP_CONFIG.groq.apiKey && APP_CONFIG.groq.apiKey.startsWith('gsk_'));
}

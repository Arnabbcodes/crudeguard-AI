/**
 * CrudeGuard AI - Supabase Client Initializer
 * Uses official @supabase/supabase-js ES Module
 */

import { APP_CONFIG, isSupabaseConfigured } from './config.js';

let supabaseClient = null;
let connectionStatus = {
  connected: false,
  mode: 'demo', // 'demo' | 'live'
  message: 'Running in high-fidelity demo mode with local logistics data.'
};

/**
 * Initialize or get Supabase Client
 */
export async function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!isSupabaseConfigured()) {
    console.info('[CrudeGuard AI] Supabase credentials not set or using defaults. Using local demo datasets.');
    connectionStatus = {
      connected: false,
      mode: 'demo',
      message: 'Running in demo mode. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to live Supabase.'
    };
    return null;
  }

  try {
    // Dynamic import of Supabase JS ESM
    let createClient;
    if (window.supabase?.createClient) {
      createClient = window.supabase.createClient;
    } else {
      const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      createClient = module.createClient;
    }

    supabaseClient = createClient(APP_CONFIG.supabase.url, APP_CONFIG.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });

    // Test connectivity
    const { error } = await supabaseClient.from('suppliers').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('[CrudeGuard AI] Supabase query check failed:', error.message);
      connectionStatus = {
        connected: false,
        mode: 'demo',
        message: `Supabase reachable but query failed (${error.message}). Reverting to demo mode.`
      };
    } else {
      connectionStatus = {
        connected: true,
        mode: 'live',
        message: 'Connected to live Supabase PostgreSQL database.'
      };
      console.log('[CrudeGuard AI] Connected to live Supabase instance.');
    }
  } catch (err) {
    console.warn('[CrudeGuard AI] Could not initialize live Supabase client:', err.message);
    connectionStatus = {
      connected: false,
      mode: 'demo',
      message: 'Network or CDN issue initializing Supabase client. Running in demo mode.'
    };
  }

  return supabaseClient;
}

/**
 * Return current connection status
 */
export function getDbStatus() {
  return connectionStatus;
}

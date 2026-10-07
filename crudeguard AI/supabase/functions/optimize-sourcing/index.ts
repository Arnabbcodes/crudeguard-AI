// Supabase Edge Function: optimize-sourcing
// Evaluates alternate supply routes, API/Sulfur compatibility, and freight spreads

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { simulationResult, strategyPreference = "balanced" } = await req.json();

    const deficitBpd = simulationResult?.dailyDeficitBpd || 60000;

    // Available candidate pools with current spot pricing & transit days
    const candidates = [
      { id: "sup-04", name: "Equinor (Johan Sverdrup)", api: 28.7, sulfur: 0.81, cost: 80.50, transit: 3, risk: 15, maxAvail: 50000 },
      { id: "sup-05", name: "Petrobras (Tupi)", api: 30.5, sulfur: 0.38, cost: 82.30, transit: 16, risk: 28, maxAvail: 35000 },
      { id: "sup-06", name: "BP / Shell (Forties Blend)", api: 39.0, sulfur: 0.65, cost: 83.10, transit: 2, risk: 18, maxAvail: 30000 },
      { id: "sup-08", name: "Enterprise (WTI Midland)", api: 41.5, sulfur: 0.22, cost: 82.90, transit: 15, risk: 22, maxAvail: 25000 }
    ];

    // Score based on strategy
    candidates.forEach(c => {
      if (strategyPreference === "cost") {
        c.rank = c.cost;
      } else if (strategyPreference === "risk") {
        c.rank = c.risk;
      } else {
        // Balanced Pareto
        c.rank = (c.cost * 0.4) + (c.risk * 0.6);
      }
    });

    candidates.sort((a, b) => a.rank - b.rank);

    let remainingDeficit = deficitBpd;
    const reallocations = [];
    let totalIncrementalCost = 0;
    let weightedRisk = 0;
    let weightedApi = 0;
    let weightedSulfur = 0;
    let totalCovered = 0;

    for (const c of candidates) {
      if (remainingDeficit <= 0) break;
      const alloc = Math.min(remainingDeficit, c.maxAvail);
      const costTotal = alloc * c.cost;

      reallocations.push({
        supplier_id: c.id,
        name: c.name,
        incremental_bpd: alloc,
        unit_cost_usd: c.cost,
        additional_cost_usd: costTotal,
        transit_days: c.transit,
        risk_score: c.risk
      });

      remainingDeficit -= alloc;
      totalCovered += alloc;
      totalIncrementalCost += costTotal;
      weightedRisk += (c.risk * alloc);
      weightedApi += (c.api * alloc);
      weightedSulfur += (c.sulfur * alloc);
    }

    const plan = {
      strategy_name: strategyPreference === "cost" ? "Cost-Minimized Allocation" :
                     strategyPreference === "risk" ? "Risk-Minimized Allocation" : "Balanced Resilience (AI Recommended)",
      strategy_type: strategyPreference,
      deficit_bpd: deficitBpd,
      covered_bpd: totalCovered,
      coverage_pct: Math.min(100, Math.round((totalCovered / (deficitBpd || 1)) * 100)),
      reallocations,
      metrics: {
        total_additional_daily_cost: totalIncrementalCost,
        weighted_avg_landed_cost: Number((totalIncrementalCost / (totalCovered || 1)).toFixed(2)),
        blended_api: Number((weightedApi / (totalCovered || 1)).toFixed(1)),
        blended_sulfur_pct: Number((weightedSulfur / (totalCovered || 1)).toFixed(2)),
        composite_residual_risk: Math.round(weightedRisk / (totalCovered || 1)),
        execution_lead_time_days: Math.max(...reallocations.map(r => r.transit_days), 3)
      }
    };

    return new Response(
      JSON.stringify({ optimizedPlan: plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

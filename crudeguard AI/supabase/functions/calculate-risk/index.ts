// Supabase Edge Function: calculate-risk
// Computes multi-factor composite risk indices for crude suppliers and routes

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
    const { supplier, activeEvents = [] } = await req.json();

    const factors = supplier.risk_factors || {
      geopolitical: 30,
      maritime_chokepoint: 20,
      operational: 20,
      financial_sovereign: 15
    };

    // Calculate dynamic boost if supplier transits active chokepoints with events
    let chokepointBoost = 0;
    if (supplier.chokepoints && supplier.chokepoints.includes("Strait of Hormuz")) {
      chokepointBoost += 15;
    }
    if (supplier.chokepoints && supplier.chokepoints.includes("Bab-el-Mandeb")) {
      chokepointBoost += 10;
    }

    const compositeScore = Math.min(
      100,
      Math.round(
        (factors.geopolitical * 0.35) +
        ((factors.maritime_chokepoint + chokepointBoost) * 0.35) +
        (factors.operational * 0.15) +
        (factors.financial_sovereign * 0.15)
      )
    );

    let riskLevel = "Low";
    if (compositeScore >= 75) riskLevel = "Critical";
    else if (compositeScore >= 50) riskLevel = "High";
    else if (compositeScore >= 30) riskLevel = "Medium";

    return new Response(
      JSON.stringify({
        supplier_id: supplier.id,
        composite_risk_score: compositeScore,
        risk_level: riskLevel,
        breakdown: factors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

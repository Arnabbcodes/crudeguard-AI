// Supabase Edge Function: generate-explanation
// Deno TypeScript runtime
// Calls Groq API to synthesize executive intelligence briefings

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
    const { context } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          explanation: `### Executive Supply Risk Assessment
The active disruption exposes our refinery complex to an unmitigated supply deficit. Working inventories will deplete rapidly unless immediate rerouting takes place.

### Optimization Strategy & Diet Feasibility
The recommended allocation shifts procurement to North Sea and South Atlantic basins, preserving vacuum distillation unit metallurgy tolerances with compliant API and sulfur metrics.

### 72-Hour Operational Directives
1. Exercise prompt lifting options on European short-haul shuttle tankers.
2. Hedge prompt Brent-Dubai crack spreads.
3. Conserve 4 days of sweet crude tankage to buffer discharge window delays.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are the Chief Risk Officer for CrudeGuard AI.
Provide an executive intelligence briefing based on this simulation and optimization scenario:
${JSON.stringify(context, null, 2)}

Provide a sharp, authoritative 3-paragraph executive briefing covering:
### Executive Supply Risk Assessment
(Explain deficit, reserve depletion, and refinery run cut threat)

### Optimization Strategy & Diet Feasibility
(Explain why the chosen crude grades protect refinery metallurgy, API, and sulfur specifications while minimizing chokepoint exposure)

### 72-Hour Operational Directives
(3 bullet points on chartering, hedging, and tankage operations)`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      throw new Error(`Groq API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const explanation = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

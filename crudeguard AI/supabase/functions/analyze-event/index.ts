// Supabase Edge Function: analyze-event
// Deno TypeScript runtime
// Calls Groq API to analyze crude supply disruption alerts

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
    const { eventInput } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GROQ_API_KEY is not configured in Supabase Edge Secrets.",
          analysis: {
            severity: "Critical",
            estimated_flow_impact_bpd: 125000,
            confidence_score: 92,
            ai_summary: "Fallback Analysis: Strategic bottleneck closure detected. Immediate supply reallocation advised.",
            affected_chokepoints: ["Strait of Hormuz"],
            recommended_action: "Activate spot replacement from North Sea (Johan Sverdrup) and permit West Atlantic lifting."
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are CrudeGuard AI, an energy risk analyst for a crude oil refinery.
Analyze this supply disruption event:
"${typeof eventInput === 'string' ? eventInput : JSON.stringify(eventInput)}"

Respond ONLY in valid raw JSON with this exact schema (no markdown formatting, no code fences):
{
  "severity": "Critical" | "High" | "Medium" | "Low",
  "estimated_flow_impact_bpd": number,
  "confidence_score": number,
  "ai_summary": "operational risk description string",
  "affected_chokepoints": ["string"],
  "recommended_action": "actionable hedging and rerouting directives string"
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    if (!res.ok) {
      throw new Error(`Groq API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content.trim();
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(
      JSON.stringify({ analysis: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

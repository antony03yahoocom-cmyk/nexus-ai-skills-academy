import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Paystack not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const email = claimsData.claims.email;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "initialize") {
      const { amount, callback_url, plan } = await req.json();

      // Amount should be in KES (Paystack uses the smallest unit — cents for KES)
      // KES 1,000 = 100000, KES 2,500 = 250000, KES 5,000 = 500000
      const finalAmount = amount || 100000;

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: finalAmount,
          currency: "KES",
          callback_url: callback_url || `${req.headers.get("origin")}/subscribe?verify=true`,
          channels: ["mobile_money"],
          metadata: {
            user_id: userId,
            plan: plan || "basic",
            custom_fields: [
              {
                display_name: "Plan",
                variable_name: "plan",
                value: plan || "basic",
              },
            ],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Paystack init error:", JSON.stringify(data));
        throw new Error(`Paystack initialization failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const { reference } = await req.json();

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Paystack verify error:", JSON.stringify(data));
        throw new Error(`Paystack verification failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      if (data.data?.status === "success") {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const plan = data.data?.metadata?.plan || "basic";

        const { error: updateError } = await adminClient
          .from("profiles")
          .update({ subscription_status: "paid" })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Failed to update subscription:", updateError);
          throw new Error("Payment verified but failed to update subscription");
        }

        return new Response(JSON.stringify({ success: true, status: "paid", plan }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: false, status: data.data?.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Paystack error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

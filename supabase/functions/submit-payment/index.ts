import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SubmitPaymentRequest {
  mess_id: string;
  plan_type: "monthly" | "yearly";
  payment_method: string;
  bkash_number: string;
  transaction_id: string;
  amount: number;
  coupon_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: SubmitPaymentRequest = await req.json();
    const { mess_id, plan_type, payment_method, bkash_number, transaction_id, amount, coupon_code } = body;

    // Validate required fields
    if (!mess_id || !plan_type || !payment_method || !bkash_number || !transaction_id || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is the manager of this mess
    const { data: messData, error: messError } = await supabaseAdmin
      .from("messes")
      .select("id, manager_id")
      .eq("id", mess_id)
      .single();

    if (messError || !messData) {
      return new Response(
        JSON.stringify({ error: "Mess not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messData.manager_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You are not the manager of this mess" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate transaction ID
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("transaction_id", transaction_id)
      .single();

    if (existingPayment) {
      return new Response(
        JSON.stringify({ error: "This transaction ID has already been submitted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert payment record with pending status
    const { data: payment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        mess_id,
        plan_type,
        payment_method,
        bkash_number,
        transaction_id,
        amount,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to submit payment");
    }

    // If coupon was used, increment used_count
    if (coupon_code) {
      const { data: couponData } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("code", coupon_code)
        .single();
      
      if (couponData) {
        await supabaseAdmin
          .from("coupons")
          .update({ used_count: (couponData.used_count || 0) + 1 })
          .eq("code", coupon_code);
      }
    }

    console.log(`Payment submitted for mess ${mess_id}: ${amount} BDT, TrxID: ${transaction_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment submitted for review",
        payment_id: payment.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error submitting payment:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

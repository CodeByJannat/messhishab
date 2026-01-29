import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { payment_id, action, reject_reason } = await req.json();

    if (!payment_id || !action) {
      throw new Error("Missing payment_id or action");
    }

    if (action === "reject" && !reject_reason) {
      throw new Error("Reject reason is required");
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, mess:messes(id, manager_id)")
      .eq("id", payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending") {
      throw new Error("Payment has already been processed");
    }

    if (action === "approve") {
      // Check if subscription exists and is still active
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, status, end_date")
        .eq("mess_id", payment.mess_id)
        .single();

      // Calculate dates based on existing subscription
      const now = new Date();
      let startDate = now;
      let endDate: Date;

      // FIXED: Extend from current end_date if subscription is still active
      if (existingSub && existingSub.status === 'active') {
        const currentEndDate = new Date(existingSub.end_date);
        
        // If current subscription hasn't expired, extend from that date
        if (currentEndDate > now) {
          startDate = currentEndDate;
          endDate = new Date(currentEndDate);
        } else {
          endDate = new Date(now);
        }
      } else {
        endDate = new Date(now);
      }

      // Add the plan duration
      if (payment.plan_type === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", payment_id);

      if (updatePaymentError) throw updatePaymentError;

      if (existingSub) {
        // Update existing subscription with extended dates
        const { error: subError } = await supabase
          .from("subscriptions")
          .update({
            type: payment.plan_type,
            status: "active",
            start_date: now.toISOString(), // New payment starts now
            end_date: endDate.toISOString(),
            coupon_code: payment.coupon_code || null,
          })
          .eq("id", existingSub.id);

        if (subError) throw subError;
      } else {
        // Create new subscription
        const { error: subError } = await supabase
          .from("subscriptions")
          .insert({
            mess_id: payment.mess_id,
            type: payment.plan_type,
            status: "active",
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            coupon_code: payment.coupon_code || null,
          });

        if (subError) throw subError;
      }

      // Update mess status to active
      const { error: messError } = await supabase
        .from("messes")
        .update({ status: "active" })
        .eq("id", payment.mess_id);

      if (messError) throw messError;

      // Create notification for manager
      await supabase
        .from("notifications")
        .insert({
          mess_id: payment.mess_id,
          message: `Your payment of ৳${payment.amount} has been approved. Your ${payment.plan_type} subscription is now active!`,
          from_user_id: user.id,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Payment approved and subscription activated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "reject") {
      // Update payment status with rejection reason
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "rejected",
          reject_reason: reject_reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", payment_id);

      if (updateError) throw updateError;

      // Create notification for manager
      await supabase
        .from("notifications")
        .insert({
          mess_id: payment.mess_id,
          message: `Your payment of ৳${payment.amount} has been rejected. Reason: ${reject_reason}`,
          from_user_id: user.id,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Payment rejected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error("Invalid action. Use 'approve' or 'reject'");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

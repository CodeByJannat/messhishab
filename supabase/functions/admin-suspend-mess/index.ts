import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { mess_id, action, reason } = await req.json();

    if (!mess_id || !action) {
      throw new Error("Missing mess_id or action");
    }

    if (action === "suspend" && !reason) {
      throw new Error("Suspension reason is required");
    }

    // Get mess details
    const { data: mess, error: messError } = await supabase
      .from("messes")
      .select("*, profiles:manager_id(email)")
      .eq("id", mess_id)
      .single();

    if (messError || !mess) {
      throw new Error("Mess not found");
    }

    if (action === "suspend") {
      // Suspend the mess
      const { error: updateError } = await supabase
        .from("messes")
        .update({
          status: "suspended",
          suspend_reason: reason,
        })
        .eq("id", mess_id);

      if (updateError) throw updateError;

      // Create notification for manager
      await supabase
        .from("notifications")
        .insert({
          mess_id: mess_id,
          message: `Your mess has been suspended by admin. Reason: ${reason}. Please contact support for more information.`,
          from_user_id: user.id,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Mess suspended successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "unsuspend") {
      // Determine new status based on subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, end_date")
        .eq("mess_id", mess_id)
        .single();

      let newStatus = "inactive";
      if (subscription?.status === "active" && new Date(subscription.end_date) > new Date()) {
        newStatus = "active";
      }

      // Unsuspend the mess
      const { error: updateError } = await supabase
        .from("messes")
        .update({
          status: newStatus,
          suspend_reason: null,
        })
        .eq("id", mess_id);

      if (updateError) throw updateError;

      // Create notification for manager
      await supabase
        .from("notifications")
        .insert({
          mess_id: mess_id,
          message: `Your mess has been unsuspended. You can now access your dashboard again.`,
          from_user_id: user.id,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Mess unsuspended successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error("Invalid action. Use 'suspend' or 'unsuspend'");
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

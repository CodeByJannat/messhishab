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
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using the has_role function
    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { mess_id, action, reason } = await req.json();

    if (!mess_id || !action) {
      return new Response(
        JSON.stringify({ error: "Missing mess_id or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "suspend" && !reason) {
      return new Response(
        JSON.stringify({ error: "Suspension reason is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get mess details
    const { data: mess, error: messError } = await supabase
      .from("messes")
      .select("*")
      .eq("id", mess_id)
      .single();

    if (messError || !mess) {
      return new Response(
        JSON.stringify({ error: "Mess not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create notification for manager
      await supabase
        .from("notifications")
        .insert({
          mess_id: mess_id,
          message: `Your mess has been suspended by admin. Reason: ${reason}. Please contact support for more information.`,
          from_user_id: user.id,
          to_all: true,
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

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create notification for manager
      await supabase
        .from("notifications")
        .insert({
          mess_id: mess_id,
          message: `Your mess has been unsuspended. You can now access your dashboard again.`,
          from_user_id: user.id,
          to_all: true,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Mess unsuspended successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'suspend' or 'unsuspend'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

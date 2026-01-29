import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ActivateSubscriptionRequest {
  mess_id: string;
  plan_type: 'monthly' | 'yearly';
  payment_verified: boolean;
  payment_method: 'bkash' | 'manual-bkash' | 'sslcommerz';
  transaction_id?: string;
  coupon_code?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for subscription operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ActivateSubscriptionRequest = await req.json();
    const { mess_id, plan_type, payment_verified, payment_method, transaction_id, coupon_code } = body;

    // CRITICAL: Only proceed if payment is verified
    if (!payment_verified) {
      return new Response(
        JSON.stringify({ error: 'Payment must be verified before activating subscription' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!mess_id || !plan_type || !payment_method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mess_id, plan_type, payment_method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the manager of this mess
    const { data: messData, error: messError } = await supabaseAdmin
      .from('messes')
      .select('id, manager_id')
      .eq('id', mess_id)
      .single();

    if (messError || !messData) {
      return new Response(
        JSON.stringify({ error: 'Mess not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messData.manager_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not the manager of this mess' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    if (plan_type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Check if subscription already exists
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, end_date')
      .eq('mess_id', mess_id)
      .single();

    let subscriptionResult;

    if (existingSub) {
      // Update existing subscription
      // If extending, add time from current end date (if not expired) or from now
      const currentEndDate = new Date(existingSub.end_date);
      const startFromDate = currentEndDate > now ? currentEndDate : now;
      const newEndDate = new Date(startFromDate);
      
      if (plan_type === 'yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          type: plan_type,
          status: 'active',
          start_date: now.toISOString(),
          end_date: newEndDate.toISOString(),
          coupon_code: coupon_code || null,
          updated_at: now.toISOString(),
        })
        .eq('id', existingSub.id)
        .select()
        .single();

      if (error) throw error;
      subscriptionResult = data;
    } else {
      // Create new subscription
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          mess_id,
          type: plan_type,
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          coupon_code: coupon_code || null,
        })
        .select()
        .single();

      if (error) throw error;
      subscriptionResult = data;
    }

    console.log(`Subscription activated for mess ${mess_id}: ${plan_type} plan, ends ${subscriptionResult.end_date}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription activated successfully',
        subscription: subscriptionResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error activating subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to activate subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

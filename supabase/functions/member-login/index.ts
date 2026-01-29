import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mess_id, mess_password } = await req.json();

    if (!mess_id || !mess_password) {
      return new Response(
        JSON.stringify({ error: 'MessID and MessPassword are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the mess by mess_id
    const { data: mess, error: messError } = await supabase
      .from('messes')
      .select('id, mess_id, mess_password, name, current_month, manager_id')
      .eq('mess_id', mess_id.toUpperCase())
      .single();

    if (messError || !mess) {
      return new Response(
        JSON.stringify({ error: 'Invalid MessID or MessPassword' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    if (mess.mess_password !== mess_password) {
      return new Response(
        JSON.stringify({ error: 'Invalid MessID or MessPassword' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('mess_id', mess.id)
      .single();

    if (!subscription || subscription.status !== 'active' || new Date(subscription.end_date) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Subscription expired. Contact your manager.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active members of this mess
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, is_active')
      .eq('mess_id', mess.id)
      .eq('is_active', true);

    if (membersError) throw membersError;

    // Return mess info and members list for selection
    return new Response(
      JSON.stringify({
        success: true,
        mess: {
          id: mess.id,
          mess_id: mess.mess_id,
          name: mess.name,
          current_month: mess.current_month,
        },
        members: members || [],
        subscription: {
          type: subscription.type,
          status: subscription.status,
          end_date: subscription.end_date,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

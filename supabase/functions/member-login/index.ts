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
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find member by email (case-insensitive) using plain text email field
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, email, phone, room_number, password, mess_id, is_active')
      .ilike('email', normalizedEmail)
      .eq('is_active', true)
      .single();

    if (memberError || !member) {
      console.error('Member lookup error:', memberError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password (plain text comparison)
    if (member.password !== password) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get mess info
    const { data: mess, error: messError } = await supabase
      .from('messes')
      .select('id, mess_id, name, current_month, status, suspend_reason')
      .eq('id', member.mess_id)
      .single();

    if (messError || !mess) {
      return new Response(
        JSON.stringify({ error: 'Mess not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if mess is suspended
    if (mess.status === 'suspended') {
      return new Response(
        JSON.stringify({ 
          error: 'This mess has been suspended. Contact admin.',
          suspend_reason: mess.suspend_reason
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Generate a simple session token
    const sessionToken = crypto.randomUUID();

    // Return session info
    return new Response(
      JSON.stringify({
        success: true,
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          roomNumber: member.room_number,
        },
        mess: {
          id: mess.id,
          mess_id: mess.mess_id,
          name: mess.name,
          current_month: mess.current_month,
        },
        subscription: {
          type: subscription.type,
          status: subscription.status,
          end_date: subscription.end_date,
        },
        session_token: sessionToken,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

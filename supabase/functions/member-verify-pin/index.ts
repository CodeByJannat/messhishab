import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { member_id, pin } = await req.json();

    if (!member_id || !pin) {
      return new Response(
        JSON.stringify({ error: 'Member ID and PIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, pin_hash, mess_id, is_active')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!member.is_active) {
      return new Response(
        JSON.stringify({ error: 'Member is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify PIN
    const hashedPin = await hashPin(pin);
    const success = hashedPin === member.pin_hash;

    // Log the access attempt
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await supabase
      .from('pin_access_logs')
      .insert({
        member_id: member.id,
        success: success,
        ip_address: clientIP,
      });

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Invalid PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get mess details
    const { data: mess } = await supabase
      .from('messes')
      .select('id, mess_id, name, current_month')
      .eq('id', member.mess_id)
      .single();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('mess_id', member.mess_id)
      .single();

    // Generate a session token (simple implementation for member access)
    const sessionToken = crypto.randomUUID();

    return new Response(
      JSON.stringify({
        success: true,
        member: {
          id: member.id,
          name: member.name,
        },
        mess: mess,
        subscription: subscription,
        session_token: sessionToken,
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

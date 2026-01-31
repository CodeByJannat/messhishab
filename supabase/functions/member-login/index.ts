import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple hash function for PIN verification (same as member-verify-pin)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple decryption for member data
function decryptData(encryptedData: string | null): string | null {
  if (!encryptedData) return null;
  try {
    const decoded = atob(encryptedData);
    return decoded;
  } catch {
    return encryptedData;
  }
}

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

    // Hash the provided password
    const passwordHash = await hashPin(password);

    // Find member by email and password
    // First, get all active members and check email
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email_encrypted, pin_hash, mess_id, is_active')
      .eq('is_active', true);

    if (membersError) throw membersError;

    // Find member with matching email
    const member = members?.find(m => {
      const decryptedEmail = decryptData(m.email_encrypted);
      return decryptedEmail?.toLowerCase() === email.toLowerCase();
    });

    if (!member) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password (stored as pin_hash)
    if (member.pin_hash !== passwordHash) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if member is active
    if (!member.is_active) {
      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Contact your manager.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

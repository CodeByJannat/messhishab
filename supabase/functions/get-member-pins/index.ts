import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user using getUser
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    const { messId } = await req.json();

    // Verify user is manager of this mess
    const { data: mess, error: messError } = await supabaseAdmin
      .from('messes')
      .select('id')
      .eq('id', messId)
      .eq('manager_id', userId)
      .single();

    if (messError || !mess) {
      return new Response(
        JSON.stringify({ error: 'Not authorized for this mess' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all members with their PINs (we'll show placeholder for security)
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id, name, pin_hash, is_active, created_at')
      .eq('mess_id', messId)
      .order('name');

    if (membersError) {
      return new Response(
        JSON.stringify({ error: membersError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For PIN display, we show a masked version
    const membersWithPins = (members || []).map(member => ({
      id: member.id,
      name: member.name,
      pin_display: '••••', // PIN is hashed, so we can't show it
      is_active: member.is_active,
      created_at: member.created_at,
    }));

    return new Response(
      JSON.stringify({ members: membersWithPins }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

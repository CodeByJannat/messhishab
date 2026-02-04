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
    const { member_id, mess_id, session_token } = await req.json();

    if (!member_id || !mess_id || !session_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify session token format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify member exists and is active
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, mess_id, is_active')
      .eq('id', member_id)
      .eq('mess_id', mess_id)
      .single();

    if (memberError || !member || !member.is_active) {
      return new Response(
        JSON.stringify({ error: 'Member not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get direct messages for this member
    const { data: directMessages, error: dmError } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('mess_id', mess_id)
      .eq('member_id', member_id)
      .order('created_at', { ascending: true });

    if (dmError) {
      console.error('Error fetching direct messages:', dmError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get broadcast messages for this mess
    const { data: broadcasts, error: broadcastError } = await supabase
      .from('broadcast_messages')
      .select('*')
      .eq('mess_id', mess_id)
      .order('created_at', { ascending: true });

    if (broadcastError) {
      console.error('Error fetching broadcasts:', broadcastError);
    }

    // Mark unread direct messages as read
    const unreadIds = directMessages
      ?.filter(m => m.sender_type === 'manager' && !m.is_read)
      .map(m => m.id) || [];

    if (unreadIds.length > 0) {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .in('id', unreadIds);
    }

    return new Response(
      JSON.stringify({
        success: true,
        directMessages: directMessages || [],
        broadcasts: broadcasts || [],
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

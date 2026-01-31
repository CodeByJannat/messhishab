import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Decrypt function matching manage-member
function decryptData(encrypted: string): string {
  if (!encrypted) return '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || '';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  
  try {
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const decrypted = encryptedBytes.map((byte, i) => byte ^ keyData[i % keyData.length]);
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

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

    // Create user-context client to validate the token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
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

    // Get all members for this mess
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id, name, email_encrypted, phone_encrypted, room_number_encrypted, is_active, created_at')
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });

    if (membersError) {
      throw membersError;
    }

    // Decrypt all member data
    const decryptedMembers = (members || []).map(member => ({
      id: member.id,
      name: member.name,
      email: decryptData(member.email_encrypted || ''),
      phone: decryptData(member.phone_encrypted || ''),
      roomNumber: decryptData(member.room_number_encrypted || ''),
      is_active: member.is_active,
      created_at: member.created_at,
    }));

    return new Response(
      JSON.stringify({ success: true, members: decryptedMembers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

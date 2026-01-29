import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Hash function matching manage-member
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user using admin client with the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { memberId, pin } = await req.json();

    // Get member data
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id, mess_id, pin_hash, email_encrypted, phone_encrypted, room_number_encrypted')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ success: false, error: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is manager of this mess
    const { data: mess, error: messError } = await supabaseAdmin
      .from('messes')
      .select('id')
      .eq('id', member.mess_id)
      .eq('manager_id', userId)
      .single();

    if (messError || !mess) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify PIN
    const pinHash = await hashPin(pin);
    const isValid = pinHash === member.pin_hash;

    // Log access attempt
    await supabaseAdmin
      .from('pin_access_logs')
      .insert({
        member_id: memberId,
        accessed_by: userId,
        success: isValid,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      });

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt and return data
    const email = decryptData(member.email_encrypted || '');
    const phone = decryptData(member.phone_encrypted || '');
    const roomNumber = decryptData(member.room_number_encrypted || '');

    return new Response(
      JSON.stringify({
        success: true,
        email,
        phone,
        roomNumber,
      }),
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

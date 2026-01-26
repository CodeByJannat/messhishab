import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for PIN (in production, use bcrypt via a proper library)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple encryption for PII
async function encryptData(data: string): Promise<string> {
  if (!data) return '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || '';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);
  
  // XOR encryption (simplified - in production use proper encryption)
  const encrypted = dataBytes.map((byte, i) => byte ^ keyData[i % keyData.length]);
  return btoa(String.fromCharCode(...encrypted));
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    const { action, messId, name, email, phone, roomNumber, pin } = await req.json();

    if (action === 'create') {
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

      // Hash PIN and encrypt PII
      const pinHash = await hashPin(pin);
      const emailEncrypted = email ? await encryptData(email) : null;
      const phoneEncrypted = phone ? await encryptData(phone) : null;
      const roomEncrypted = roomNumber ? await encryptData(roomNumber) : null;

      // Create member
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
          mess_id: messId,
          name,
          email_encrypted: emailEncrypted,
          phone_encrypted: phoneEncrypted,
          room_number_encrypted: roomEncrypted,
          pin_hash: pinHash,
        })
        .select()
        .single();

      if (memberError) {
        return new Response(
          JSON.stringify({ error: memberError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, memberId: member.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

// Decrypt function for checking existing members
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
      console.error('Auth error:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { action, messId, memberId, name, email, phone, roomNumber, pin } = await req.json();

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

    if (action === 'create') {
      // Validate required fields
      if (!name || !pin || !email || !phone) {
        return new Response(
          JSON.stringify({ error: 'Name, email, phone and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate phone number (11 digits only)
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        return new Response(
          JSON.stringify({ error: 'Phone number must be exactly 11 digits' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if member with same email or phone exists in ANY mess
      const { data: allMembers, error: checkError } = await supabaseAdmin
        .from('members')
        .select('id, mess_id, email_encrypted, phone_encrypted')
        .neq('mess_id', messId); // Check other messes

      if (checkError) {
        console.error('Check existing member error:', checkError);
        return new Response(
          JSON.stringify({ error: 'Failed to check existing members' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt and check each member's email and phone
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phoneDigits;

      for (const existingMember of allMembers || []) {
        const decryptedEmail = existingMember.email_encrypted ? decryptData(existingMember.email_encrypted) : '';
        const decryptedPhone = existingMember.phone_encrypted ? decryptData(existingMember.phone_encrypted) : '';
        
        if (decryptedEmail && decryptedEmail.toLowerCase().trim() === normalizedEmail) {
          return new Response(
            JSON.stringify({
              error: 'This email is already registered in another mess. One member can only be in one mess at a time.',
              errorBn: 'এই ইমেইল অন্য একটি মেসে নিবন্ধিত। একজন মেম্বার একবারে শুধুমাত্র একটি মেসে থাকতে পারে।'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (decryptedPhone && decryptedPhone.replace(/\D/g, '') === normalizedPhone) {
          return new Response(
            JSON.stringify({
              error: 'This phone number is already registered in another mess. One member can only be in one mess at a time.',
              errorBn: 'এই ফোন নম্বর অন্য একটি মেসে নিবন্ধিত। একজন মেম্বার একবারে শুধুমাত্র একটি মেসে থাকতে পারে।'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Also check within the same mess
      const { data: sameMembersRaw } = await supabaseAdmin
        .from('members')
        .select('id, email_encrypted, phone_encrypted')
        .eq('mess_id', messId);

      for (const existingMember of sameMembersRaw || []) {
        const decryptedEmail = existingMember.email_encrypted ? decryptData(existingMember.email_encrypted) : '';
        const decryptedPhone = existingMember.phone_encrypted ? decryptData(existingMember.phone_encrypted) : '';
        
        if (decryptedEmail && decryptedEmail.toLowerCase().trim() === normalizedEmail) {
          return new Response(
            JSON.stringify({
              error: 'This email is already registered in this mess.',
              errorBn: 'এই ইমেইল ইতিমধ্যে এই মেসে নিবন্ধিত।'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (decryptedPhone && decryptedPhone.replace(/\D/g, '') === normalizedPhone) {
          return new Response(
            JSON.stringify({
              error: 'This phone number is already registered in this mess.',
              errorBn: 'এই ফোন নম্বর ইতিমধ্যে এই মেসে নিবন্ধিত।'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Hash PIN and encrypt PII
      const pinHash = await hashPin(pin);
      const emailEncrypted = await encryptData(email);
      const phoneEncrypted = await encryptData(phone);
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
        console.error('Member creation error:', memberError);
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

    if (action === 'update') {
      if (!memberId || !name) {
        return new Response(
          JSON.stringify({ error: 'Member ID and name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Encrypt PII
      const emailEncrypted = email ? await encryptData(email) : null;
      const phoneEncrypted = phone ? await encryptData(phone) : null;
      const roomEncrypted = roomNumber ? await encryptData(roomNumber) : null;

      // Update member
      const { error: updateError } = await supabaseAdmin
        .from('members')
        .update({
          name,
          email_encrypted: emailEncrypted,
          phone_encrypted: phoneEncrypted,
          room_number_encrypted: roomEncrypted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('mess_id', messId);

      if (updateError) {
        console.error('Member update error:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phoneDigits;

      // Check if a Supabase Auth user already exists with this email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
      
      if (existingAuthUser) {
        return new Response(
          JSON.stringify({
            error: 'This email is already registered. Please use a different email.',
            errorBn: 'এই ইমেইল ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন।'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if member with same phone exists in ANY mess
      const { data: allMembers, error: checkError } = await supabaseAdmin
        .from('members')
        .select('id, mess_id, phone_encrypted');

      if (checkError) {
        console.error('Check existing member error:', checkError);
        return new Response(
          JSON.stringify({ error: 'Failed to check existing members' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check phone uniqueness
      for (const existingMember of allMembers || []) {
        const decryptedPhone = existingMember.phone_encrypted ? decryptData(existingMember.phone_encrypted) : '';
        
        if (decryptedPhone && decryptedPhone.replace(/\D/g, '') === normalizedPhone) {
          const isSameMess = existingMember.mess_id === messId;
          return new Response(
            JSON.stringify({
              error: isSameMess 
                ? 'This phone number is already registered in this mess.'
                : 'This phone number is already registered in another mess. One member can only be in one mess at a time.',
              errorBn: isSameMess
                ? 'এই ফোন নম্বর ইতিমধ্যে এই মেসে নিবন্ধিত।'
                : 'এই ফোন নম্বর অন্য একটি মেসে নিবন্ধিত। একজন মেম্বার একবারে শুধুমাত্র একটি মেসে থাকতে পারে।'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create Supabase Auth user for the member
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: pin,
        email_confirm: true, // Auto-confirm since manager is creating
        user_metadata: {
          name: name,
          role: 'member'
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create user account: ' + authError.message,
            errorBn: 'ইউজার অ্যাকাউন্ট তৈরি করতে ব্যর্থ: ' + authError.message
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newUserId = authData.user.id;

      // Create user role as 'member'
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role: 'member'
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        // Cleanup: delete the auth user if role creation fails
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({ error: 'Failed to assign member role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create profile for the member
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: newUserId,
          email: normalizedEmail
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway, profile is not critical
      }

      // Encrypt PII
      const phoneEncrypted = await encryptData(phone);
      const roomEncrypted = roomNumber ? await encryptData(roomNumber) : null;

      // Create member with user_id linked
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
          mess_id: messId,
          user_id: newUserId,
          name,
          email_encrypted: await encryptData(normalizedEmail),
          phone_encrypted: phoneEncrypted,
          room_number_encrypted: roomEncrypted,
          pin_hash: '', // No longer needed since using Supabase Auth
        })
        .select()
        .single();

      if (memberError) {
        console.error('Member creation error:', memberError);
        // Cleanup: delete the auth user if member creation fails
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
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
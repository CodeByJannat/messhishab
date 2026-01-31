import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple encryption for PII
async function encryptData(data: string): Promise<string> {
  if (!data) return '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || '';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);
  
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
    const { action, messId, memberId, name, email, phone, roomNumber, password } = await req.json();

    // Verify user is manager of this mess
    const { data: mess, error: messError } = await supabaseAdmin
      .from('messes')
      .select('id, mess_id')
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
      if (!name || !password || !email || !phone) {
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

      // Validate password length
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phoneDigits;

      // Check if email already exists in Supabase Auth
      const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailExists = existingAuthUsers?.users?.some(u => u.email?.toLowerCase() === normalizedEmail);
      
      if (emailExists) {
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

      // Decrypt and check each member's phone
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

      // Create Supabase Auth user for member
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true, // Auto-confirm since manager is creating
        user_metadata: {
          name: name,
          role: 'member',
          mess_id: mess.mess_id,
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        return new Response(
          JSON.stringify({ 
            error: authError.message,
            errorBn: 'মেম্বার অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Encrypt PII
      const emailEncrypted = await encryptData(email);
      const phoneEncrypted = await encryptData(phone);
      const roomEncrypted = roomNumber ? await encryptData(roomNumber) : null;

      // Create member with user_id linked to auth user
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
          mess_id: messId,
          user_id: authUser.user.id,
          name,
          email_encrypted: emailEncrypted,
          phone_encrypted: phoneEncrypted,
          room_number_encrypted: roomEncrypted,
          pin_hash: '', // No longer using PIN, using Supabase Auth
        })
        .select()
        .single();

      if (memberError) {
        console.error('Member creation error:', memberError);
        // Clean up auth user if member creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return new Response(
          JSON.stringify({ error: memberError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add member role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'member',
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
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

      // Get existing member to find user_id
      const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('user_id')
        .eq('id', memberId)
        .single();

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

      // Update auth user email if changed and user_id exists
      if (existingMember?.user_id && email) {
        await supabaseAdmin.auth.admin.updateUserById(existingMember.user_id, {
          email: email.toLowerCase().trim(),
          user_metadata: { name: name }
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      if (!memberId) {
        return new Response(
          JSON.stringify({ error: 'Member ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get member to find user_id
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('user_id')
        .eq('id', memberId)
        .eq('mess_id', messId)
        .single();

      // Delete member record
      const { error: deleteError } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', memberId)
        .eq('mess_id', messId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete auth user if exists
      if (member?.user_id) {
        await supabaseAdmin.auth.admin.deleteUser(member.user_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reset-password') {
      if (!memberId || !password) {
        return new Response(
          JSON.stringify({ error: 'Member ID and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get member to find user_id
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('user_id')
        .eq('id', memberId)
        .eq('mess_id', messId)
        .single();

      if (!member?.user_id) {
        return new Response(
          JSON.stringify({ error: 'Member does not have an associated account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update auth user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        member.user_id,
        { password: password }
      );

      if (updateError) {
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

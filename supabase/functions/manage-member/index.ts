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

    // Create client with user's auth header for token validation
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate token using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError?.message || 'No claims found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, messId, memberId, name, email, phone, roomNumber, password } = await req.json();

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

      // Check if member with same email or phone exists in ANY mess
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phoneDigits;

      const { data: existingByEmail } = await supabaseAdmin
        .from('members')
        .select('id, mess_id')
        .ilike('email', normalizedEmail)
        .neq('mess_id', messId)
        .limit(1);

      if (existingByEmail && existingByEmail.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'This email is already registered in another mess. One member can only be in one mess at a time.',
            errorBn: 'এই ইমেইল অন্য একটি মেসে নিবন্ধিত। একজন মেম্বার একবারে শুধুমাত্র একটি মেসে থাকতে পারে।'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existingByPhone } = await supabaseAdmin
        .from('members')
        .select('id, mess_id')
        .eq('phone', normalizedPhone)
        .neq('mess_id', messId)
        .limit(1);

      if (existingByPhone && existingByPhone.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'This phone number is already registered in another mess. One member can only be in one mess at a time.',
            errorBn: 'এই ফোন নম্বর অন্য একটি মেসে নিবন্ধিত। একজন মেম্বার একবারে শুধুমাত্র একটি মেসে থাকতে পারে।'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check within the same mess
      const { data: sameMessEmail } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('mess_id', messId)
        .ilike('email', normalizedEmail)
        .limit(1);

      if (sameMessEmail && sameMessEmail.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'This email is already registered in this mess.',
            errorBn: 'এই ইমেইল ইতিমধ্যে এই মেসে নিবন্ধিত।'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: sameMessPhone } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('mess_id', messId)
        .eq('phone', normalizedPhone)
        .limit(1);

      if (sameMessPhone && sameMessPhone.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'This phone number is already registered in this mess.',
            errorBn: 'এই ফোন নম্বর ইতিমধ্যে এই মেসে নিবন্ধিত।'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create member with plain text fields
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
          mess_id: messId,
          name,
          email: normalizedEmail,
          phone: normalizedPhone,
          room_number: roomNumber || null,
          password: password,
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

      // Update member with plain text fields
      const updateData: Record<string, unknown> = {
        name,
        updated_at: new Date().toISOString(),
      };

      if (email) updateData.email = email.toLowerCase().trim();
      if (phone) updateData.phone = phone.replace(/\D/g, '');
      if (roomNumber !== undefined) updateData.room_number = roomNumber || null;

      const { error: updateError } = await supabaseAdmin
        .from('members')
        .update(updateData)
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

    if (action === 'update-password') {
      if (!memberId || !password) {
        return new Response(
          JSON.stringify({ error: 'Member ID and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('members')
        .update({
          password: password,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('mess_id', messId);

      if (updateError) {
        console.error('Password update error:', updateError);
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

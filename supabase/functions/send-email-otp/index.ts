import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language = 'en' } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Delete any existing OTPs for this email
    await supabase
      .from('email_otps')
      .delete()
      .eq('email', email.toLowerCase().trim());

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('email_otps')
      .insert({
        email: email.toLowerCase().trim(),
        otp_code: otpCode,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      throw new Error('Failed to generate OTP');
    }

    // Send OTP email
    const emailContent = language === 'bn' ? {
      subject: 'MessHishab - আপনার ভেরিফিকেশন কোড',
      html: `
        <div style="font-family: 'Noto Sans Bengali', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; text-align: center;">MessHishab</h1>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
            <h2 style="color: #1e293b; margin-bottom: 16px;">আপনার ভেরিফিকেশন কোড</h2>
            <div style="background: #e0f2fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otpCode}</span>
            </div>
            <p style="color: #64748b; margin-top: 16px;">এই কোডটি ৫ মিনিটের মধ্যে মেয়াদ উত্তীর্ণ হবে।</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">আপনি যদি এই অনুরোধ না করে থাকেন, অনুগ্রহ করে এই ইমেইল উপেক্ষা করুন।</p>
          </div>
        </div>
      `,
    } : {
      subject: 'MessHishab - Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; text-align: center;">MessHishab</h1>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
            <h2 style="color: #1e293b; margin-bottom: 16px;">Your Verification Code</h2>
            <div style="background: #e0f2fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otpCode}</span>
            </div>
            <p style="color: #64748b; margin-top: 16px;">This code will expire in 5 minutes.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const emailResponse = await resend.emails.send({
      from: 'MessHishab <info@info.softauro.com>',
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('OTP email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-email-otp:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

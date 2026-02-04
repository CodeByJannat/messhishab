import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
  language?: 'bn' | 'en';
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirectUrl, language = 'en' }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Generate password reset link using Supabase Admin API
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (resetError) {
      console.error("Supabase reset error:", resetError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a reset link will be sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resetLink = data?.properties?.action_link;
    
    if (!resetLink) {
      throw new Error("Failed to generate reset link");
    }

    // Email content based on language
    const subject = language === 'bn' 
      ? 'আপনার পাসওয়ার্ড রিসেট করুন - Mess Hishab' 
      : 'Reset Your Password - Mess Hishab';

    const htmlContent = language === 'bn' ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1;">M</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Mess Hishab</h1>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">পাসওয়ার্ড রিসেট অনুরোধ</h2>
            <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px 0;">
              আপনি আপনার Mess Hishab অ্যাকাউন্টের জন্য পাসওয়ার্ড রিসেট অনুরোধ করেছেন। নতুন পাসওয়ার্ড সেট করতে নিচের বাটনে ক্লিক করুন।
            </p>
            
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              পাসওয়ার্ড রিসেট করুন
            </a>
            
            <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0 0;">
              এই লিংকটি ১ ঘন্টার মধ্যে মেয়াদ শেষ হবে।
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">
              যদি আপনি এই অনুরোধ না করে থাকেন, এই ইমেইল উপেক্ষা করুন।
            </p>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
            © ${new Date().getFullYear()} Mess Hishab. সকল অধিকার সংরক্ষিত।
          </p>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1;">M</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Mess Hishab</h1>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px 0;">
              You requested to reset your password for your Mess Hishab account. Click the button below to set a new password.
            </p>
            
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
            
            <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0 0;">
              This link will expire in 1 hour.
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
            © ${new Date().getFullYear()} Mess Hishab. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend API with custom domain
    const emailResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mess Hishab <noreply@info.softauro.com>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    const emailResult = await emailResponse.json();
    console.log("Password reset email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-password-reset function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
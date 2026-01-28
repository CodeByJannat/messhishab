import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeEmailRequest {
  email: string;
  messId: string;
  language?: 'bn' | 'en';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, messId, language = 'en' }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const subject = language === 'bn' 
      ? 'MessHishab-এ স্বাগতম! 🎉' 
      : 'Welcome to MessHishab! 🎉';

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
            <div style="background: white; width: 80px; height: 80px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 40px; font-weight: bold; color: #6366f1;">M</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">MessHishab</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">মেস ম্যানেজমেন্ট সহজ করুন</p>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">🎉 স্বাগতম, ম্যানেজার!</h2>
            
            <p style="color: #6b7280; line-height: 1.8; margin: 0 0 20px 0; font-size: 15px;">
              আপনার MessHishab অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! এখন থেকে আপনি সহজেই আপনার মেসের সব হিসাব-নিকাশ পরিচালনা করতে পারবেন।
            </p>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 16px;">📋 আপনার মেস আইডি</h3>
              <div style="background: white; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 12px; text-align: center;">
                <span style="font-size: 20px; font-weight: bold; color: #0c4a6e; letter-spacing: 2px;">${messId || 'আপনার ড্যাশবোর্ডে দেখুন'}</span>
              </div>
              <p style="color: #0369a1; font-size: 13px; margin: 12px 0 0 0;">
                সদস্যরা এই আইডি দিয়ে আপনার মেসে লগইন করতে পারবে।
              </p>
            </div>

            <h3 style="color: #1f2937; margin: 24px 0 16px 0; font-size: 16px;">✨ যা যা করতে পারবেন:</h3>
            
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">সদস্য যোগ করুন ও তাদের মিল ট্র্যাক করুন</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">বাজার খরচ ও ডিপোজিট রেকর্ড করুন</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">স্বয়ংক্রিয় মিল রেট হিসাব দেখুন</span>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">প্রতিটি সদস্যের ব্যালেন্স ট্র্যাক করুন</span>
              </div>
            </div>

            <a href="https://messhishab.lovable.app/login" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center;">
              ড্যাশবোর্ডে যান →
            </a>

            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                💡 <strong>টিপ:</strong> প্রথমে সেটিংস থেকে আপনার মেসের নাম সেট করুন এবং সদস্যদের যোগ করা শুরু করুন!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
              কোনো সমস্যা হলে যোগাযোগ করুন
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              support@softauro.com
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
              © ${new Date().getFullYear()} MessHishab. সকল অধিকার সংরক্ষিত।
            </p>
          </div>
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
            <div style="background: white; width: 80px; height: 80px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 40px; font-weight: bold; color: #6366f1;">M</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">MessHishab</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Simplify Your Mess Management</p>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">🎉 Welcome, Manager!</h2>
            
            <p style="color: #6b7280; line-height: 1.8; margin: 0 0 20px 0; font-size: 15px;">
              Your MessHishab account has been successfully created! You can now easily manage all your mess accounts and expenses.
            </p>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 16px;">📋 Your Mess ID</h3>
              <div style="background: white; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 12px; text-align: center;">
                <span style="font-size: 20px; font-weight: bold; color: #0c4a6e; letter-spacing: 2px;">${messId || 'Check your dashboard'}</span>
              </div>
              <p style="color: #0369a1; font-size: 13px; margin: 12px 0 0 0;">
                Members can use this ID to log in to your mess.
              </p>
            </div>

            <h3 style="color: #1f2937; margin: 24px 0 16px 0; font-size: 16px;">✨ What you can do:</h3>
            
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">Add members and track their meals</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">Record grocery expenses and deposits</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">View automatic meal rate calculations</span>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">Track each member's balance</span>
              </div>
            </div>

            <a href="https://messhishab.lovable.app/login" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center;">
              Go to Dashboard →
            </a>

            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                💡 <strong>Tip:</strong> First, set your mess name in settings and start adding members!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
              Need help? Contact us
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              support@softauro.com
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
              © ${new Date().getFullYear()} MessHishab. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MessHishab <noreply@info.softauro.com>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send welcome email");
    }

    const emailResult = await emailResponse.json();
    console.log("Welcome email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-welcome-email function:", error);
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

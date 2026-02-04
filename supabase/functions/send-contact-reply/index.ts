import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactReplyRequest {
  contactMessageId: string;
  recipientEmail: string;
  recipientName: string;
  replyMessage: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header and verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token and check admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Access denied: Admin role required");
    }

    const { contactMessageId, recipientEmail, recipientName, replyMessage }: ContactReplyRequest = await req.json();

    // Validate required fields
    if (!contactMessageId || !recipientEmail || !recipientName || !replyMessage) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("Invalid email format");
    }

    // Validate message length
    if (replyMessage.trim().length === 0) {
      throw new Error("Reply message cannot be empty");
    }

    if (replyMessage.length > 5000) {
      throw new Error("Reply message is too long");
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Mess Hishab Support <noreply@info.softauro.com>",
        to: [recipientEmail],
        subject: "Reply from Mess Hishab Support",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Mess Hishab Support</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin-top: 0;">প্রিয় ${recipientName},</p>
              <p>আপনার মেসেজের জবাবে আমাদের সাপোর্ট টিম থেকে উত্তর:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${replyMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              </div>
              
              <p>আপনার যদি আরও কোনো প্রশ্ন থাকে, অনুগ্রহ করে এই ইমেইলে উত্তর দিন অথবা আমাদের ওয়েবসাইটে যোগাযোগ করুন।</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                ধন্যবাদ,<br>
                <strong>Mess Hishab Support Team</strong>
              </p>
            </div>
            
            <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Mess Hishab. All rights reserved.<br>
                <a href="https://messhishab.lovable.app" style="color: #818cf8;">messhishab.lovable.app</a>
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    const emailResult = await emailResponse.json();

    console.log("Contact reply email sent successfully:", emailResult);

    // Save reply to database
    const { error: insertError } = await supabase
      .from("contact_message_replies")
      .insert({
        contact_message_id: contactMessageId,
        admin_id: userData.user.id,
        reply_message: replyMessage.trim(),
      });

    if (insertError) {
      console.error("Error saving reply to database:", insertError);
      throw new Error("Email sent but failed to save reply record");
    }

    // Update contact message status to 'replied'
    const { error: updateError } = await supabase
      .from("contact_messages")
      .update({ status: "replied" })
      .eq("id", contactMessageId);

    if (updateError) {
      console.error("Error updating message status:", updateError);
      // Don't throw - email was sent and reply was saved
    }

    return new Response(
      JSON.stringify({ success: true, message: "Reply sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-reply function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Admin role required") ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
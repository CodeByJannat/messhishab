import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Predefined coupon codes and their discounts
const COUPON_CODES: Record<string, { discount_percent: number; valid_until: string; description: string }> = {
  'WELCOME50': { discount_percent: 50, valid_until: '2026-12-31', description: '50% off for new users' },
  'YEARLY20': { discount_percent: 20, valid_until: '2026-12-31', description: '20% off yearly subscription' },
  'MESS2026': { discount_percent: 30, valid_until: '2026-06-30', description: '30% special discount' },
  'FREEMONTH': { discount_percent: 100, valid_until: '2026-03-31', description: 'Free month trial' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { coupon_code, subscription_type } = await req.json();

    if (!coupon_code) {
      return new Response(
        JSON.stringify({ error: 'Coupon code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperCode = coupon_code.toUpperCase().trim();
    const coupon = COUPON_CODES[upperCode];

    if (!coupon) {
      return new Response(
        JSON.stringify({ error: 'Invalid coupon code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if coupon is still valid
    if (new Date(coupon.valid_until) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Coupon has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate prices
    const basePrice = subscription_type === 'yearly' ? 200 : 20;
    const discountAmount = (basePrice * coupon.discount_percent) / 100;
    const finalPrice = basePrice - discountAmount;

    return new Response(
      JSON.stringify({
        success: true,
        coupon: {
          code: upperCode,
          discount_percent: coupon.discount_percent,
          description: coupon.description,
        },
        pricing: {
          base_price: basePrice,
          discount_amount: discountAmount,
          final_price: finalPrice,
          currency: 'BDT',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

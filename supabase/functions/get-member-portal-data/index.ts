import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the auth token from header
    const authHeader = req.headers.get('Authorization');
    let member_id: string;
    let mess_id: string;

    if (authHeader?.startsWith('Bearer ')) {
      // Authenticated via Supabase Auth
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get member by user_id
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, name, mess_id, is_active')
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return new Response(
          JSON.stringify({ error: 'Member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!member.is_active) {
        return new Response(
          JSON.stringify({ error: 'Member is not active' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      member_id = member.id;
      mess_id = member.mess_id;
    } else {
      // Fallback to body params (for backward compatibility)
      const body = await req.json();
      
      if (!body.member_id || !body.mess_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify member exists and is active
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, name, mess_id, is_active')
        .eq('id', body.member_id)
        .eq('mess_id', body.mess_id)
        .single();

      if (memberError || !member || !member.is_active) {
        return new Response(
          JSON.stringify({ error: 'Member not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      member_id = body.member_id;
      mess_id = body.mess_id;
    }

    // Fetch member's meals
    const { data: mealsData } = await supabase
      .from('meals')
      .select('id, date, breakfast, lunch, dinner')
      .eq('member_id', member_id)
      .order('date', { ascending: false });

    const breakfast = mealsData?.reduce((sum, m) => sum + m.breakfast, 0) || 0;
    const lunch = mealsData?.reduce((sum, m) => sum + m.lunch, 0) || 0;
    const dinner = mealsData?.reduce((sum, m) => sum + m.dinner, 0) || 0;
    const totalMeals = breakfast + lunch + dinner;

    // Fetch member's bazar contributions
    const { data: memberBazarData } = await supabase
      .from('bazars')
      .select('id, date, person_name, items, cost')
      .eq('member_id', member_id)
      .order('date', { ascending: false });

    const bazarContribution = memberBazarData?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;

    // Fetch all bazars for the mess (to show full bazar list)
    const { data: allBazarsData } = await supabase
      .from('bazars')
      .select('id, date, person_name, items, cost')
      .eq('mess_id', mess_id)
      .order('date', { ascending: false });

    // Fetch member's deposits
    const { data: depositsData } = await supabase
      .from('deposits')
      .select('id, date, amount, note')
      .eq('member_id', member_id)
      .order('date', { ascending: false });

    const totalDeposit = depositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    // Calculate meal rate from all mess data
    const { data: allBazars } = await supabase
      .from('bazars')
      .select('cost')
      .eq('mess_id', mess_id);

    const { data: allMeals } = await supabase
      .from('meals')
      .select('breakfast, lunch, dinner')
      .eq('mess_id', mess_id);

    const totalBazar = allBazars?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;
    const allMealsCount = allMeals?.reduce((sum, m) => sum + m.breakfast + m.lunch + m.dinner, 0) || 0;
    const mealRate = allMealsCount > 0 ? totalBazar / allMealsCount : 0;

    // Calculate balance
    const mealCost = totalMeals * mealRate;
    const balance = totalDeposit - mealCost;

    // Fetch notifications
    const { data: notifData } = await supabase
      .from('notifications')
      .select('id, message, to_all, created_at')
      .eq('mess_id', mess_id)
      .or(`to_all.eq.true,to_member_id.eq.${member_id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch admin messages
    const { data: adminMsgData } = await supabase
      .from('admin_messages')
      .select('id, message, target_type, created_at')
      .or(`target_type.eq.global,target_mess_id.eq.${mess_id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          mealBreakdown: {
            breakfast,
            lunch,
            dinner,
            total: totalMeals,
          },
          meals: mealsData || [],
          bazarContribution,
          allBazars: allBazarsData || [],
          memberBazars: memberBazarData || [],
          deposits: depositsData || [],
          totalDeposit,
          mealRate,
          balance,
          totalBazar,
          notifications: notifData || [],
          adminMessages: adminMsgData || [],
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

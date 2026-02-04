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
    const { member_id, mess_id, session_token } = await req.json();

    if (!member_id || !mess_id || !session_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify session token exists and is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify member exists and is active
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, mess_id, is_active')
      .eq('id', member_id)
      .eq('mess_id', mess_id)
      .single();

    if (memberError || !member || !member.is_active) {
      return new Response(
        JSON.stringify({ error: 'Member not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current month boundaries for filtering
    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const currentMonthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    // Fetch member's meals for current month
    const { data: mealsData } = await supabase
      .from('meals')
      .select('id, date, breakfast, lunch, dinner')
      .eq('member_id', member_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd)
      .order('date', { ascending: false });

    const breakfast = mealsData?.reduce((sum, m) => sum + m.breakfast, 0) || 0;
    const lunch = mealsData?.reduce((sum, m) => sum + m.lunch, 0) || 0;
    const dinner = mealsData?.reduce((sum, m) => sum + m.dinner, 0) || 0;
    const totalMeals = breakfast + lunch + dinner;

    // Fetch member's bazar contributions for current month
    const { data: memberBazarData } = await supabase
      .from('bazars')
      .select('id, date, person_name, items, cost')
      .eq('member_id', member_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd)
      .order('date', { ascending: false });

    const bazarContribution = memberBazarData?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;

    // Fetch all bazars for the mess for current month (to show full bazar list)
    const { data: allBazarsData } = await supabase
      .from('bazars')
      .select('id, date, person_name, items, cost')
      .eq('mess_id', mess_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd)
      .order('date', { ascending: false });

    // Fetch member's deposits for current month
    const { data: depositsData } = await supabase
      .from('deposits')
      .select('id, date, amount, note')
      .eq('member_id', member_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd)
      .order('date', { ascending: false });

    const totalDeposit = depositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    // Calculate meal rate from all mess data for current month
    const { data: allBazars } = await supabase
      .from('bazars')
      .select('cost')
      .eq('mess_id', mess_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd);

    const { data: allMeals } = await supabase
      .from('meals')
      .select('breakfast, lunch, dinner')
      .eq('mess_id', mess_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd);

    const totalBazar = allBazars?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;
    const allMealsCount = allMeals?.reduce((sum, m) => sum + m.breakfast + m.lunch + m.dinner, 0) || 0;
    const mealRate = allMealsCount > 0 ? totalBazar / allMealsCount : 0;

    // Calculate balance
    const mealCost = totalMeals * mealRate;

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

    // Fetch sent messages by this member (messages with member_id reference)
    const { data: sentMsgData } = await supabase
      .from('notifications')
      .select('id, message, created_at')
      .eq('mess_id', mess_id)
      .eq('to_member_id', member_id)
      .eq('to_all', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch additional costs for the mess for current month
    const { data: additionalCostsData } = await supabase
      .from('additional_costs')
      .select('id, date, description, amount')
      .eq('mess_id', mess_id)
      .gte('date', currentMonthStart)
      .lt('date', currentMonthEnd)
      .order('date', { ascending: false });

    const totalAdditionalCosts = additionalCostsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

    // Fetch total active members count for per-head calculation
    const { count: totalMembersCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('mess_id', mess_id)
      .eq('is_active', true);

    // Calculate per-head additional cost and final balance
    const perHeadAdditionalCost = totalMembersCount && totalMembersCount > 0 
      ? totalAdditionalCosts / totalMembersCount 
      : 0;
    
    // Member Balance = Total Deposit − (Per-Head Additional Cost + Total Meal Cost)
    const balance = totalDeposit - (perHeadAdditionalCost + mealCost);

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
          mealCost,
          balance,
          totalBazar,
          notifications: notifData || [],
          adminMessages: adminMsgData || [],
          sentMessages: sentMsgData || [],
          additionalCosts: additionalCostsData || [],
          totalAdditionalCosts,
          perHeadAdditionalCost,
          totalMembers: totalMembersCount || 0,
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

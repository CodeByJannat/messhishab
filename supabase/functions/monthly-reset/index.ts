import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active messes
    const { data: messes, error: messesError } = await supabase
      .from('messes')
      .select('id, current_month');

    if (messesError) throw messesError;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const results = [];

    for (const mess of messes || []) {
      // Skip if already on current month
      if (mess.current_month === currentMonth) {
        results.push({ mess_id: mess.id, status: 'skipped', reason: 'Already on current month' });
        continue;
      }

      try {
        // Get all members for this mess
        const { data: members } = await supabase
          .from('members')
          .select('id, name, is_active')
          .eq('mess_id', mess.id);

        // Get all meals for this mess in the current month
        const { data: meals } = await supabase
          .from('meals')
          .select('member_id, breakfast, lunch, dinner')
          .eq('mess_id', mess.id);

        // Get all deposits for this mess
        const { data: deposits } = await supabase
          .from('deposits')
          .select('member_id, amount')
          .eq('mess_id', mess.id);

        // Get all bazars for this mess
        const { data: bazars } = await supabase
          .from('bazars')
          .select('cost')
          .eq('mess_id', mess.id);

        // Calculate totals
        const totalBazar = bazars?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;
        const totalMeals = meals?.reduce((sum, m) => sum + m.breakfast + m.lunch + m.dinner, 0) || 0;
        const mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;

        // Build members data for archive
        const membersData = (members || []).map(member => {
          const memberMeals = meals?.filter(m => m.member_id === member.id) || [];
          const memberDeposits = deposits?.filter(d => d.member_id === member.id) || [];
          
          const totalMemberMeals = memberMeals.reduce((sum, m) => sum + m.breakfast + m.lunch + m.dinner, 0);
          const totalMemberDeposits = memberDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
          const mealCost = totalMemberMeals * mealRate;
          const balance = totalMemberDeposits - mealCost;

          return {
            member_id: member.id,
            name: member.name,
            is_active: member.is_active,
            total_meals: totalMemberMeals,
            total_deposits: totalMemberDeposits,
            meal_cost: mealCost,
            balance: balance,
          };
        });

        // Create archive
        const { error: archiveError } = await supabase
          .from('monthly_archives')
          .insert({
            mess_id: mess.id,
            month: mess.current_month,
            total_bazar: totalBazar,
            total_meals: totalMeals,
            meal_rate: mealRate,
            members_data: membersData,
          });

        if (archiveError) throw archiveError;

        // Delete old meals
        await supabase
          .from('meals')
          .delete()
          .eq('mess_id', mess.id);

        // Delete old bazars
        await supabase
          .from('bazars')
          .delete()
          .eq('mess_id', mess.id);

        // Delete old deposits
        await supabase
          .from('deposits')
          .delete()
          .eq('mess_id', mess.id);

        // Update mess to current month
        await supabase
          .from('messes')
          .update({ current_month: currentMonth })
          .eq('id', mess.id);

        results.push({ mess_id: mess.id, status: 'success', archived_month: mess.current_month });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ mess_id: mess.id, status: 'error', error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
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

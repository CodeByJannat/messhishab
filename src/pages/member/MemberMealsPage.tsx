import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MemberMealsSkeleton } from '@/components/ui/loading-skeletons';
import { Utensils, Coffee, Sun, Moon, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, endOfMonth } from 'date-fns';

interface Meal {
  id: string;
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
}

interface MealBreakdown {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function MemberMealsPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [mealBreakdown, setMealBreakdown] = useState<MealBreakdown>({ breakfast: 0, lunch: 0, dinner: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (memberSession) {
      fetchMeals();
    }
  }, [memberSession]);

  useEffect(() => {
    filterMealsByMonth();
  }, [selectedMonth, allMeals]);

  const fetchMeals = async () => {
    if (!memberSession) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-member-portal-data', {
        body: {
          member_id: memberSession.member.id,
          mess_id: memberSession.mess.id,
          session_token: memberSession.session_token,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const meals = data.data.meals || [];
      setAllMeals(meals);

      // Get available months
      const monthsSet = new Set<string>();
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      meals.forEach((meal: Meal) => {
        const month = meal.date.substring(0, 7);
        monthsSet.add(month);
      });

      const months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(month => {
        const date = parseISO(`${month}-01`);
        return {
          value: month,
          label: format(date, language === 'bn' ? 'MMMM yyyy' : 'MMMM yyyy'),
        };
      });

      setAvailableMonths(months);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMealsByMonth = () => {
    if (!selectedMonth || allMeals.length === 0) return;

    const startDate = `${selectedMonth}-01`;
    const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

    const filtered = allMeals.filter(meal => 
      meal.date >= startDate && meal.date <= endDate
    );

    setFilteredMeals(filtered);

    // Calculate breakdown for filtered meals
    const breakfast = filtered.reduce((sum, m) => sum + m.breakfast, 0);
    const lunch = filtered.reduce((sum, m) => sum + m.lunch, 0);
    const dinner = filtered.reduce((sum, m) => sum + m.dinner, 0);
    setMealBreakdown({
      breakfast,
      lunch,
      dinner,
      total: breakfast + lunch + dinner,
    });
  };

  if (isLoading) {
    return (
      <MemberDashboardLayout>
        <MemberMealsSkeleton />
      </MemberDashboardLayout>
    );
  }

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'মিল রেকর্ড' : 'Meal Records'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'আপনার মিলের বিস্তারিত' : 'Your meal details'}
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'মাস সিলেক্ট করুন' : 'Select month'} />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Coffee className="w-6 h-6 mx-auto text-warning mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'সকাল' : 'Breakfast'}</p>
              <p className="text-2xl font-bold text-foreground">{mealBreakdown.breakfast}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Sun className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'দুপুর' : 'Lunch'}</p>
              <p className="text-2xl font-bold text-foreground">{mealBreakdown.lunch}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Moon className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'রাত' : 'Dinner'}</p>
              <p className="text-2xl font-bold text-foreground">{mealBreakdown.dinner}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Utensils className="w-6 h-6 mx-auto text-success mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট' : 'Total'}</p>
              <p className="text-2xl font-bold text-success">{mealBreakdown.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Meals Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'দৈনিক মিল' : 'Daily Meals'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMeals.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'এই মাসে কোনো মিল রেকর্ড নেই' : 'No meal records for this month'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'সকাল' : 'Breakfast'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'দুপুর' : 'Lunch'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'রাত' : 'Dinner'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'মোট' : 'Total'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeals.map((meal, index) => (
                      <motion.tr
                        key={meal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border"
                      >
                        <TableCell>
                          {new Date(meal.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </TableCell>
                        <TableCell className="text-center">{meal.breakfast}</TableCell>
                        <TableCell className="text-center">{meal.lunch}</TableCell>
                        <TableCell className="text-center">{meal.dinner}</TableCell>
                        <TableCell className="text-center font-medium">
                          {meal.breakfast + meal.lunch + meal.dinner}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberDashboardLayout>
  );
}

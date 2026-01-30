import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Utensils, Coffee, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function MemberMealsPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealBreakdown, setMealBreakdown] = useState<MealBreakdown>({ breakfast: 0, lunch: 0, dinner: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (memberSession) {
      fetchMeals();
    }
  }, [memberSession]);

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

      setMeals(data.data.meals || []);
      setMealBreakdown(data.data.mealBreakdown);
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'মিল রেকর্ড' : 'Meal Records'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'আপনার মিলের বিস্তারিত' : 'Your meal details'}
          </p>
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
            {meals.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো মিল রেকর্ড নেই' : 'No meal records yet'}
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
                    {meals.map((meal, index) => (
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

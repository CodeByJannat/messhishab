import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Minus, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Member {
  id: string;
  name: string;
}

interface Meal {
  id: string;
  member_id: string;
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
}

export default function MealsPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    if (mess) {
      fetchMembers();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && members.length > 0) {
      fetchMeals();
    }
  }, [mess, selectedDate, members]);

  const fetchMembers = async () => {
    if (!mess) return;

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq('mess_id', mess.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchMeals = async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('mess_id', mess.id)
        .eq('date', selectedDate);

      if (error) throw error;
      setMeals(data || []);
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

  const getMealForMember = (memberId: string): Meal | undefined => {
    return meals.find((m) => m.member_id === memberId);
  };

  const updateMeal = async (
    memberId: string,
    type: 'breakfast' | 'lunch' | 'dinner',
    delta: number
  ) => {
    if (!mess) return;
    setIsSaving(`${memberId}-${type}`);

    const existingMeal = getMealForMember(memberId);
    const currentValue = existingMeal?.[type] || 0;
    const newValue = Math.max(0, currentValue + delta);

    try {
      if (existingMeal) {
        const { error } = await supabase
          .from('meals')
          .update({ [type]: newValue })
          .eq('id', existingMeal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meals')
          .insert({
            mess_id: mess.id,
            member_id: memberId,
            date: selectedDate,
            [type]: newValue,
          });

        if (error) throw error;
      }

      fetchMeals();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(null);
    }
  };

  const MealCounter = ({
    memberId,
    type,
    value,
  }: {
    memberId: string;
    type: 'breakfast' | 'lunch' | 'dinner';
    value: number;
  }) => (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={() => updateMeal(memberId, type, -1)}
        disabled={value === 0 || isSaving === `${memberId}-${type}`}
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span className="w-8 text-center font-medium">
        {isSaving === `${memberId}-${type}` ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : (
          value
        )}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={() => updateMeal(memberId, type, 1)}
        disabled={isSaving === `${memberId}-${type}`}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'মিল ম্যানেজমেন্ট' : 'Meal Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'প্রতিদিনের মিল রেকর্ড করুন' : 'Record daily meals'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl w-auto"
            />
          </div>
        </div>

        {/* Meals Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'প্রথমে মেম্বার যোগ করুন' : 'Add members first'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'মেম্বার' : 'Member'}</TableHead>
                      <TableHead className="text-center">
                        {language === 'bn' ? 'সকাল' : 'Breakfast'}
                      </TableHead>
                      <TableHead className="text-center">
                        {language === 'bn' ? 'দুপুর' : 'Lunch'}
                      </TableHead>
                      <TableHead className="text-center">
                        {language === 'bn' ? 'রাত' : 'Dinner'}
                      </TableHead>
                      <TableHead className="text-center">
                        {language === 'bn' ? 'মোট' : 'Total'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const meal = getMealForMember(member.id);
                      const breakfast = meal?.breakfast || 0;
                      const lunch = meal?.lunch || 0;
                      const dinner = meal?.dinner || 0;
                      const total = breakfast + lunch + dinner;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>
                            <MealCounter memberId={member.id} type="breakfast" value={breakfast} />
                          </TableCell>
                          <TableCell>
                            <MealCounter memberId={member.id} type="lunch" value={lunch} />
                          </TableCell>
                          <TableCell>
                            <MealCounter memberId={member.id} type="dinner" value={dinner} />
                          </TableCell>
                          <TableCell className="text-center font-bold">{total}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

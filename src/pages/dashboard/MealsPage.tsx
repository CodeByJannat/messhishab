import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReadOnly } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDateValidation } from '@/hooks/useDateValidation';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';
import { Plus, Minus, Loader2, Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { format, endOfMonth, parseISO } from 'date-fns';

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

interface MonthlyMealSummary {
  memberId: string;
  memberName: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function MealsPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { validateDate, getMaxDate, getMinDate, filterValidMonths } = useDateValidation();
  const { isReadOnly, expiredDaysAgo, readOnlyMonths } = useReadOnly();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // Monthly report state
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthlySummary, setMonthlySummary] = useState<MonthlyMealSummary[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Check if editing is disabled (read-only mode or date error)
  const isEditingDisabled = isReadOnly || !!dateError;

  useEffect(() => {
    if (mess) {
      fetchMembers();
      fetchAvailableMonths();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && members.length > 0) {
      // Validate the selected date
      const validation = validateDate(selectedDate);
      setDateError(validation.error);
      
      if (validation.isValid) {
        fetchMeals();
      }
    }
  }, [mess, selectedDate, members]);

  useEffect(() => {
    if (mess && members.length > 0 && selectedMonth) {
      fetchMonthlyReport();
    }
  }, [mess, selectedMonth, members]);

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

  const fetchAvailableMonths = async () => {
    if (!mess) return;

    try {
      const { data, error } = await supabase
        .from('meals')
        .select('date')
        .eq('mess_id', mess.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Extract unique months
      const monthsSet = new Set<string>();
      (data || []).forEach(meal => {
        const month = meal.date.substring(0, 7); // YYYY-MM
        monthsSet.add(month);
      });

      // Add current month if not present
      const currentMonth = format(new Date(), 'yyyy-MM');
      monthsSet.add(currentMonth);

      const months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(month => {
        const date = parseISO(`${month}-01`);
        return {
          value: month,
          label: format(date, language === 'bn' ? 'MMMM yyyy' : 'MMMM yyyy'),
        };
      });

      // Filter months based on subscription
      const validMonths = filterValidMonths(months);
      setAvailableMonths(validMonths);
      
      if (validMonths.length > 0 && !validMonths.find(m => m.value === selectedMonth)) {
        setSelectedMonth(validMonths[0].value);
      }
    } catch (error: any) {
      console.error('Error fetching months:', error);
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

  const fetchMonthlyReport = async () => {
    if (!mess || !selectedMonth) return;
    setIsLoadingReport(true);

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('meals')
        .select('member_id, breakfast, lunch, dinner')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Aggregate by member
      const memberMeals: Record<string, { breakfast: number; lunch: number; dinner: number }> = {};
      (data || []).forEach(meal => {
        if (!memberMeals[meal.member_id]) {
          memberMeals[meal.member_id] = { breakfast: 0, lunch: 0, dinner: 0 };
        }
        memberMeals[meal.member_id].breakfast += meal.breakfast;
        memberMeals[meal.member_id].lunch += meal.lunch;
        memberMeals[meal.member_id].dinner += meal.dinner;
      });

      const summary: MonthlyMealSummary[] = members.map(member => {
        const meals = memberMeals[member.id] || { breakfast: 0, lunch: 0, dinner: 0 };
        return {
          memberId: member.id,
          memberName: member.name,
          breakfast: meals.breakfast,
          lunch: meals.lunch,
          dinner: meals.dinner,
          total: meals.breakfast + meals.lunch + meals.dinner,
        };
      });

      setMonthlySummary(summary);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingReport(false);
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
    
    // Block updates in read-only mode
    if (isReadOnly) {
      toast({
        title: language === 'bn' ? 'শুধুমাত্র দেখার মোড' : 'Read-Only Mode',
        description: language === 'bn' ? 'এডিট করতে সাবস্ক্রাইব করুন' : 'Subscribe to edit',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate date before allowing any update
    const validation = validateDate(selectedDate);
    if (!validation.isValid) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }
    
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
      fetchAvailableMonths();
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

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const validation = validateDate(newDate);
    setDateError(validation.error);
  };

  const MealCounter = ({
    memberId,
    type,
    value,
  }: {
    memberId: string;
    type: 'breakfast' | 'lunch' | 'dinner';
    value: number;
  }) => {
    const isDisabled = isEditingDisabled;
    
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => updateMeal(memberId, type, -1)}
          disabled={value === 0 || isSaving === `${memberId}-${type}` || isDisabled}
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
          disabled={isSaving === `${memberId}-${type}` || isDisabled}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  const totalMonthlyMeals = monthlySummary.reduce((sum, m) => sum + m.total, 0);
  const totalBreakfast = monthlySummary.reduce((sum, m) => sum + m.breakfast, 0);
  const totalLunch = monthlySummary.reduce((sum, m) => sum + m.lunch, 0);
  const totalDinner = monthlySummary.reduce((sum, m) => sum + m.dinner, 0);

  // Export handlers - PDF uses English only (jsPDF doesn't support Bengali fonts)
  const handleExportPDF = () => {
    const monthDate = parseISO(`${selectedMonth}-01`);
    const monthLabel = format(monthDate, 'MMMM yyyy');
    exportToPDF({
      title: 'Meal Report',
      subtitle: monthLabel,
      messName: mess?.name || 'Mess',
      fileName: `meals-${selectedMonth}`,
      columns: [
        { header: 'Member Name', key: 'memberName', width: 25 },
        { header: 'Breakfast', key: 'breakfast', width: 12 },
        { header: 'Lunch', key: 'lunch', width: 12 },
        { header: 'Dinner', key: 'dinner', width: 12 },
        { header: 'Total', key: 'total', width: 12 },
      ],
      data: [
        ...monthlySummary,
        { memberName: 'Total', breakfast: totalBreakfast, lunch: totalLunch, dinner: totalDinner, total: totalMonthlyMeals }
      ],
    });
  };

  const handleExportExcel = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    exportToExcel({
      title: language === 'bn' ? 'মিল রিপোর্ট' : 'Meal Report',
      subtitle: monthLabel,
      messName: mess?.name || (language === 'bn' ? 'মেস' : 'Mess'),
      fileName: `meals-${selectedMonth}`,
      columns: [
        { header: language === 'bn' ? 'মেম্বারের নাম' : 'Member Name', key: 'memberName', width: 25 },
        { header: language === 'bn' ? 'সকাল' : 'Breakfast', key: 'breakfast', width: 12 },
        { header: language === 'bn' ? 'দুপুর' : 'Lunch', key: 'lunch', width: 12 },
        { header: language === 'bn' ? 'রাত' : 'Dinner', key: 'dinner', width: 12 },
        { header: language === 'bn' ? 'মোট' : 'Total', key: 'total', width: 12 },
      ],
      data: [
        ...monthlySummary,
        { memberName: language === 'bn' ? 'মোট' : 'Total', breakfast: totalBreakfast, lunch: totalLunch, dinner: totalDinner, total: totalMonthlyMeals }
      ],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Read-Only Banner */}
        {isReadOnly && <ReadOnlyBanner expiredDaysAgo={expiredDaysAgo} readOnlyMonths={readOnlyMonths} />}

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
          <ExportButton onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={monthlySummary.length === 0} />
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {language === 'bn' ? 'দৈনিক এন্ট্রি' : 'Daily Entry'}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {language === 'bn' ? 'মাসিক রিপোর্ট' : 'Monthly Report'}
            </TabsTrigger>
          </TabsList>

          {/* Daily Entry Tab */}
          <TabsContent value="daily" className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={getMaxDate()}
                  min={getMinDate() || undefined}
                  className="rounded-xl w-auto"
                />
              </div>
              
              {/* Min date explanation */}
              {getMinDate() && (
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' 
                    ? `তারিখ নির্বাচনের সীমা: ${getMinDate()} থেকে ${getMaxDate()} পর্যন্ত`
                    : `Date range: ${getMinDate()} to ${getMaxDate()}`}
                </p>
              )}
              
              {/* Date validation error */}
              {dateError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{dateError}</AlertDescription>
                </Alert>
              )}
            </div>

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
                ) : dateError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'bn' ? 'এই তারিখে এন্ট্রি করা যাবে না' : 'Cannot enter data for this date'}
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
          </TabsContent>

          {/* Monthly Report Tab */}
          <TabsContent value="monthly" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] rounded-xl">
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

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'সকাল' : 'Breakfast'}</p>
                  <p className="text-2xl font-bold text-warning">{totalBreakfast}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'দুপুর' : 'Lunch'}</p>
                  <p className="text-2xl font-bold text-primary">{totalLunch}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'রাত' : 'Dinner'}</p>
                  <p className="text-2xl font-bold text-secondary">{totalDinner}</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-success/30 bg-success/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট মিল' : 'Total Meals'}</p>
                  <p className="text-2xl font-bold text-success">{totalMonthlyMeals}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'bn' ? 'মেম্বার-ওয়াইজ সামারি' : 'Member-wise Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingReport ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : monthlySummary.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'bn' ? 'এই মাসে কোনো ডেটা নেই' : 'No data for this month'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'bn' ? 'মেম্বার' : 'Member'}</TableHead>
                          <TableHead className="text-center">{language === 'bn' ? 'সকাল' : 'Breakfast'}</TableHead>
                          <TableHead className="text-center">{language === 'bn' ? 'দুপুর' : 'Lunch'}</TableHead>
                          <TableHead className="text-center">{language === 'bn' ? 'রাত' : 'Dinner'}</TableHead>
                          <TableHead className="text-center">{language === 'bn' ? 'মোট' : 'Total'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlySummary.map((member) => (
                          <TableRow key={member.memberId}>
                            <TableCell className="font-medium">{member.memberName}</TableCell>
                            <TableCell className="text-center">{member.breakfast}</TableCell>
                            <TableCell className="text-center">{member.lunch}</TableCell>
                            <TableCell className="text-center">{member.dinner}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{member.total}</TableCell>
                          </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>{language === 'bn' ? 'মোট' : 'Total'}</TableCell>
                          <TableCell className="text-center">{totalBreakfast}</TableCell>
                          <TableCell className="text-center">{totalLunch}</TableCell>
                          <TableCell className="text-center">{totalDinner}</TableCell>
                          <TableCell className="text-center text-primary">{totalMonthlyMeals}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

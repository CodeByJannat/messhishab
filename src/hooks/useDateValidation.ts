import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, parseISO, isBefore, startOfDay, isAfter } from 'date-fns';

interface DateValidationResult {
  isValid: boolean;
  error: string | null;
}

export function useDateValidation() {
  const { subscription } = useAuth();
  const { language } = useLanguage();

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  // Get subscription start date (or default to a very old date if no subscription)
  const subscriptionStartDate = subscription?.start_date 
    ? startOfDay(parseISO(subscription.start_date))
    : null;

  const subscriptionStartMonth = subscriptionStartDate 
    ? format(subscriptionStartDate, 'yyyy-MM')
    : null;

  /**
   * Validates if a date is allowed for entry
   * Rules:
   * 1. Cannot be in the future
   * 2. Cannot be before subscription start date
   * 3. Cannot be in a month before subscription start month
   */
  const validateDate = (dateStr: string): DateValidationResult => {
    const entryDate = startOfDay(parseISO(dateStr));
    const entryMonth = format(entryDate, 'yyyy-MM');

    // Rule 1: No future dates
    if (isAfter(entryDate, today)) {
      return {
        isValid: false,
        error: language === 'bn' 
          ? 'ভবিষ্যতের তারিখে এন্ট্রি করা যাবে না'
          : 'Cannot enter data for future dates',
      };
    }

    // Rule 2: Check subscription start date
    if (subscriptionStartDate && isBefore(entryDate, subscriptionStartDate)) {
      return {
        isValid: false,
        error: language === 'bn'
          ? `সাবস্ক্রিপশন শুরুর তারিখ (${format(subscriptionStartDate, 'dd/MM/yyyy')}) এর আগে এন্ট্রি করা যাবে না`
          : `Cannot enter data before subscription start date (${format(subscriptionStartDate, 'dd/MM/yyyy')})`,
      };
    }

    // Rule 3: Check subscription start month
    if (subscriptionStartMonth && entryMonth < subscriptionStartMonth) {
      return {
        isValid: false,
        error: language === 'bn'
          ? 'সাবস্ক্রিপশন শুরুর মাসের আগে কোনো মাসে এন্ট্রি করা যাবে না'
          : 'Cannot enter data for months before subscription start month',
      };
    }

    return { isValid: true, error: null };
  };

  /**
   * Get maximum allowed date (today)
   */
  const getMaxDate = (): string => {
    return todayStr;
  };

  /**
   * Get minimum allowed date (subscription start date or null)
   */
  const getMinDate = (): string | null => {
    if (!subscriptionStartDate) return null;
    return format(subscriptionStartDate, 'yyyy-MM-dd');
  };

  /**
   * Check if a month is valid for viewing/filtering
   */
  const isMonthValid = (monthStr: string): boolean => {
    if (!subscriptionStartMonth) return true;
    return monthStr >= subscriptionStartMonth;
  };

  /**
   * Filter available months to only show valid ones
   */
  const filterValidMonths = (months: { value: string; label: string }[]): { value: string; label: string }[] => {
    if (!subscriptionStartMonth) return months;
    return months.filter(m => m.value >= subscriptionStartMonth);
  };

  return {
    validateDate,
    getMaxDate,
    getMinDate,
    isMonthValid,
    filterValidMonths,
    subscriptionStartDate,
    subscriptionStartMonth,
    today,
    todayStr,
  };
}

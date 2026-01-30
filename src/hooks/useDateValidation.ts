import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, parseISO, isBefore, startOfDay, isAfter, startOfMonth } from 'date-fns';

interface DateValidationResult {
  isValid: boolean;
  error: string | null;
}

export function useDateValidation() {
  const { subscription } = useAuth();
  const { language } = useLanguage();

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  // Get subscription start date (or default to null if no subscription)
  const subscriptionStartDate = subscription?.start_date 
    ? startOfDay(parseISO(subscription.start_date))
    : null;

  // Get the FIRST DAY of the subscription month - this is the actual minimum date
  // Users can enter data for the entire month they subscribed in
  const subscriptionMonthStart = subscriptionStartDate 
    ? startOfMonth(subscriptionStartDate)
    : null;

  const subscriptionStartMonth = subscriptionStartDate 
    ? format(subscriptionStartDate, 'yyyy-MM')
    : null;

  /**
   * Validates if a date is allowed for entry
   * Rules:
   * 1. Cannot be in the future
   * 2. Cannot be before the first day of subscription start month
   */
  const validateDate = (dateStr: string): DateValidationResult => {
    // Handle empty or invalid date strings
    if (!dateStr || dateStr.trim() === '') {
      return {
        isValid: false,
        error: language === 'bn' 
          ? 'তারিখ নির্বাচন করুন'
          : 'Please select a date',
      };
    }

    const entryDate = startOfDay(parseISO(dateStr));
    
    // Check if parsed date is valid
    if (isNaN(entryDate.getTime())) {
      return {
        isValid: false,
        error: language === 'bn' 
          ? 'অবৈধ তারিখ'
          : 'Invalid date',
      };
    }

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

    // Rule 2: Check subscription start month (allow full month)
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
   * Get minimum allowed date (first day of subscription month)
   */
  const getMinDate = (): string | null => {
    if (!subscriptionMonthStart) return null;
    return format(subscriptionMonthStart, 'yyyy-MM-dd');
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

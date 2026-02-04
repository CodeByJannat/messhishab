import { AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface ReadOnlyBannerProps {
  expiredDaysAgo: number;
  readOnlyMonths: number;
}

export function ReadOnlyBanner({ expiredDaysAgo, readOnlyMonths }: ReadOnlyBannerProps) {
  const { language } = useLanguage();
  const remainingDays = (readOnlyMonths * 30) - expiredDaysAgo;

  return (
    <Alert variant="destructive" className="mb-6 border-warning/50 bg-warning/10">
      <Lock className="h-4 w-4" />
      <AlertTitle className="text-warning-foreground">
        {language === 'bn' ? 'শুধুমাত্র দেখার মোড' : 'Read-Only Mode'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
        <span className="text-muted-foreground">
          {language === 'bn'
            ? `আপনার সাবস্ক্রিপশন শেষ হয়ে গেছে। আপনি আরও ${remainingDays} দিন ডেটা দেখতে পারবেন। এডিট করতে সাবস্ক্রাইব করুন।`
            : `Your subscription has expired. You can view data for ${remainingDays} more days. Subscribe to edit.`}
        </span>
        <Link to="/manager/subscription">
          <Button size="sm" variant="default" className="shrink-0">
            {language === 'bn' ? 'সাবস্ক্রাইব করুন' : 'Subscribe Now'}
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}

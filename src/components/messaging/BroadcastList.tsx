import { memo } from 'react';
import { Users, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface Broadcast {
  id: string;
  message: string;
  created_at: string;
}

interface BroadcastListProps {
  broadcasts: Broadcast[];
  isLoading?: boolean;
}

export const BroadcastList = memo(function BroadcastList({
  broadcasts,
  isLoading = false,
}: BroadcastListProps) {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/50 animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <Megaphone className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {language === 'bn' ? 'কোনো গ্রুপ মেসেজ নেই' : 'No broadcast messages'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {broadcasts.map((broadcast) => (
          <Card key={broadcast.id} className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">
                      {language === 'bn' ? 'সকলের জন্য' : 'To Everyone'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(broadcast.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{broadcast.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
});

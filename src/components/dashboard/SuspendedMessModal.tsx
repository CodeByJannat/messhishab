import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuspendedMessModalProps {
  isOpen: boolean;
  suspendReason?: string | null;
  onContactAdmin: () => void;
}

export function SuspendedMessModal({ isOpen, suspendReason, onContactAdmin }: SuspendedMessModalProps) {
  const { language } = useLanguage();

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-md border-destructive/20 bg-background/95 backdrop-blur-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-bold text-destructive">
            {language === 'bn' ? 'মেস সাসপেন্ড করা হয়েছে' : 'Mess Suspended'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {language === 'bn' 
              ? 'আপনার মেস অ্যাকাউন্ট সাসপেন্ড করা হয়েছে। ড্যাশবোর্ড অ্যাক্সেস করতে অ্যাডমিনের সাথে যোগাযোগ করুন।'
              : 'Your mess account has been suspended. Please contact admin to restore access to your dashboard.'}
          </DialogDescription>
        </DialogHeader>

        {suspendReason && (
          <div className="mt-4 p-4 bg-destructive/5 rounded-xl border border-destructive/20">
            <p className="text-sm font-medium text-foreground mb-1">
              {language === 'bn' ? 'সাসপেন্ডের কারণ:' : 'Reason for suspension:'}
            </p>
            <p className="text-sm text-muted-foreground">{suspendReason}</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button 
            onClick={onContactAdmin}
            className="w-full rounded-xl"
            size="lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            {language === 'bn' ? 'অ্যাডমিনের সাথে যোগাযোগ করুন' : 'Contact Admin'}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            {language === 'bn' ? 'অথবা ইমেইল করুন:' : 'Or email us at:'}
            <a 
              href="mailto:hishabmess@gmail.com" 
              className="block text-primary hover:underline mt-1"
            >
              hishabmess@gmail.com
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

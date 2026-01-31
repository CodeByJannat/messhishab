import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Loader2 } from 'lucide-react';

interface MessNameSetupModalProps {
  isOpen: boolean;
  messId: string;
}

export function MessNameSetupModal({ isOpen, messId }: MessNameSetupModalProps) {
  const { language } = useLanguage();
  const { refreshMess } = useAuth();
  const { toast } = useToast();
  
  const [messName, setMessName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = messName.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      // Call the finalize_mess_setup function to set name AND generate Mess ID
      const { error } = await supabase.rpc('finalize_mess_setup', {
        p_mess_uuid: messId,
        p_mess_name: messName.trim(),
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'মেসের নাম সেট করা হয়েছে' 
          : 'Mess name has been set',
      });

      // Refresh immediately to go to dashboard
      await refreshMess();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        hideCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Home className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {language === 'bn' ? 'মেসের নাম সেট করুন' : 'Set Your Mess Name'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'bn' 
              ? 'শুরু করার আগে আপনার মেসের একটি নাম দিন। এটি পরে সেটিংস থেকে পরিবর্তন করা যাবে।'
              : 'Give your mess a name before getting started. You can change this later from settings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="mess-name">
              {language === 'bn' ? 'মেসের নাম' : 'Mess Name'}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="mess-name"
              placeholder={language === 'bn' ? 'যেমন: ফ্রেন্ডস মেস' : 'e.g., Friends Mess'}
              value={messName}
              onChange={(e) => setMessName(e.target.value)}
              className="h-12 rounded-xl"
              autoFocus
            />
            {messName.length > 0 && messName.trim().length < 2 && (
              <p className="text-sm text-destructive">
                {language === 'bn' ? 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' : 'Name must be at least 2 characters'}
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {language === 'bn' ? 'সেটআপ হচ্ছে...' : 'Setting up...'}
              </>
            ) : (
              language === 'bn' ? 'সেভ করুন এবং শুরু করুন' : 'Save & Get Started'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

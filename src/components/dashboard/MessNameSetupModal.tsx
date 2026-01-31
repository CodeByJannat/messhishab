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
import { Home, Loader2, CheckCircle, Copy } from 'lucide-react';

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
  const [isComplete, setIsComplete] = useState(false);
  const [generatedMessId, setGeneratedMessId] = useState<string | null>(null);

  const isValid = messName.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      // Call the finalize_mess_setup function to set name AND generate Mess ID
      const { data, error } = await supabase.rpc('finalize_mess_setup', {
        p_mess_uuid: messId,
        p_mess_name: messName.trim(),
      });

      if (error) throw error;

      // data contains the generated Mess ID
      setGeneratedMessId(data);
      setIsComplete(true);

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'মেসের নাম সেট করা হয়েছে' 
          : 'Mess name has been set',
      });

      // Wait a moment to show the success state, then refresh
      setTimeout(async () => {
        await refreshMess();
      }, 2000);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const copyMessId = () => {
    if (generatedMessId) {
      navigator.clipboard.writeText(generatedMessId);
      toast({
        title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
        description: generatedMessId,
      });
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
        {!isComplete ? (
          <>
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
          </>
        ) : (
          // Success state - show generated Mess ID
          <div className="text-center py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">
              {language === 'bn' ? 'সেটআপ সম্পন্ন!' : 'Setup Complete!'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'bn' 
                ? 'আপনার মেস আইডি তৈরি হয়েছে। মেম্বাররা এই আইডি দিয়ে লগইন করবে।'
                : 'Your Mess ID has been generated. Members will use this ID to login.'}
            </p>
            
            <div className="bg-muted/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-1">
                {language === 'bn' ? 'মেস আইডি' : 'Mess ID'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary">
                  {generatedMessId}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyMessId}
                  className="h-8 w-8"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {language === 'bn' ? 'ড্যাশবোর্ডে নিয়ে যাচ্ছে...' : 'Redirecting to dashboard...'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

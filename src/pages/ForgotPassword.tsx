import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Globe, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          redirectUrl: `${window.location.origin}/reset-password`,
          language,
        },
      });
      
      if (response.error) throw response.error;
      
      setIsEmailSent(true);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে' 
          : 'Password reset link has been sent to your email',
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>{language === 'bn' ? 'লগইনে ফিরুন' : 'Back to Login'}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-xl"
          >
            <Globe className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/favicon.png" alt="Mess Hishab" className="w-12 h-12 rounded-xl" />
            <span className="font-bold text-2xl text-foreground">Mess Hishab</span>
          </div>

          {!isEmailSent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {language === 'bn' 
                    ? 'আপনার ইমেইল দিন, আমরা একটি রিসেট লিংক পাঠাব' 
                    : 'Enter your email and we\'ll send you a reset link'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'bn' ? 'ইমেইল' : 'Email'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="rounded-xl"
                    required
                  />
                </div>
                <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                  {isLoading 
                    ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') 
                    : (language === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link')}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {language === 'bn' ? 'ইমেইল পাঠানো হয়েছে!' : 'Email Sent!'}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                {language === 'bn' 
                  ? `আমরা ${email} এ একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।` 
                  : `We've sent a password reset link to ${email}. Please check your inbox.`}
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                {language === 'bn' 
                  ? 'লিংকটি ১ ঘন্টার মধ্যে মেয়াদ শেষ হবে।' 
                  : 'The link will expire in 1 hour.'}
              </p>
              <Button 
                variant="outline" 
                className="w-full rounded-xl"
                onClick={() => setIsEmailSent(false)}
              >
                {language === 'bn' ? 'আবার পাঠান' : 'Send Again'}
              </Button>
            </div>
          )}

          <p className="text-center text-muted-foreground mt-6 text-sm">
            {language === 'bn' ? 'পাসওয়ার্ড মনে আছে?' : 'Remember your password?'}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {language === 'bn' ? 'লগইন করুন' : 'Login'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

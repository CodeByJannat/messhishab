import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sun, Moon, Globe, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isValidEmailDomain, getEmailDomainError, isValidBangladeshPhone, getPhoneError } from '@/lib/validation';

export default function Register() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email domain
    if (!isValidEmailDomain(email)) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: getEmailDomainError(language),
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number
    if (!isValidBangladeshPhone(phone)) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: getPhoneError(language),
        variant: 'destructive',
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'শর্তাবলী মেনে নিন' : 'Please agree to terms and conditions',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      
      // Send branded welcome email (fire and forget - don't block registration)
      supabase.functions.invoke('send-welcome-email', {
        body: { 
          email, 
          messId: '', // Will show "Check your dashboard" in email
          language 
        },
      }).catch(err => console.error('Welcome email error:', err));
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'রেজিস্ট্রেশন সফল হয়েছে। লগইন করুন।' : 'Registration successful. Please login.',
      });
      
      navigate('/login');
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
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>{language === 'bn' ? 'হোম' : 'Home'}</span>
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

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-6">
          <h1 className="text-xl font-bold text-center text-foreground mb-4">
            {t('auth.register')}
          </h1>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="rounded-xl h-9"
                required
              />
              <p className="text-xs text-muted-foreground">
                Gmail, Outlook, Yahoo, Proton, iCloud
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">{language === 'bn' ? 'ফোন নম্বর' : 'Phone'}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setPhone(value);
                }}
                placeholder="01XXXXXXXXX"
                className="rounded-xl h-9"
                maxLength={11}
                required
              />
              {phone && phone.length !== 11 && (
                <p className="text-xs text-destructive">
                  {language === 'bn' ? `${phone.length}/১১ সংখ্যা` : `${phone.length}/11 digits`}
                </p>
              )}
              {phone && phone.length > 0 && !phone.startsWith('01') && (
                <p className="text-xs text-destructive">
                  {language === 'bn' ? '০১ দিয়ে শুরু করুন' : 'Must start with 01'}
                </p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-sm">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-9"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language === 'bn' ? (
                  <>
                    আমি{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      শর্তাবলী
                    </Link>
                    {' '}ও{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      প্রাইভেসি পলিসি
                    </Link>
                    {' '}মানতে সম্মত
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </>
                )}
              </label>
            </div>

            <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('auth.register')}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-4">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('auth.loginHere')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

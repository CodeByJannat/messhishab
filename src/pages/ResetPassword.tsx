import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Globe, ArrowLeft, Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Also listen for auth state changes (recovery token from URL)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidSession(true);
          setIsCheckingSession(false);
        }
      });

      // Check if already in a recovery session
      if (session) {
        setIsValidSession(true);
      }
      setIsCheckingSession(false);

      return () => subscription.unsubscribe();
    };

    checkSession();
  }, []);

  // Password strength checker
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: '', color: '' };
    if (pass.length < 6) return { strength: 1, label: language === 'bn' ? 'দুর্বল' : 'Weak', color: 'bg-red-500' };
    if (pass.length < 8) return { strength: 2, label: language === 'bn' ? 'মাঝারি' : 'Fair', color: 'bg-yellow-500' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { strength: 4, label: language === 'bn' ? 'শক্তিশালী' : 'Strong', color: 'bg-green-500' };
    }
    return { strength: 3, label: language === 'bn' ? 'ভালো' : 'Good', color: 'bg-blue-500' };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters',
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

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'আপনার পাসওয়ার্ড আপডেট হয়েছে' : 'Your password has been updated',
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">M</span>
            </div>
            <span className="font-bold text-2xl text-foreground">MessHishab</span>
          </div>

          {!isValidSession ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {language === 'bn' ? 'অবৈধ লিংক' : 'Invalid Link'}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                {language === 'bn' 
                  ? 'এই পাসওয়ার্ড রিসেট লিংকটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে।' 
                  : 'This password reset link is invalid or has expired.'}
              </p>
              <Link to="/forgot-password">
                <Button className="w-full btn-primary-glow">
                  {language === 'bn' ? 'নতুন লিংক অনুরোধ করুন' : 'Request New Link'}
                </Button>
              </Link>
            </div>
          ) : isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {language === 'bn' ? 'পাসওয়ার্ড আপডেট হয়েছে!' : 'Password Updated!'}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                {language === 'bn' 
                  ? 'আপনার পাসওয়ার্ড সফলভাবে আপডেট হয়েছে। লগইন পেজে রিডাইরেক্ট হচ্ছে...' 
                  : 'Your password has been successfully updated. Redirecting to login...'}
              </p>
              <Link to="/login">
                <Button className="w-full btn-primary-glow">
                  {language === 'bn' ? 'লগইন করুন' : 'Go to Login'}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  {language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {language === 'bn' 
                    ? 'আপনার নতুন পাসওয়ার্ড দিন' 
                    : 'Enter your new password'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className={`text-xs ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordsMatch 
                        ? (language === 'bn' ? '✓ পাসওয়ার্ড মিলেছে' : '✓ Passwords match')
                        : (language === 'bn' ? '✗ পাসওয়ার্ড মিলছে না' : '✗ Passwords do not match')}
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {language === 'bn' 
                    ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' 
                    : 'Password must be at least 6 characters'}
                </p>

                <Button 
                  type="submit" 
                  className="w-full btn-primary-glow" 
                  disabled={isLoading || !passwordsMatch || password.length < 6}
                >
                  {isLoading 
                    ? (language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') 
                    : (language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password')}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

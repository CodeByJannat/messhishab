import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ValidationTooltip } from '@/components/ui/validation-tooltip';
import { Sun, Moon, Globe, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isValidEmailDomain, getEmailDomainError, isValidBangladeshPhone, getPhoneError } from '@/lib/validation';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

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
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  // Turnstile states
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);

  // Fetch Turnstile site key
  useEffect(() => {
    const fetchTurnstileKey = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-turnstile-key');
        if (data?.siteKey) {
          setTurnstileSiteKey(data.siteKey);
        }
      } catch (error) {
        console.error('Failed to fetch Turnstile key:', error);
      }
    };
    fetchTurnstileKey();
  }, []);

  // Load Turnstile script
  useEffect(() => {
    if (!turnstileSiteKey) return;
    
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [turnstileSiteKey]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle Turnstile callback
  useEffect(() => {
    (window as any).onTurnstileCallback = (token: string) => {
      setTurnstileToken(token);
    };
    return () => {
      delete (window as any).onTurnstileCallback;
    };
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  // Validation messages
  const emailValidationMessage = language === 'bn' 
    ? 'Gmail, Outlook, Hotmail, Yahoo, Proton Mail, iCloud ইমেইল গ্রহণযোগ্য' 
    : 'Gmail, Outlook, Hotmail, Yahoo, Proton Mail, iCloud emails accepted';
  
  const phoneValidationMessage = language === 'bn'
    ? 'বাংলাদেশী নম্বর, ০১ দিয়ে শুরু, ১১ সংখ্যা'
    : 'Bangladesh number, starts with 01, 11 digits';

  const passwordValidationMessage = language === 'bn'
    ? 'কমপক্ষে ৬ অক্ষর'
    : 'Minimum 6 characters';

  // Email validation error
  const getEmailError = () => {
    if (!email) return null;
    if (!email.includes('@')) return null;
    if (!isValidEmailDomain(email)) {
      return language === 'bn' ? 'অগ্রহণযোগ্য ইমেইল ডোমেইন' : 'Invalid email domain';
    }
    return null;
  };

  // Phone validation error
  const getPhoneValidationError = () => {
    if (!phone) return null;
    if (phone.length > 0 && !phone.startsWith('01')) {
      return language === 'bn' ? '০১ দিয়ে শুরু করুন' : 'Must start with 01';
    }
    if (phone.length > 0 && phone.length < 11) {
      return language === 'bn' ? `${phone.length}/১১ সংখ্যা` : `${phone.length}/11 digits`;
    }
    return null;
  };

  const handleSendOtp = async () => {
    if (!email || !isValidEmailDomain(email)) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: getEmailDomainError(language),
        variant: 'destructive',
      });
      return;
    }

    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: { email, language },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setOtpSent(true);
      setOtpCountdown(300); // 5 minutes
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'OTP পাঠানো হয়েছে' : 'OTP sent to your email',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (value: string) => {
    if (value.length !== 6) return;
    
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { email, otp: value },
      });

      if (error) throw error;
      if (!data.valid) throw new Error(data.error || 'Invalid OTP');

      setOtpVerified(true);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'ইমেইল ভেরিফাই হয়েছে' : 'Email verified successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setOtp('');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check OTP verification
    if (!otpVerified) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ইমেইল ভেরিফাই করুন' : 'Please verify your email first',
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

    // Check Turnstile
    if (!turnstileToken) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'রোবট ভেরিফিকেশন সম্পন্ন করুন' : 'Please complete the verification',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if email already exists in profiles table
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (existingEmail) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'এই ইমেইল দিয়ে আগে রেজিস্ট্রেশন করা হয়েছে' : 'This email is already registered',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Check if phone already exists in profiles table
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();
      
      if (existingPhone) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'এই ফোন নম্বর দিয়ে আগে রেজিস্ট্রেশন করা হয়েছে' : 'This phone number is already registered',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;

      // Directly save phone to profiles table after user creation
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: phone })
          .eq('user_id', data.user.id);
        
        if (profileError) {
          console.error('Failed to save phone:', profileError);
        }
      }
      
      // Send branded welcome email
      supabase.functions.invoke('send-welcome-email', {
        body: { 
          email, 
          messId: '',
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

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-xl">
            <Globe className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="glass-card p-5">
          <h1 className="text-lg font-bold text-center text-foreground mb-4">
            {t('auth.register')}
          </h1>

          <form onSubmit={handleRegister} className="space-y-3">
            {/* Email with Send OTP */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label htmlFor="email" className="text-sm">{t('auth.email')}</Label>
                <ValidationTooltip message={emailValidationMessage} />
              </div>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtp('');
                  }}
                  placeholder="example@gmail.com"
                  className="rounded-xl h-9 flex-1"
                  disabled={otpVerified}
                  required
                />
                <Button
                  type="button"
                  variant={otpVerified ? "outline" : "default"}
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || otpVerified || !email || !isValidEmailDomain(email) || otpCountdown > 0}
                  className="rounded-xl h-9 px-3 whitespace-nowrap"
                >
                  {sendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : otpVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : otpCountdown > 0 ? (
                    formatCountdown(otpCountdown)
                  ) : (
                    language === 'bn' ? 'OTP' : 'Send OTP'
                  )}
                </Button>
              </div>
              {getEmailError() && (
                <p className="text-xs text-destructive">{getEmailError()}</p>
              )}
            </div>

            {/* OTP Input */}
            {otpSent && !otpVerified && (
              <div className="space-y-1">
                <Label className="text-sm">{language === 'bn' ? 'OTP কোড' : 'OTP Code'}</Label>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={(value) => {
                      setOtp(value);
                      if (value.length === 6) {
                        handleVerifyOtp(value);
                      }
                    }}
                    disabled={verifyingOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {verifyingOtp && (
                  <div className="flex justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            {/* Phone */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label htmlFor="phone" className="text-sm">{language === 'bn' ? 'ফোন নম্বর' : 'Phone'}</Label>
                <ValidationTooltip message={phoneValidationMessage} />
              </div>
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
              {getPhoneValidationError() && (
                <p className="text-xs text-destructive">{getPhoneValidationError()}</p>
              )}
            </div>
            
            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label htmlFor="password" className="text-sm">{t('auth.password')}</Label>
                <ValidationTooltip message={passwordValidationMessage} />
              </div>
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
            
            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirm-password" className="text-sm">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-9"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">
                  {language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                {language === 'bn' ? (
                  <>
                    আমি{' '}
                    <Link to="/terms" className="text-primary hover:underline">শর্তাবলী</Link>
                    {' '}ও{' '}
                    <Link to="/privacy" className="text-primary hover:underline">প্রাইভেসি পলিসি</Link>
                    {' '}মানতে সম্মত
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </>
                )}
              </label>
            </div>

            {/* Turnstile */}
            {turnstileSiteKey && (
              <div className="flex justify-center">
                <div
                  className="cf-turnstile"
                  data-sitekey={turnstileSiteKey}
                  data-callback="onTurnstileCallback"
                  data-theme={theme}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full btn-primary-glow" 
              disabled={isLoading || !otpVerified || !turnstileToken}
            >
              {isLoading ? t('common.loading') : t('auth.register')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
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

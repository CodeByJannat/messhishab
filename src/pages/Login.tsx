import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, Moon, Globe, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Manager login state
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  
  // Member login state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: managerEmail,
        password: managerPassword,
      });
      
      if (error) throw error;
      
      // Check user role to determine redirect
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লগইন সফল হয়েছে' : 'Login successful',
      });
      
      // CRITICAL: Use window.location.href for immediate redirect
      if (roleData?.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (roleData?.role === 'member') {
        window.location.href = '/member/portal';
      } else {
        window.location.href = '/manager/dashboard';
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: memberEmail,
        password: memberPassword,
      });

      if (error) throw error;
      
      // Check if user is a member
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      if (roleData?.role !== 'member') {
        await supabase.auth.signOut();
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' 
            ? 'এই অ্যাকাউন্ট মেম্বার নয়। ম্যানেজার ট্যাব থেকে লগইন করুন।' 
            : 'This account is not a member. Please use Manager tab to login.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Check if member is active
      const { data: member } = await supabase
        .from('members')
        .select('is_active, mess_id')
        .eq('user_id', data.user.id)
        .single();

      if (!member?.is_active) {
        await supabase.auth.signOut();
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' 
            ? 'আপনার অ্যাকাউন্ট নিষ্ক্রিয়। ম্যানেজারের সাথে যোগাযোগ করুন।' 
            : 'Your account is inactive. Please contact your manager.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Check mess status
      const { data: mess } = await supabase
        .from('messes')
        .select('status')
        .eq('id', member.mess_id)
        .single();

      if (mess?.status === 'suspended') {
        await supabase.auth.signOut();
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' 
            ? 'এই মেস সাসপেন্ড করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।' 
            : 'This mess is suspended. Please contact admin.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, end_date')
        .eq('mess_id', member.mess_id)
        .single();

      if (!subscription || subscription.status !== 'active' || new Date(subscription.end_date) < new Date()) {
        await supabase.auth.signOut();
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' 
            ? 'সাবস্ক্রিপশন মেয়াদ উত্তীর্ণ। ম্যানেজারের সাথে যোগাযোগ করুন।' 
            : 'Subscription expired. Please contact your manager.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
        
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লগইন সফল হয়েছে' : 'Login successful',
      });
      
      window.location.href = '/member/portal';
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'ইমেইল বা পাসওয়ার্ড ভুল' 
          : 'Invalid email or password',
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

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">M</span>
            </div>
            <span className="font-bold text-2xl text-foreground">MessHishab</span>
          </div>

          <Tabs defaultValue="manager" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manager">{t('auth.managerLogin')}</TabsTrigger>
              <TabsTrigger value="member">{t('auth.memberLogin')}</TabsTrigger>
            </TabsList>

            <TabsContent value="manager">
              <form onSubmit={handleManagerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manager-email">{t('auth.email')}</Label>
                  <Input
                    id="manager-email"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="manager-password"
                      type={showPassword ? 'text' : 'password'}
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      className="rounded-xl pr-10"
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
                </div>
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="member">
              <form onSubmit={handleMemberLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-email">{t('auth.email')}</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="member-password"
                      type={showPassword ? 'text' : 'password'}
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      className="rounded-xl pr-10"
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
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' 
                    ? 'আপনার ম্যানেজার থেকে পাওয়া ইমেইল ও পাসওয়ার্ড দিন' 
                    : 'Use the email and password provided by your manager'}
                </p>
                <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-muted-foreground mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:underline">
              {t('auth.registerHere')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

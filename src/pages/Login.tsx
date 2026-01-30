import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sun, Moon, Globe, ArrowLeft, Eye, EyeOff, Users, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'manager' | 'member'>('manager');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Wait a moment for session to be fully set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check user role to determine redirect
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (roleError) {
        console.error('Role fetch error:', roleError);
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'ব্যবহারকারী রোল পাওয়া যায়নি' : 'User role not found');
      }
      
      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'ব্যবহারকারী রোল পাওয়া যায়নি' : 'User role not found');
      }
      
      const role = roleData?.role;
      
      // Only allow manager or admin roles through manager tab
      if (role !== 'manager' && role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'এই অ্যাকাউন্ট ম্যানেজার/এডমিন নয়। মেম্বার ট্যাব ব্যবহার করুন।' : 'This account is not a manager/admin. Please use the Member tab.');
      }
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লগইন সফল হয়েছে' : 'Login successful',
      });
      
      // Redirect based on role
      if (role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/manager/dashboard';
      }
    } catch (error: any) {
      console.error('Login error:', error);
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
        email,
        password,
      });
      
      if (error) throw error;
      
      // Wait a moment for session to be fully set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check user role - must be member
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (roleError) {
        console.error('Role fetch error:', roleError);
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'ব্যবহারকারী রোল পাওয়া যায়নি' : 'User role not found');
      }
      
      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'ব্যবহারকারী রোল পাওয়া যায়নি' : 'User role not found');
      }
      
      const role = roleData.role;
      
      // Only allow member role through member tab
      if (role !== 'member') {
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'এই অ্যাকাউন্ট মেম্বার নয়। ম্যানেজার ট্যাব ব্যবহার করুন।' : 'This account is not a member. Please use the Manager tab.');
      }
      
      // Verify member is active
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, is_active')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (memberError || !memberData) {
        await supabase.auth.signOut();
        throw new Error(language === 'bn' ? 'মেম্বার অ্যাকাউন্ট সক্রিয় নেই' : 'Member account is not active');
      }
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লগইন সফল হয়েছে' : 'Login successful',
      });
      
      window.location.href = '/member/dashboard';
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-center mb-4">
            {language === 'bn' ? 'লগইন করুন' : 'Login'}
          </h2>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manager' | 'member')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="manager" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
              </TabsTrigger>
              <TabsTrigger value="member" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {language === 'bn' ? 'মেম্বার' : 'Member'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manager">
              <form onSubmit={handleManagerLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="manager-email" className="text-sm">{t('auth.email')}</Label>
                  <Input
                    id="manager-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="rounded-xl h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manager-password" className="text-sm">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="manager-password"
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
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>

              <p className="text-center text-muted-foreground text-sm mt-4">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-primary hover:underline">
                  {t('auth.registerHere')}
                </Link>
              </p>
            </TabsContent>

            <TabsContent value="member">
              <form onSubmit={handleMemberLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="member-email" className="text-sm">{t('auth.email')}</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="rounded-xl h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="member-password" className="text-sm">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="member-password"
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
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>

              <p className="text-center text-muted-foreground text-xs mt-4">
                {language === 'bn' 
                  ? 'মেম্বার অ্যাকাউন্ট ম্যানেজার দ্বারা তৈরি করা হয়' 
                  : 'Member accounts are created by managers'}
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}

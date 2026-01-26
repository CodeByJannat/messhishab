import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, Moon, Globe, ArrowLeft, Eye, EyeOff, User, ChevronLeft } from 'lucide-react';
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
  const [messId, setMessId] = useState('');
  const [messPassword, setMessPassword] = useState('');

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
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লগইন সফল হয়েছে' : 'Login successful',
      });
      
      navigate('/dashboard');
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

  const [memberLoginStep, setMemberLoginStep] = useState<'credentials' | 'select-member' | 'pin'>('credentials');
  const [availableMembers, setAvailableMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [memberPin, setMemberPin] = useState('');
  const [messInfo, setMessInfo] = useState<{ id: string; mess_id: string; name: string | null } | null>(null);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('member-login', {
        body: { mess_id: messId, mess_password: messPassword },
      });

      if (error) throw error;
      
      if (data.success) {
        setAvailableMembers(data.members);
        setMessInfo(data.mess);
        setMemberLoginStep('select-member');
        toast({
          title: language === 'bn' ? 'সফল!' : 'Success!',
          description: language === 'bn' ? 'এখন আপনার নাম সিলেক্ট করুন' : 'Now select your name',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'Invalid MessID or MessPassword',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberPinVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('member-verify-pin', {
        body: { member_id: selectedMember.id, pin: memberPin },
      });

      if (error) throw error;
      
      if (data.success) {
        // Store member session in localStorage
        localStorage.setItem('member_session', JSON.stringify({
          member: data.member,
          mess: data.mess,
          subscription: data.subscription,
          session_token: data.session_token,
        }));
        
        toast({
          title: language === 'bn' ? 'সফল!' : 'Success!',
          description: language === 'bn' ? 'লগইন সফল হয়েছে' : 'Login successful',
        });
        
        navigate('/member');
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'Invalid PIN',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = (member: { id: string; name: string }) => {
    setSelectedMember(member);
    setMemberLoginStep('pin');
  };

  const handleBackToCredentials = () => {
    setMemberLoginStep('credentials');
    setAvailableMembers([]);
    setSelectedMember(null);
    setMemberPin('');
    setMessInfo(null);
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
              {memberLoginStep === 'credentials' && (
                <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mess-id">{t('auth.messId')}</Label>
                    <Input
                      id="mess-id"
                      type="text"
                      value={messId}
                      onChange={(e) => setMessId(e.target.value)}
                      placeholder="MESS-XXXXXX"
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mess-password">{t('auth.messPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="mess-password"
                        type={showPassword ? 'text' : 'password'}
                        value={messPassword}
                        onChange={(e) => setMessPassword(e.target.value)}
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
                  <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('auth.login')}
                  </Button>
                </form>
              )}

              {memberLoginStep === 'select-member' && (
                <div className="space-y-4">
                  <button
                    onClick={handleBackToCredentials}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {language === 'bn' ? 'পেছনে' : 'Back'}
                  </button>
                  
                  {messInfo && (
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-center">
                      <p className="font-medium text-foreground">{messInfo.name || messInfo.mess_id}</p>
                      <p className="text-xs text-muted-foreground">{messInfo.mess_id}</p>
                    </div>
                  )}
                  
                  <p className="text-sm text-center text-muted-foreground">
                    {language === 'bn' ? 'আপনার নাম সিলেক্ট করুন' : 'Select your name'}
                  </p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="w-full p-3 rounded-xl border border-border bg-background hover:bg-accent hover:border-primary transition-all flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{member.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  {availableMembers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      {language === 'bn' ? 'কোনো মেম্বার পাওয়া যায়নি' : 'No members found'}
                    </p>
                  )}
                </div>
              )}

              {memberLoginStep === 'pin' && selectedMember && (
                <form onSubmit={handleMemberPinVerify} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setMemberLoginStep('select-member')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {language === 'bn' ? 'পেছনে' : 'Back'}
                  </button>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-medium text-foreground text-lg">{selectedMember.name}</p>
                    <p className="text-xs text-muted-foreground">{messInfo?.mess_id}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="member-pin">{language === 'bn' ? 'পিন লিখুন' : 'Enter PIN'}</Label>
                    <Input
                      id="member-pin"
                      type="password"
                      value={memberPin}
                      onChange={(e) => setMemberPin(e.target.value)}
                      placeholder="••••••"
                      className="rounded-xl text-center text-xl tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full btn-primary-glow" disabled={isLoading}>
                    {isLoading ? t('common.loading') : (language === 'bn' ? 'যাচাই করুন' : 'Verify')}
                  </Button>
                </form>
              )}
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

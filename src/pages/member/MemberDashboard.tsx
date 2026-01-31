import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Search, Key, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  is_active?: boolean;
}

interface MessSession {
  mess: {
    id: string;
    mess_id: string;
    name: string | null;
    current_month: string;
  };
  members: Member[];
  subscription: {
    type: string;
    status: string;
    end_date: string;
  } | null;
}

export default function MemberDashboard() {
  const { memberSession, isAuthenticated } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [messSession, setMessSession] = useState<MessSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PIN verification modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // If already authenticated with full session, redirect to portal
    if (isAuthenticated && memberSession) {
      navigate('/member/portal');
      return;
    }

    // Check for mess session from login
    const storedMessSession = localStorage.getItem('member_mess_session');
    if (storedMessSession) {
      try {
        const parsed = JSON.parse(storedMessSession);
        setMessSession(parsed);
      } catch (e) {
        localStorage.removeItem('member_mess_session');
        navigate('/login');
      }
    } else {
      // No session at all, redirect to login
      navigate('/login');
    }
  }, [isAuthenticated, memberSession, navigate]);

  const filteredMembers = messSession?.members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleMemberClick = (member: Member) => {
    if (isLocked) {
      toast({
        title: language === 'bn' ? 'সাময়িক লক' : 'Temporarily Locked',
        description: language === 'bn' 
          ? 'অনেকবার ভুল পিন দেওয়ায় সাময়িকভাবে লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।' 
          : 'Too many wrong attempts. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedMember(member);
    setPin('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handlePinVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !messSession) return;

    setIsVerifying(true);
    setPinError('');

    try {
      const { data, error } = await supabase.functions.invoke('member-verify-pin', {
        body: { member_id: selectedMember.id, pin },
      });

      if (error) throw error;

      if (data.success) {
        // Save the verified session to localStorage
        const verifiedSession = {
          member: data.member,
          mess: data.mess,
          subscription: data.subscription,
          session_token: data.session_token,
        };
        localStorage.setItem('member_session', JSON.stringify(verifiedSession));
        
        // Clear the mess session since we now have full member session
        localStorage.removeItem('member_mess_session');
        
        setIsPinModalOpen(false);
        setAttemptCount(0);
        // Use window.location for full page reload to pick up the new session
        window.location.href = '/member/portal';
      }
    } catch (error: any) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      if (newAttemptCount >= 3) {
        setIsLocked(true);
        setIsPinModalOpen(false);
        // Auto unlock after 30 seconds
        setTimeout(() => {
          setIsLocked(false);
          setAttemptCount(0);
        }, 30000);
        
        toast({
          title: language === 'bn' ? 'সাময়িক লক' : 'Temporarily Locked',
          description: language === 'bn' 
            ? '৩ বার ভুল পিন দেওয়ায় ৩০ সেকেন্ডের জন্য লক করা হয়েছে' 
            : 'Locked for 30 seconds due to 3 wrong attempts',
          variant: 'destructive',
        });
      } else {
        setPinError(language === 'bn' ? 'ভুল পিন। আবার চেষ্টা করুন।' : 'Wrong PIN. Try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('member_mess_session');
    localStorage.removeItem('member_session');
    window.location.href = '/login';
  };

  if (!messSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{messSession.mess.name || messSession.mess.mess_id}</h1>
              <p className="text-xs text-muted-foreground">{messSession.mess.mess_id}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            {language === 'bn' ? 'লগআউট' : 'Logout'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'আপনার নাম সিলেক্ট করুন' : 'Select Your Name'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {language === 'bn' 
                ? 'নাম সিলেক্ট করে পিন দিয়ে পোর্টালে প্রবেশ করুন' 
                : 'Select your name and enter PIN to access your portal'}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={language === 'bn' ? 'মেম্বার খুঁজুন...' : 'Search members...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {filteredMembers.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? (language === 'bn' ? 'কোনো ফলাফল নেই' : 'No results found')
                      : (language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card 
                    className="glass-card cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => handleMemberClick(member)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <p className="font-medium text-foreground">{member.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Key className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {isLocked && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">
                {language === 'bn' 
                  ? '৩ বার ভুল পিন দেওয়ায় সাময়িকভাবে লক করা হয়েছে' 
                  : 'Temporarily locked due to 3 wrong attempts'}
              </p>
            </div>
          )}
        </div>

        {/* PIN Verification Modal */}
        <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                {language === 'bn' ? 'পিন যাচাই করুন' : 'Verify PIN'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePinVerify} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium text-foreground text-lg">{selectedMember?.name}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">{language === 'bn' ? 'পিন লিখুন' : 'Enter PIN'}</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="rounded-xl text-center text-xl tracking-widest"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pinError}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full btn-primary-glow" 
                disabled={isVerifying || pin.length < 4}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                {language === 'bn' ? 'যাচাই করুন' : 'Verify'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {language === 'bn' 
                  ? `বাকি চেষ্টা: ${3 - attemptCount}` 
                  : `Attempts remaining: ${3 - attemptCount}`}
              </p>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

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
import { User, Search, Key, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  is_active: boolean;
}

export default function MemberDashboard() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    if (memberSession) {
      fetchMembers();
    }
  }, [memberSession]);

  const fetchMembers = async () => {
    if (!memberSession) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, is_active')
        .eq('mess_id', memberSession.mess.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
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

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMemberClick = (member: Member) => {
    // Check if this is the logged-in member
    if (member.id !== memberSession?.member.id) {
      toast({
        title: language === 'bn' ? 'অনুমতি নেই' : 'Not Allowed',
        description: language === 'bn' 
          ? 'আপনি শুধু নিজের পোর্টাল দেখতে পারবেন' 
          : 'You can only access your own portal',
        variant: 'destructive',
      });
      return;
    }

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
    if (!selectedMember || !memberSession) return;

    setIsVerifying(true);
    setPinError('');

    try {
      const { data, error } = await supabase.functions.invoke('member-verify-pin', {
        body: { member_id: selectedMember.id, pin },
      });

      if (error) throw error;

      if (data.success) {
        setIsPinModalOpen(false);
        setAttemptCount(0);
        navigate('/member/portal');
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

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? `স্বাগতম, ${memberSession?.member.name}!` : `Welcome, ${memberSession?.member.name}!`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' 
              ? 'আপনার নাম সিলেক্ট করে পিন দিয়ে পোর্টালে প্রবেশ করুন' 
              : 'Select your name and enter PIN to access portal'}
          </p>
        </div>

        {/* Mess Info Card */}
        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">
                  {memberSession?.mess.name?.[0] || 'M'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{memberSession?.mess.name || memberSession?.mess.mess_id}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মেস আইডি:' : 'Mess ID:'} {memberSession?.mess.mess_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
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
            filteredMembers.map((member, index) => {
              const isCurrentMember = member.id === memberSession?.member.id;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`glass-card cursor-pointer transition-all hover:border-primary/50 ${
                      isCurrentMember ? 'border-primary/30 bg-primary/5' : ''
                    }`}
                    onClick={() => handleMemberClick(member)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isCurrentMember ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <User className={`w-6 h-6 ${isCurrentMember ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            {isCurrentMember && (
                              <p className="text-xs text-primary">
                                {language === 'bn' ? '(আপনি)' : '(You)'}
                              </p>
                            )}
                          </div>
                        </div>
                        {isCurrentMember && (
                          <div className="flex items-center gap-2 text-primary">
                            <Key className="w-4 h-4" />
                            <span className="text-sm">{language === 'bn' ? 'পিন দিন' : 'Enter PIN'}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
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
      </div>
    </MemberDashboardLayout>
  );
}

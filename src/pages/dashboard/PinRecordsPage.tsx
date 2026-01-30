import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, AlertTriangle, MoreVertical, Edit, RefreshCw, UserX, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberWithPin {
  id: string;
  name: string;
  pin_display: string;
  is_active: boolean;
  created_at: string;
}

export default function PinRecordsPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit PIN modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithPin | null>(null);
  const [newPin, setNewPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset PIN result
  const [resetPinResult, setResetPinResult] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (mess) {
      fetchMembersWithPins();
    }
  }, [mess]);

  const fetchMembersWithPins = async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-member-pins', {
        body: { messId: mess.id },
      });

      if (error) throw error;
      setMembers(data.members || []);
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

  const handleEditPin = (member: MemberWithPin) => {
    setSelectedMember(member);
    setNewPin('');
    setIsEditModalOpen(true);
  };

  const handleSubmitEditPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (newPin.length < 4 || newPin.length > 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পিন ৪-৬ সংখ্যার হতে হবে' : 'PIN must be 4-6 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-member-pin', {
        body: { action: 'edit', memberId: selectedMember.id, newPin },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'পিন আপডেট হয়েছে' : 'PIN updated successfully',
      });

      setIsEditModalOpen(false);
      fetchMembersWithPins();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPin = async (member: MemberWithPin) => {
    setSelectedMember(member);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-member-pin', {
        body: { action: 'reset', memberId: member.id },
      });

      if (error) throw error;

      setResetPinResult(data.newPin);
      setIsResetModalOpen(true);
      fetchMembersWithPins();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: MemberWithPin) => {
    setIsSubmitting(true);
    try {
      const action = member.is_active ? 'suspend' : 'unsuspend';
      const { data, error } = await supabase.functions.invoke('toggle-member-status', {
        body: { memberId: member.id, action },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: member.is_active
          ? (language === 'bn' ? 'মেম্বার সাসপেন্ড করা হয়েছে' : 'Member suspended')
          : (language === 'bn' ? 'মেম্বার আনসাসপেন্ড করা হয়েছে' : 'Member unsuspended'),
      });

      fetchMembersWithPins();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'পিন রেকর্ড' : 'PIN Records'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'মেম্বারদের পিন ম্যানেজ করুন' : 'Manage member PINs'}
          </p>
        </div>

        {/* Warning Card */}
        <Card className="glass-card border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {language === 'bn' ? 'গোপনীয় তথ্য' : 'Sensitive Information'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn'
                    ? 'এই পিনগুলো শুধুমাত্র ম্যানেজার দেখতে পারবে। অন্যদের সাথে শেয়ার করবেন না।'
                    : 'These PINs are only visible to the manager. Do not share with others.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="max-w-sm">
          <Input
            placeholder={language === 'bn' ? 'মেম্বার খুঁজুন...' : 'Search members...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* PIN Records Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? language === 'bn' ? 'কোনো ফলাফল নেই' : 'No results found'
                    : language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'মেম্বার' : 'Member'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'পিন' : 'PIN'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                      <TableHead>{language === 'bn' ? 'যোগ হয়েছে' : 'Added'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border"
                      >
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-center">
                          <code className="bg-muted px-3 py-1 rounded-lg text-lg font-mono">
                            {member.pin_display}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={member.is_active ? 'default' : 'destructive'}>
                            {member.is_active 
                              ? (language === 'bn' ? 'সক্রিয়' : 'Active')
                              : (language === 'bn' ? 'সাসপেন্ড' : 'Suspended')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString(
                            language === 'bn' ? 'bn-BD' : 'en-US'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPin(member)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {language === 'bn' ? 'পিন এডিট করুন' : 'Edit PIN'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPin(member)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {language === 'bn' ? 'পিন রিসেট করুন' : 'Reset PIN'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(member)}
                                className={member.is_active ? 'text-destructive' : 'text-success'}
                              >
                                {member.is_active ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    {language === 'bn' ? 'সাসপেন্ড করুন' : 'Suspend'}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    {language === 'bn' ? 'আনসাসপেন্ড করুন' : 'Unsuspend'}
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit PIN Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'পিন এডিট করুন' : 'Edit PIN'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitEditPin} className="space-y-4">
              <div className="text-center mb-4">
                <p className="font-medium text-foreground">{selectedMember?.name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pin">{language === 'bn' ? 'নতুন পিন (৪-৬ সংখ্যা)' : 'New PIN (4-6 digits)'}</Label>
                <Input
                  id="new-pin"
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="rounded-xl text-center text-xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={isSubmitting || newPin.length < 4}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {language === 'bn' ? 'সেভ করুন' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset PIN Result Modal */}
        <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                {language === 'bn' ? 'নতুন পিন তৈরি হয়েছে' : 'New PIN Generated'}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {selectedMember?.name} {language === 'bn' ? 'এর নতুন পিন:' : "'s new PIN:"}
              </p>
              <code className="block bg-primary/10 text-primary text-3xl font-mono py-4 px-6 rounded-xl">
                {resetPinResult}
              </code>
              <p className="text-sm text-warning">
                {language === 'bn' 
                  ? '⚠️ এই পিনটি সেভ করুন। এটি আবার দেখানো হবে না।'
                  : '⚠️ Save this PIN. It will not be shown again.'}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsResetModalOpen(false)} className="w-full">
                {language === 'bn' ? 'বুঝেছি' : 'Got it'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

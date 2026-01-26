import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  email_encrypted: string | null;
  phone_encrypted: string | null;
  room_number_encrypted: string | null;
  is_active: boolean;
  created_at: string;
}

interface MemberDetails {
  email: string;
  phone: string;
  roomNumber: string;
}

export default function MembersPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isPinVerifying, setIsPinVerifying] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
    pin: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mess) {
      fetchMembers();
    }
  }, [mess]);

  const fetchMembers = async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false });

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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess) return;

    if (formData.pin.length < 4 || formData.pin.length > 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পিন ৪-৬ সংখ্যার হতে হবে' : 'PIN must be 4-6 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call edge function to hash PIN and encrypt data
      const { data, error } = await supabase.functions.invoke('manage-member', {
        body: {
          action: 'create',
          messId: mess.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          roomNumber: formData.roomNumber,
          pin: formData.pin,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেম্বার যোগ হয়েছে' : 'Member added',
      });

      setIsAddOpen(false);
      setFormData({ name: '', email: '', phone: '', roomNumber: '', pin: '' });
      fetchMembers();
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

  const handleVerifyPin = async () => {
    if (!selectedMember) return;
    setIsPinVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: {
          memberId: selectedMember.id,
          pin: pinInput,
        },
      });

      if (error) throw error;

      if (data.success) {
        setMemberDetails({
          email: data.email || '',
          phone: data.phone || '',
          roomNumber: data.roomNumber || '',
        });
        setIsPinOpen(false);
        setIsDetailsOpen(true);
        setPinInput('');
      } else {
        toast({
          title: language === 'bn' ? 'ভুল পিন' : 'Wrong PIN',
          description: language === 'bn' ? 'সঠিক পিন দিন' : 'Please enter correct PIN',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsPinVerifying(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেম্বার মুছে ফেলা হয়েছে' : 'Member deleted',
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openPinDialog = (member: Member) => {
    setSelectedMember(member);
    setPinInput('');
    setIsPinOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'মেম্বার ম্যানেজমেন্ট' : 'Member Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'আপনার মেসের সকল মেম্বার' : 'All members of your mess'}
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-glow">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'bn' ? 'মেম্বার যোগ করুন' : 'Add Member'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'bn' ? 'নতুন মেম্বার যোগ করুন' : 'Add New Member'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'নাম *' : 'Name *'}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={language === 'bn' ? 'মেম্বারের নাম' : 'Member name'}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'রুম নম্বর' : 'Room Number'}</Label>
                  <Input
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder={language === 'bn' ? 'রুম নম্বর' : 'Room number'}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পিন (৪-৬ সংখ্যা) *' : 'PIN (4-6 digits) *'}</Label>
                  <Input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="••••"
                    required
                    maxLength={6}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn'
                      ? 'এই পিন দিয়ে মেম্বারের ব্যক্তিগত তথ্য দেখা যাবে'
                      : 'This PIN will be used to view member personal details'}
                  </p>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {language === 'bn' ? 'যোগ করুন' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Members Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                      <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                      <TableHead>{language === 'bn' ? 'যোগ হয়েছে' : 'Added'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border"
                      >
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.is_active
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {member.is_active
                              ? language === 'bn' ? 'সক্রিয়' : 'Active'
                              : language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPinDialog(member)}
                              className="rounded-xl"
                              title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMember(member.id)}
                              className="rounded-xl text-destructive hover:text-destructive"
                              title={language === 'bn' ? 'মুছুন' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIN Verification Dialog */}
        <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'পিন যাচাই করুন' : 'Verify PIN'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {language === 'bn'
                  ? `${selectedMember?.name} এর তথ্য দেখতে পিন দিন`
                  : `Enter PIN to view ${selectedMember?.name}'s details`}
              </p>
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                maxLength={6}
                className="rounded-xl text-center text-2xl tracking-widest"
                autoFocus
              />
              <Button
                onClick={handleVerifyPin}
                disabled={isPinVerifying || pinInput.length < 4}
                className="w-full"
              >
                {isPinVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {language === 'bn' ? 'যাচাই করুন' : 'Verify'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedMember?.name} - {language === 'bn' ? 'বিস্তারিত' : 'Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                <Input value={memberDetails?.email || '-'} readOnly className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
                <Input value={memberDetails?.phone || '-'} readOnly className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'রুম নম্বর' : 'Room Number'}</Label>
                <Input value={memberDetails?.roomNumber || '-'} readOnly className="rounded-xl" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

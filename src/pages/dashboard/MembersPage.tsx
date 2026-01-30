import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Trash2, Loader2, Users, Pencil, Search, ChevronLeft, ChevronRight, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditingMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber: string;
}

interface DecryptedMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber: string;
  is_active: boolean;
  created_at: string;
}

// Generate random 6-character alphanumeric password
const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function MembersPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<DecryptedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state for adding
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
  });

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);
  const [isResetResultOpen, setIsResetResultOpen] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('get-all-members', {
        body: { messId: mess.id },
      });

      if (error) throw error;
      
      if (data?.members) {
        setMembers(data.members);
      }
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

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setFormData({ ...formData, password: newPass });
    setShowPassword(true);
  };

  const handleGenerateNewPassword = () => {
    const newPass = generateRandomPassword();
    setNewPassword(newPass);
    setShowNewPassword(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess) return;

    if (formData.password.length < 4 || formData.password.length > 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড ৪-৬ অক্ষরের হতে হবে' : 'Password must be 4-6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-member', {
        body: {
          action: 'create',
          messId: mess.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          roomNumber: formData.roomNumber,
          pin: formData.password,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেম্বার যোগ হয়েছে' : 'Member added',
      });

      setIsAddOpen(false);
      setFormData({ name: '', email: '', phone: '', roomNumber: '', password: '' });
      setShowPassword(false);
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

  const handleOpenEdit = (member: DecryptedMember) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      roomNumber: member.roomNumber,
    });
    setEditFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      roomNumber: member.roomNumber || '',
    });
    setNewPassword('');
    setShowNewPassword(false);
    setIsEditOpen(true);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess || !editingMember) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('manage-member', {
        body: {
          action: 'update',
          messId: mess.id,
          memberId: editingMember.id,
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          roomNumber: editFormData.roomNumber,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেম্বার আপডেট হয়েছে' : 'Member updated',
      });

      setIsEditOpen(false);
      setEditingMember(null);
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

  const handleResetPassword = async () => {
    if (!editingMember) return;

    if (newPassword.length < 4 || newPassword.length > 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড ৪-৬ অক্ষরের হতে হবে' : 'Password must be 4-6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-member-pin', {
        body: { action: 'edit', memberId: editingMember.id, newPin: newPassword },
      });

      if (error) throw error;

      setResetPasswordResult(newPassword);
      setIsResetResultOpen(true);
      setNewPassword('');
      setShowNewPassword(false);

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password updated successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      (member.email && member.email.toLowerCase().includes(query)) ||
      (member.phone && member.phone.toLowerCase().includes(query)) ||
      (member.roomNumber && member.roomNumber.toLowerCase().includes(query))
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
              {language === 'bn' 
                ? `মোট ${members.length} জন মেম্বার` 
                : `Total ${members.length} members`}
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
                  <Label>{language === 'bn' ? 'ইমেইল *' : 'Email *'}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ফোন *' : 'Phone *'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    required
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
                  <Label>{language === 'bn' ? 'পাসওয়ার্ড (৪-৬ অক্ষর) *' : 'Password (4-6 chars) *'}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value.slice(0, 6) })}
                        placeholder="••••••"
                        required
                        maxLength={6}
                        className="rounded-xl pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePassword}
                      title={language === 'bn' ? 'র‍্যান্ডম পাসওয়ার্ড' : 'Generate Random'}
                      className="rounded-xl"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn'
                      ? 'এই পাসওয়ার্ড মেম্বার লগইনের জন্য ব্যবহৃত হবে'
                      : 'This password will be used for member login'}
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

          {/* Edit Member Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'bn' ? 'মেম্বার সম্পাদনা করুন' : 'Edit Member'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditMember} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'নাম *' : 'Name *'}</Label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder={language === 'bn' ? 'মেম্বারের নাম' : 'Member name'}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ইমেইল *' : 'Email *'}</Label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="example@email.com"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ফোন *' : 'Phone *'}</Label>
                  <Input
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'রুম নম্বর' : 'Room Number'}</Label>
                  <Input
                    value={editFormData.roomNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, roomNumber: e.target.value })}
                    placeholder={language === 'bn' ? 'রুম নম্বর' : 'Room number'}
                    className="rounded-xl"
                  />
                </div>

                {/* Reset Password Section */}
                <div className="border-t border-border pt-4 mt-4">
                  <Label className="text-base font-medium">
                    {language === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    {language === 'bn'
                      ? 'মেম্বারের নতুন পাসওয়ার্ড সেট করুন (ঐচ্ছিক)'
                      : 'Set a new password for the member (optional)'}
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value.slice(0, 6))}
                        placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড (৪-৬ অক্ষর)' : 'New password (4-6 chars)'}
                        maxLength={6}
                        className="rounded-xl pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateNewPassword}
                      title={language === 'bn' ? 'র‍্যান্ডম পাসওয়ার্ড' : 'Generate Random'}
                      className="rounded-xl"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword || newPassword.length < 4}
                      className="rounded-xl"
                    >
                      {isResettingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        language === 'bn' ? 'রিসেট' : 'Reset'
                      )}
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {language === 'bn' ? 'আপডেট করুন' : 'Update'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Password Reset Result Dialog */}
          <Dialog open={isResetResultOpen} onOpenChange={setIsResetResultOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">
                  {language === 'bn' ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password Updated'}
                </DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {editingMember?.name} {language === 'bn' ? 'এর নতুন পাসওয়ার্ড:' : "'s new password:"}
                </p>
                <code className="block bg-primary/10 text-primary text-3xl font-mono py-4 px-6 rounded-xl">
                  {resetPasswordResult}
                </code>
                <p className="text-sm text-warning">
                  {language === 'bn' 
                    ? '⚠️ এই পাসওয়ার্ডটি সেভ করুন।'
                    : '⚠️ Save this password.'}
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsResetResultOpen(false)} className="w-full">
                  {language === 'bn' ? 'বুঝেছি' : 'Got it'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'নাম, ইমেইল, ফোন বা রুম দিয়ে খুঁজুন...' : 'Search by name, email, phone or room...'}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Members Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? (language === 'bn' ? 'কোনো মেম্বার পাওয়া যায়নি' : 'No members found')
                    : (language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet')}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'bn' 
                      ? 'উপরের বাটনে ক্লিক করে মেম্বার যোগ করুন' 
                      : 'Click the button above to add members'}
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                      <TableHead>{language === 'bn' ? 'ইমেইল' : 'Email'}</TableHead>
                      <TableHead>{language === 'bn' ? 'ফোন' : 'Phone'}</TableHead>
                      <TableHead>{language === 'bn' ? 'রুম নম্বর' : 'Room Number'}</TableHead>
                      <TableHead>{language === 'bn' ? 'যোগ হয়েছে' : 'Added'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border"
                      >
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.email || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.phone || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.roomNumber || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(member)}
                            className="rounded-xl text-primary hover:text-primary"
                            title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                          >
                            <Pencil className="w-4 h-4" />
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
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' 
                        ? `${filteredMembers.length} জনের মধ্যে ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredMembers.length)} দেখাচ্ছে`
                        : `Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredMembers.length)} of ${filteredMembers.length}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-xl"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        {language === 'bn' 
                          ? `${currentPage} / ${totalPages}`
                          : `${currentPage} / ${totalPages}`}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-xl"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

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
import { Plus, Trash2, Loader2, Users, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    pin: '',
  });

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
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
                      ? 'এই পিন মেম্বার লগইনের জন্য ব্যবহৃত হবে'
                      : 'This PIN will be used for member login'}
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
                  <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
                  <Input
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
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

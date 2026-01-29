import { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Ban, CheckCircle, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Mess {
  id: string;
  mess_id: string;
  name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  suspend_reason: string | null;
  created_at: string;
  manager_email?: string;
  subscription?: {
    type: 'monthly' | 'yearly';
    status: string;
    end_date: string;
  } | null;
}

export default function AdminMessPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [filteredMesses, setFilteredMesses] = useState<Mess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Suspend modal
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedMess, setSelectedMess] = useState<Mess | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [yearlyCount, setYearlyCount] = useState(0);

  useEffect(() => {
    fetchMesses();
  }, []);

  useEffect(() => {
    filterMesses();
  }, [messes, searchQuery, statusFilter, planFilter]);

  const fetchMesses = async () => {
    setIsLoading(true);
    try {
      // Fetch messes - using a simpler query that works with RLS
      const { data: messesData, error } = await supabase
        .from('messes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messes:', error);
        throw error;
      }

      if (messesData && messesData.length > 0) {
        // Fetch profiles separately to get manager emails
        const managerIds = messesData.map(m => m.manager_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', managerIds);

        // Fetch user_roles to filter out admins
        const { data: userRolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', managerIds);

        // Create a set of admin user IDs to exclude
        const adminUserIds = new Set(
          userRolesData?.filter(r => r.role === 'admin').map(r => r.user_id) || []
        );

        // Filter out messes where manager is an admin
        const nonAdminMesses = messesData.filter(m => !adminUserIds.has(m.manager_id));

        // Fetch subscriptions separately
        const messIds = nonAdminMesses.map(m => m.id);
        const { data: subscriptionsData } = await supabase
          .from('subscriptions')
          .select('mess_id, type, status, end_date')
          .in('mess_id', messIds);

        const profileMap = new Map(profilesData?.map(p => [p.user_id, p.email]) || []);
        const subscriptionMap = new Map(subscriptionsData?.map(s => [s.mess_id, s]) || []);

        const formattedMesses: Mess[] = nonAdminMesses.map((m) => ({
          id: m.id,
          mess_id: m.mess_id,
          name: m.name,
          status: m.status as 'active' | 'inactive' | 'suspended',
          suspend_reason: m.suspend_reason,
          created_at: m.created_at,
          manager_email: profileMap.get(m.manager_id) || undefined,
          subscription: subscriptionMap.get(m.id) ? {
            type: subscriptionMap.get(m.id)!.type as 'monthly' | 'yearly',
            status: subscriptionMap.get(m.id)!.status,
            end_date: subscriptionMap.get(m.id)!.end_date,
          } : null,
        }));
        
        setMesses(formattedMesses);

        // Calculate stats
        const monthly = formattedMesses.filter(m => m.subscription?.type === 'monthly' && m.subscription?.status === 'active').length;
        const yearly = formattedMesses.filter(m => m.subscription?.type === 'yearly' && m.subscription?.status === 'active').length;
        setMonthlyCount(monthly);
        setYearlyCount(yearly);
      } else {
        setMesses([]);
      }
    } catch (error) {
      console.error('Error fetching messes:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'মেস লোড করতে সমস্যা হয়েছে' : 'Failed to load messes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMesses = () => {
    let filtered = [...messes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.mess_id.toLowerCase().includes(query) ||
        m.name?.toLowerCase().includes(query) ||
        m.manager_email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Plan filter
    if (planFilter !== 'all') {
      if (planFilter === 'monthly') {
        filtered = filtered.filter(m => m.subscription?.type === 'monthly' && m.subscription?.status === 'active');
      } else if (planFilter === 'yearly') {
        filtered = filtered.filter(m => m.subscription?.type === 'yearly' && m.subscription?.status === 'active');
      }
    }

    setFilteredMesses(filtered);
    setCurrentPage(1);
  };

  const handleSuspend = async () => {
    if (!selectedMess || !suspendReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-suspend-mess', {
        body: {
          mess_id: selectedMess.id,
          action: 'suspend',
          reason: suspendReason,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেস স্থগিত করা হয়েছে' : 'Mess suspended successfully',
      });
      
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedMess(null);
      fetchMesses();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsuspend = async (mess: Mess) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-suspend-mess', {
        body: {
          mess_id: mess.id,
          action: 'unsuspend',
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেস পুনরায় সক্রিয় করা হয়েছে' : 'Mess unsuspended successfully',
      });
      
      fetchMesses();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openSuspendModal = (mess: Mess) => {
    setSelectedMess(mess);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success">{language === 'bn' ? 'সক্রিয়' : 'Active'}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</Badge>;
      case 'suspended':
        return <Badge variant="destructive">{language === 'bn' ? 'স্থগিত' : 'Suspended'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredMesses.length / itemsPerPage);
  const paginatedMesses = filteredMesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'bn' ? 'মেস ম্যানেজমেন্ট' : 'Mess Management'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'সকল মেস পরিচালনা করুন' : 'Manage all messes'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'মাসিক প্ল্যান' : 'Monthly Plan'}
                    </p>
                    <p className="text-3xl font-bold text-foreground">{monthlyCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'বাৎসরিক প্ল্যান' : 'Yearly Plan'}
                    </p>
                    <p className="text-3xl font-bold text-foreground">{yearlyCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'bn' ? 'মেস আইডি, নাম বা ইমেইল দিয়ে খুঁজুন...' : 'Search by Mess ID, name or email...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder={language === 'bn' ? 'স্ট্যাটাস' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'bn' ? 'সব' : 'All'}</SelectItem>
                  <SelectItem value="active">{language === 'bn' ? 'সক্রিয়' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</SelectItem>
                  <SelectItem value="suspended">{language === 'bn' ? 'স্থগিত' : 'Suspended'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder={language === 'bn' ? 'প্ল্যান' : 'Plan'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'bn' ? 'সব' : 'All'}</SelectItem>
                  <SelectItem value="monthly">{language === 'bn' ? 'মাসিক' : 'Monthly'}</SelectItem>
                  <SelectItem value="yearly">{language === 'bn' ? 'বাৎসরিক' : 'Yearly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mess Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>
              {language === 'bn' ? 'মেস তালিকা' : 'Mess List'} ({filteredMesses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'bn' ? 'মেস আইডি' : 'Mess ID'}</TableHead>
                  <TableHead>{language === 'bn' ? 'মেস নাম' : 'Mess Name'}</TableHead>
                  <TableHead>{language === 'bn' ? 'ম্যানেজার ইমেইল' : 'Manager Email'}</TableHead>
                  <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                  <TableHead>{language === 'bn' ? 'প্ল্যান' : 'Plan'}</TableHead>
                  <TableHead>{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : paginatedMesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {language === 'bn' ? 'কোনো মেস পাওয়া যায়নি' : 'No messes found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMesses.map(mess => (
                    <TableRow key={mess.id}>
                      <TableCell className="font-mono">{mess.mess_id}</TableCell>
                      <TableCell>{mess.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{mess.manager_email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(mess.status)}</TableCell>
                      <TableCell>
                        {mess.subscription?.status === 'active' ? (
                          <Badge variant="outline">
                            {mess.subscription.type === 'yearly' 
                              ? (language === 'bn' ? 'বাৎসরিক' : 'Yearly')
                              : (language === 'bn' ? 'মাসিক' : 'Monthly')
                            }
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mess.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnsuspend(mess)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {language === 'bn' ? 'আনসাসপেন্ড' : 'Unsuspend'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openSuspendModal(mess)}
                            disabled={isProcessing}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            {language === 'bn' ? 'সাসপেন্ড' : 'Suspend'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {language === 'bn' ? 'আগে' : 'Previous'}
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {language === 'bn' ? 'পরে' : 'Next'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspend Modal */}
        <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'মেস সাসপেন্ড করুন' : 'Suspend Mess'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {language === 'bn' 
                  ? `আপনি কি "${selectedMess?.mess_id}" মেস সাসপেন্ড করতে চান?` 
                  : `Are you sure you want to suspend "${selectedMess?.mess_id}"?`
                }
              </p>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder={language === 'bn' ? 'সাসপেন্ডের কারণ লিখুন (আবশ্যক)...' : 'Enter suspension reason (required)...'}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'bn' ? 'সাসপেন্ড করুন' : 'Suspend'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}

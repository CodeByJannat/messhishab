import { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, Ticket, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  usage_limit: number | null;
  used_count: number;
  status: 'active' | 'inactive';
  expiry_date: string | null;
  created_at: string;
}

interface Promotion {
  id: string;
  offer_name_en: string;
  offer_name_bn: string;
  coupon_code: string | null;
  cta_text_en: string;
  cta_text_bn: string;
  is_active: boolean;
}

export default function AdminCouponPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Coupon modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    usage_limit: '',
    expiry_date: '',
  });

  // Promotion form
  const [promotionForm, setPromotionForm] = useState({
    offer_name_en: '',
    offer_name_bn: '',
    coupon_code: '',
    cta_text_en: 'Claim Now',
    cta_text_bn: 'এখনই নিন',
    is_active: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch coupons
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (couponsData) {
        setCoupons(couponsData as Coupon[]);
      }

      // Fetch promotion (assuming single active promotion)
      const { data: promotionData } = await supabase
        .from('promotions')
        .select('*')
        .limit(1)
        .single();
      
      if (promotionData) {
        setPromotion(promotionData as Promotion);
        setPromotionForm({
          offer_name_en: promotionData.offer_name_en,
          offer_name_bn: promotionData.offer_name_bn,
          coupon_code: promotionData.coupon_code || '',
          cta_text_en: promotionData.cta_text_en,
          cta_text_bn: promotionData.cta_text_bn,
          is_active: promotionData.is_active,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.discount_value) return;
    
    setIsSaving(true);
    try {
      const couponData = {
        code: couponForm.code.toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
        expiry_date: couponForm.expiry_date || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);
        
        if (error) throw error;
      }

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'কুপন সংরক্ষণ হয়েছে' : 'Coupon saved successfully',
      });
      
      setShowCouponModal(false);
      resetCouponForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);
      
      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'কুপন মুছে ফেলা হয়েছে' : 'Coupon deleted',
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ status: coupon.status === 'active' ? 'inactive' : 'active' })
        .eq('id', coupon.id);
      
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSavePromotion = async () => {
    setIsSaving(true);
    try {
      const promotionData = {
        offer_name_en: promotionForm.offer_name_en,
        offer_name_bn: promotionForm.offer_name_bn,
        coupon_code: promotionForm.coupon_code || null,
        cta_text_en: promotionForm.cta_text_en,
        cta_text_bn: promotionForm.cta_text_bn,
        is_active: promotionForm.is_active,
      };

      if (promotion) {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', promotion.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert(promotionData);
        
        if (error) throw error;
      }

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'প্রমোশন সংরক্ষণ হয়েছে' : 'Promotion saved successfully',
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
    });
    setShowCouponModal(true);
  };

  const resetCouponForm = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      usage_limit: '',
      expiry_date: '',
    });
  };

  const activeCoupons = coupons.filter(c => c.status === 'active');

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'bn' ? 'কুপন ম্যানেজমেন্ট' : 'Coupon Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'কুপন এবং প্রমোশন পরিচালনা করুন' : 'Manage coupons and promotions'}
            </p>
          </div>
          <Button 
            onClick={() => {
              resetCouponForm();
              setShowCouponModal(true);
            }}
            className="btn-primary-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'bn' ? 'নতুন কুপন' : 'New Coupon'}
          </Button>
        </div>

        {/* Coupon Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <CardTitle>{language === 'bn' ? 'কুপন তালিকা' : 'Coupon List'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'কোড' : 'Code'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ডিসকাউন্ট' : 'Discount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ব্যবহার' : 'Usage'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মেয়াদ' : 'Expiry'}</TableHead>
                    <TableHead>{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {language === 'bn' ? 'কোনো কুপন নেই' : 'No coupons found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map(coupon => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                        <TableCell>
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%`
                            : `৳${coupon.discount_value}`
                          }
                        </TableCell>
                        <TableCell>
                          {coupon.used_count} / {coupon.usage_limit || '∞'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={coupon.status === 'active'}
                            onCheckedChange={() => handleToggleCouponStatus(coupon)}
                          />
                        </TableCell>
                        <TableCell>
                          {coupon.expiry_date 
                            ? format(new Date(coupon.expiry_date), 'dd/MM/yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditCoupon(coupon)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteCoupon(coupon)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Promotion Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-warning" />
                <CardTitle>{language === 'bn' ? 'প্রমোশন সেটিংস' : 'Promotion Settings'}</CardTitle>
              </div>
              <CardDescription>
                {language === 'bn' 
                  ? 'হোম পেজে প্রমোশন মডাল দেখানো হবে' 
                  : 'This will show a promotion modal on the homepage'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">{language === 'bn' ? 'প্রমোশন সক্রিয়' : 'Promotion Active'}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'হোম পেজে মডাল দেখাবে' : 'Show modal on homepage'}
                  </p>
                </div>
                <Switch
                  checked={promotionForm.is_active}
                  onCheckedChange={(checked) => setPromotionForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'অফার নাম (ইংরেজি)' : 'Offer Name (English)'}</Label>
                  <Input
                    value={promotionForm.offer_name_en}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, offer_name_en: e.target.value }))}
                    placeholder="Special Offer!"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'অফার নাম (বাংলা)' : 'Offer Name (Bangla)'}</Label>
                  <Input
                    value={promotionForm.offer_name_bn}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, offer_name_bn: e.target.value }))}
                    placeholder="বিশেষ অফার!"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'কুপন কোড' : 'Coupon Code'}</Label>
                  <Select 
                    value={promotionForm.coupon_code || "none"} 
                    onValueChange={(value) => setPromotionForm(prev => ({ ...prev, coupon_code: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'bn' ? 'কুপন নির্বাচন করুন' : 'Select coupon'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{language === 'bn' ? 'কোনো কুপন নেই' : 'No coupon'}</SelectItem>
                      {activeCoupons.map(coupon => (
                        <SelectItem key={coupon.id} value={coupon.code}>
                          {coupon.code} ({coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `৳${coupon.discount_value}`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বাটন টেক্সট (ইংরেজি)' : 'Button Text (English)'}</Label>
                  <Input
                    value={promotionForm.cta_text_en}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, cta_text_en: e.target.value }))}
                    placeholder="Claim Now"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বাটন টেক্সট (বাংলা)' : 'Button Text (Bangla)'}</Label>
                  <Input
                    value={promotionForm.cta_text_bn}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, cta_text_bn: e.target.value }))}
                    placeholder="এখনই নিন"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <Button
                onClick={handleSavePromotion}
                disabled={isSaving}
                className="btn-primary-glow"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Promotion'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coupon Modal */}
        <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCoupon 
                  ? (language === 'bn' ? 'কুপন সম্পাদনা' : 'Edit Coupon')
                  : (language === 'bn' ? 'নতুন কুপন' : 'New Coupon')
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'কুপন কোড' : 'Coupon Code'}</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ডিসকাউন্ট টাইপ' : 'Discount Type'}</Label>
                  <Select 
                    value={couponForm.discount_type} 
                    onValueChange={(value: 'percentage' | 'fixed') => setCouponForm(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{language === 'bn' ? 'শতাংশ (%)' : 'Percentage (%)'}</SelectItem>
                      <SelectItem value="fixed">{language === 'bn' ? 'নির্দিষ্ট (৳)' : 'Fixed (৳)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</Label>
                  <Input
                    type="number"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, discount_value: e.target.value }))}
                    placeholder="20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ব্যবহার সীমা' : 'Usage Limit'}</Label>
                  <Input
                    type="number"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                    placeholder={language === 'bn' ? 'অসীম' : 'Unlimited'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'মেয়াদ শেষ' : 'Expiry Date'}</Label>
                  <Input
                    type="date"
                    value={couponForm.expiry_date}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCouponModal(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSaveCoupon}
                disabled={!couponForm.code || !couponForm.discount_value || isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}

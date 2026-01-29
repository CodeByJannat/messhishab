import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, X, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Promotion {
  id: string;
  offer_name_en: string;
  offer_name_bn: string;
  coupon_code: string | null;
  cta_text_en: string;
  cta_text_bn: string;
  is_active: boolean;
}

export function PromotionModal() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if modal was already shown this session
    const hasSeenPromotion = sessionStorage.getItem('promotion_modal_shown');
    if (hasSeenPromotion) return;

    fetchActivePromotion();
  }, []);

  const fetchActivePromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPromotion(data as Promotion);
        setIsOpen(true);
        // Mark as shown for this session
        sessionStorage.setItem('promotion_modal_shown', 'true');
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  };

  const handleCopy = async () => {
    if (!promotion?.coupon_code) return;
    
    try {
      await navigator.clipboard.writeText(promotion.coupon_code);
      setCopied(true);
      toast({
        title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
        description: promotion.coupon_code,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!promotion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="relative"
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-3xl blur-xl" />
          
          {/* Main Card */}
          <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Animated Gradient Border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] opacity-10" />
            
            {/* Top Decorative Bar */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
            
            {/* Content Container */}
            <div className="relative p-6 pt-8">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-all hover:scale-110"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Floating Icon with Glow */}
              <div className="flex justify-center mb-5">
                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="relative"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl scale-150" />
                  
                  {/* Icon Container */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Gift className="w-10 h-10 text-primary-foreground" />
                    
                    {/* Sparkle Decorations */}
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="w-5 h-5 text-accent" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Limited Time Badge */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="px-4 py-1.5 bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-full"
                >
                  <span className="text-xs font-semibold text-accent-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    {language === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited Time Offer'}
                  </span>
                </motion.div>
              </div>

              {/* Offer Name */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2 leading-tight"
              >
                {language === 'bn' ? promotion.offer_name_bn : promotion.offer_name_en}
              </motion.h2>

              {/* Subtitle */}
              <p className="text-sm text-muted-foreground text-center mb-6">
                {language === 'bn' 
                  ? 'এই বিশেষ অফার মিস করবেন না!' 
                  : "Don't miss this exclusive deal!"}
              </p>

              {/* Coupon Code Section */}
              {promotion.coupon_code && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <p className="text-xs text-muted-foreground text-center mb-2 uppercase tracking-wider font-medium">
                    {language === 'bn' ? 'আপনার কুপন কোড' : 'Your Coupon Code'}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="w-full group relative"
                  >
                    {/* Dashed Border Container */}
                    <div className="relative py-4 px-6 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-dashed border-primary/40 hover:border-primary/60 transition-all duration-300 hover:bg-primary/10">
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-mono font-bold text-xl md:text-2xl text-primary tracking-widest">
                          {promotion.coupon_code}
                        </span>
                        <div className={`p-2 rounded-lg transition-all ${copied ? 'bg-primary/20' : 'bg-primary/20 group-hover:bg-primary/30'}`}>
                          {copied ? (
                            <Check className="w-5 h-5 text-primary" />
                          ) : (
                            <Copy className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                      </div>
                      {/* Click to copy hint */}
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-card px-2">
                        {copied 
                          ? (language === 'bn' ? 'কপি হয়েছে!' : 'Copied!') 
                          : (language === 'bn' ? 'কপি করতে ক্লিক করুন' : 'Click to copy')}
                      </span>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button 
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <span>{language === 'bn' ? promotion.cta_text_bn : promotion.cta_text_en}</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>

              {/* Bottom Trust Text */}
              <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                <span>🔒</span>
                {language === 'bn' 
                  ? 'কোনো ক্রেডিট কার্ড প্রয়োজন নেই' 
                  : 'No credit card required'}
              </p>
            </div>

            {/* Bottom Decorative Elements */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-accent/20 to-transparent rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

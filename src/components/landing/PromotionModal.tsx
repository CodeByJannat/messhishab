import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Copy, Check, X } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative glass-card p-6 rounded-2xl border border-primary/20"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Gift Icon */}
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center"
            >
              <Gift className="w-8 h-8 text-primary" />
            </motion.div>
          </div>

          {/* Offer Name */}
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">
            {language === 'bn' ? promotion.offer_name_bn : promotion.offer_name_en}
          </h2>

          {/* Coupon Code */}
          {promotion.coupon_code && (
            <div className="mt-4 mb-6">
              <p className="text-sm text-muted-foreground text-center mb-2">
                {language === 'bn' ? 'কুপন কোড:' : 'Coupon Code:'}
              </p>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 border-2 border-dashed border-primary hover:bg-primary/20 transition-colors"
              >
                <span className="font-mono font-bold text-lg text-primary">
                  {promotion.coupon_code}
                </span>
                {copied ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <Copy className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>
          )}

          {/* CTA Button */}
          <Link to="/register" onClick={() => setIsOpen(false)}>
            <Button className="w-full btn-primary-glow text-lg py-6 rounded-xl">
              {language === 'bn' ? promotion.cta_text_bn : promotion.cta_text_en}
            </Button>
          </Link>

          {/* Subtle Badge */}
          <div className="flex justify-center mt-4">
            <Badge variant="secondary" className="text-xs">
              {language === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited Time Offer'}
            </Badge>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

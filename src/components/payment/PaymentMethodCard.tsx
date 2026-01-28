import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodCardProps {
  id: string;
  name: string;
  nameBn: string;
  icon: string;
  isSelected: boolean;
  onSelect: () => void;
  language: 'bn' | 'en';
}

export function PaymentMethodCard({
  id,
  name,
  nameBn,
  icon,
  isSelected,
  onSelect,
  language,
}: PaymentMethodCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative w-full p-4 rounded-2xl border-2 transition-all duration-300",
        "backdrop-blur-xl bg-card/80",
        "flex items-center gap-4",
        "hover:shadow-lg",
        isSelected
          ? "border-primary shadow-lg shadow-primary/20 bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center overflow-hidden shadow-sm">
        <img src={icon} alt={name} className="w-10 h-10 object-contain" />
      </div>

      {/* Text */}
      <div className="text-left">
        <h3 className="font-semibold text-foreground">
          {language === 'bn' ? nameBn : name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {id === 'bkash' && (language === 'bn' ? 'ডিরেক্ট পেমেন্ট' : 'Direct Payment')}
          {id === 'manual-bkash' && (language === 'bn' ? 'সেন্ড মানি' : 'Send Money')}
          {id === 'sslcommerz' && (language === 'bn' ? 'মাল্টিপল অপশন' : 'Multiple Options')}
        </p>
      </div>
    </motion.button>
  );
}

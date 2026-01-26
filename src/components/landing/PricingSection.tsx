import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PricingSection() {
  const { t } = useLanguage();
  const [isYearly, setIsYearly] = useState(false);
  const [coupon, setCoupon] = useState('');

  const features = [
    t('pricing.features.unlimited'),
    t('pricing.features.auto'),
    t('pricing.features.reset'),
    t('pricing.features.support'),
  ];

  return (
    <section id="pricing" className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('pricing.title')}
          </h2>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="glass-card p-1 flex gap-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                !isYearly
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                isYearly
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('pricing.yearly')}
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                {t('pricing.bestValue')}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="glass-card p-8 relative overflow-hidden">
            {isYearly && (
              <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                {t('pricing.bestValue')}
              </div>
            )}

            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-foreground">
                  ৳{isYearly ? '200' : '20'}
                </span>
                <span className="text-muted-foreground">
                  {isYearly ? t('pricing.perYear') : t('pricing.perMonth')}
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder={t('pricing.coupon')}
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="rounded-xl"
              />
              <Button variant="outline" className="rounded-xl px-6">
                {t('pricing.apply')}
              </Button>
            </div>

            <Link to="/register">
              <Button className="w-full btn-primary-glow text-lg py-6">
                {t('pricing.cta')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

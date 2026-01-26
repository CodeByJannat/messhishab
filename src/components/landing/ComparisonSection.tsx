import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

export function ComparisonSection() {
  const { t } = useLanguage();

  const manualPains = [
    t('comparison.manual.1'),
    t('comparison.manual.2'),
    t('comparison.manual.3'),
    t('comparison.manual.4'),
  ];

  const systemBenefits = [
    t('comparison.system.1'),
    t('comparison.system.2'),
    t('comparison.system.3'),
    t('comparison.system.4'),
  ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('comparison.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Manual Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 border-destructive/30"
          >
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              {t('comparison.manual')}
            </h3>
            <ul className="space-y-4">
              {manualPains.map((pain) => (
                <li key={pain} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-muted-foreground">{pain}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* System Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 border-secondary/30"
          >
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              {t('comparison.system')}
            </h3>
            <ul className="space-y-4">
              {systemBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

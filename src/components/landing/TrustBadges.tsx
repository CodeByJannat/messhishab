import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export function TrustBadges() {
  const { t } = useLanguage();

  const badges = [
    { key: 'trust.secure', icon: '🔒' },
    { key: 'trust.mobile', icon: '📱' },
    { key: 'trust.bangladesh', icon: '🇧🇩' },
  ];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container-custom">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card px-6 py-4 flex items-center gap-3"
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-foreground font-medium">
                {t(badge.key).replace(/^[^\s]+\s/, '')}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

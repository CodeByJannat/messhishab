import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export function XFactorSection() {
  const { t } = useLanguage();

  const factors = [
    { key: 'xfactor.1', icon: '🔄' },
    { key: 'xfactor.2', icon: '👀' },
    { key: 'xfactor.3', icon: '🔔' },
    { key: 'xfactor.4', icon: '📅' },
  ];

  return (
    <section className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('xfactor.title')}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {factors.map((factor, index) => (
            <motion.div
              key={factor.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 text-center hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">{factor.icon}</div>
              <p className="text-foreground font-medium">
                {t(factor.key).replace(/^[^\s]+\s/, '')}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

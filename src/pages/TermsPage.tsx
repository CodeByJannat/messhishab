import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
  const { t } = useLanguage();

  const sections = [
    {
      titleKey: 'terms.usage.title',
      items: [
        'terms.usage.item1',
        'terms.usage.item2',
        'terms.usage.item3',
        'terms.usage.item4',
      ],
    },
    {
      titleKey: 'terms.subscription.title',
      items: [
        'terms.subscription.item1',
        'terms.subscription.item2',
        'terms.subscription.item3',
        'terms.subscription.item4',
      ],
    },
    {
      titleKey: 'terms.payment.title',
      items: [
        'terms.payment.item1',
        'terms.payment.item2',
        'terms.payment.item3',
      ],
    },
    {
      titleKey: 'terms.suspension.title',
      items: [
        'terms.suspension.item1',
        'terms.suspension.item2',
        'terms.suspension.item3',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container-custom max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            {t('terms.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t('terms.subtitle')}
          </motion.p>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12 rounded-2xl"
          >
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('terms.intro')}
            </p>

            {sections.map((section, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-8" />}
                <h2 className="text-xl font-bold text-foreground mb-4">
                  {index + 1}. {t(section.titleKey)}
                </h2>
                <ul className="space-y-3 text-muted-foreground">
                  {section.items.map((itemKey, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{t(itemKey)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <Separator className="my-8" />
            
            <p className="text-sm text-muted-foreground text-center">
              {t('terms.lastUpdated')}
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

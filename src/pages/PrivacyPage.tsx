import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Shield, Database, Lock, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Database,
      titleKey: 'privacy.collection.title',
      items: [
        'privacy.collection.item1',
        'privacy.collection.item2',
        'privacy.collection.item3',
      ],
    },
    {
      icon: Shield,
      titleKey: 'privacy.usage.title',
      items: [
        'privacy.usage.item1',
        'privacy.usage.item2',
        'privacy.usage.item3',
      ],
    },
    {
      icon: Lock,
      titleKey: 'privacy.protection.title',
      items: [
        'privacy.protection.item1',
        'privacy.protection.item2',
        'privacy.protection.item3',
      ],
    },
    {
      icon: UserCheck,
      titleKey: 'privacy.rights.title',
      items: [
        'privacy.rights.item1',
        'privacy.rights.item2',
        'privacy.rights.item3',
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
            {t('privacy.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t('privacy.subtitle')}
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
              {t('privacy.intro')}
            </p>

            {sections.map((section, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-8" />}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t(section.titleKey)}
                  </h2>
                </div>
                <ul className="space-y-3 text-muted-foreground ml-4">
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
            
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <p className="text-muted-foreground mb-2">{t('privacy.contact.text')}</p>
              <a
                href="mailto:support@messhishab.com"
                className="text-primary hover:underline font-medium"
              >
                support@messhishab.com
              </a>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-6">
              {t('privacy.lastUpdated')}
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

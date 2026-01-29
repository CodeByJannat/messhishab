import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Users,
      titleKey: 'about.feature1.title',
      descKey: 'about.feature1.desc',
    },
    {
      icon: Target,
      titleKey: 'about.feature2.title',
      descKey: 'about.feature2.desc',
    },
    {
      icon: Heart,
      titleKey: 'about.feature3.title',
      descKey: 'about.feature3.desc',
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
            {t('about.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t('about.subtitle')}
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
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t('about.whatIs.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t('about.whatIs.content')}
            </p>

            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t('about.whoFor.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t('about.whoFor.content')}
            </p>

            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t('about.mission.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.mission.content')}
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 rounded-xl text-center"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

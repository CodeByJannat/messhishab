import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export function TestimonialSection() {
  const { t } = useLanguage();

  return (
    <section className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass-card p-8 md:p-12 text-center relative">
            <Quote className="w-12 h-12 text-primary/30 absolute top-6 left-6" />
            <Quote className="w-12 h-12 text-primary/30 absolute bottom-6 right-6 rotate-180" />
            
            <p className="text-xl md:text-2xl text-foreground font-medium mb-6 relative z-10">
              {t('testimonial.quote')}
            </p>
            <p className="text-muted-foreground">
              {t('testimonial.author')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

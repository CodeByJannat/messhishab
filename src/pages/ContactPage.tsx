import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Send, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  message: z.string()
    .trim()
    .min(1, { message: 'Message is required' })
    .max(1000, { message: 'Message must be less than 1000 characters' }),
});

// Load Turnstile script
const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('turnstile-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(script);
  });
};

// Extend Window interface
declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function ContactPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);
  
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Fetch Turnstile site key and initialize widget
  useEffect(() => {
    let mounted = true;

    const fetchSiteKeyAndInit = async () => {
      try {
        // Fetch site key from edge function
        const { data, error } = await supabase.functions.invoke('get-turnstile-key');
        
        if (error || !data?.siteKey) {
          console.error('Failed to fetch Turnstile site key:', error);
          setTurnstileError(true);
          return;
        }

        if (!mounted) return;
        setTurnstileSiteKey(data.siteKey);

        // Load Turnstile script
        await loadTurnstileScript();
        
        if (!mounted || !turnstileContainerRef.current || !window.turnstile) return;

        // Clear existing widget if any
        if (turnstileWidgetId.current) {
          try {
            window.turnstile.remove(turnstileWidgetId.current);
          } catch (e) {
            // Ignore removal errors
          }
        }

        // Render new widget
        turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: data.siteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
            setTurnstileError(false);
          },
          'expired-callback': () => {
            setTurnstileToken(null);
          },
          'error-callback': () => {
            setTurnstileError(true);
            setTurnstileToken(null);
          },
          theme: 'auto',
          size: 'normal',
        });

        setTurnstileLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Turnstile:', error);
        if (mounted) setTurnstileError(true);
      }
    };

    fetchSiteKeyAndInit();

    return () => {
      mounted = false;
      if (turnstileWidgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
          // Ignore removal errors
        }
      }
    };
  }, []);

  const resetTurnstile = useCallback(() => {
    if (turnstileWidgetId.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken(null);
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Check Turnstile verification
    if (!turnstileToken) {
      toast({
        title: language === 'bn' ? 'যাচাই প্রয়োজন' : 'Verification Required',
        description: language === 'bn' 
          ? 'অনুগ্রহ করে যাচাই সম্পন্ন করুন।'
          : 'Please complete the verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Call edge function with Turnstile token
      const { data, error } = await supabase.functions.invoke('submit-contact-form', {
        body: {
          name: result.data.name,
          email: result.data.email,
          message: result.data.message,
          turnstileToken: turnstileToken,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        // Handle Turnstile verification failure
        if (data.error.includes('Turnstile')) {
          resetTurnstile();
          toast({
            title: language === 'bn' ? 'যাচাই ব্যর্থ' : 'Verification Failed',
            description: language === 'bn' 
              ? 'অনুগ্রহ করে যাচাই সম্পন্ন করুন।'
              : 'Please complete the verification again.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.error);
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      resetTurnstile();
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'আপনার মেসেজ সফলভাবে পাঠানো হয়েছে। আমরা দ্রুত উত্তর দিবো।'
          : 'Your message has been sent successfully. We will reply soon.',
      });

      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      resetTurnstile();
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'মেসেজ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = turnstileToken && formData.name && formData.email && formData.message;

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
            {t('contact.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t('contact.subtitle')}
          </motion.p>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {t('contact.email.title')}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {t('contact.email.desc')}
                    </p>
                    <a
                      href="mailto:support@messhishab.com"
                      className="text-primary hover:underline font-medium"
                    >
                      support@messhishab.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {t('contact.whatsapp.title')}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {t('contact.whatsapp.desc')}
                    </p>
                    <a
                      href="https://wa.me/8801XXXXXXXXX"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('contact.support.title')}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t('contact.support.desc')}
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">
                {t('contact.form.title')}
              </h2>
              
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === 'bn' ? 'ধন্যবাদ!' : 'Thank you!'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'bn' 
                      ? 'আপনার মেসেজ সফলভাবে পাঠানো হয়েছে।'
                      : 'Your message has been sent successfully.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.form.name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder={t('contact.form.namePlaceholder')}
                      className={`bg-background/50 ${errors.name ? 'border-destructive' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder={t('contact.form.emailPlaceholder')}
                      className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder={t('contact.form.messagePlaceholder')}
                      className={`bg-background/50 min-h-[120px] ${errors.message ? 'border-destructive' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.message.length}/1000
                    </p>
                  </div>
                  
                  {/* Turnstile Widget */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{language === 'bn' ? 'স্প্যাম প্রতিরোধ যাচাই' : 'Spam protection verification'}</span>
                    </div>
                    <div 
                      ref={turnstileContainerRef}
                      className="flex justify-center"
                    />
                    {turnstileError && (
                      <p className="text-sm text-destructive text-center">
                        {language === 'bn' 
                          ? 'যাচাই লোড করতে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।'
                          : 'Failed to load verification. Please refresh the page.'}
                      </p>
                    )}
                    {turnstileToken && (
                      <p className="text-sm text-success text-center flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {language === 'bn' ? 'যাচাই সম্পন্ন' : 'Verification complete'}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full gap-2"
                    disabled={isSubmitting || !isFormValid}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('contact.form.submit')}
                      </>
                    )}
                  </Button>
                  
                  {!turnstileToken && !turnstileError && turnstileLoaded && (
                    <p className="text-xs text-muted-foreground text-center">
                      {language === 'bn' 
                        ? 'ফর্ম জমা দিতে উপরের যাচাই সম্পন্ন করুন'
                        : 'Complete the verification above to submit the form'}
                    </p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

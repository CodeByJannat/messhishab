import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Navbar
    'nav.pricing': 'প্রাইসিং',
    'nav.howItWorks': 'কিভাবে কাজ করে',
    'nav.faq': 'প্রশ্নোত্তর',
    'nav.login': 'লগইন',
    'nav.register': 'রেজিস্ট্রেশন',
    
    // Hero
    'hero.title': 'মেসের হিসাব নিয়ে আর কোনো ঝামেলা নয়',
    'hero.subtitle': 'খাতা, এক্সেল আর ভুল হিসাব বাদ দিন। সব হিসাব হোক স্বচ্ছ, অটোমেটিক আর ঝামেলামুক্ত।',
    'hero.cta': 'এখনই ফ্রি শুরু করুন',
    
    // Trust Badges
    'trust.secure': '🔒 আপনার ডাটা সম্পূর্ণ নিরাপদ',
    'trust.mobile': '📱 মোবাইল ও কম্পিউটার দুইটিতেই ব্যবহারযোগ্য',
    'trust.bangladesh': '🇧🇩 বাংলাদেশি মেসের জন্য বানানো',
    
    // Pricing
    'pricing.title': 'যে দামে এক কাপ চা, সে দামে পুরো মেসের হিসাব',
    'pricing.monthly': 'মাসিক',
    'pricing.yearly': 'বার্ষিক',
    'pricing.perMonth': '/মাস',
    'pricing.perYear': '/বছর',
    'pricing.bestValue': 'সেরা মূল্য',
    'pricing.features.unlimited': 'সীমাহীন মেম্বার',
    'pricing.features.auto': 'অটো ক্যালকুলেশন',
    'pricing.features.reset': 'মাসিক রিসেট',
    'pricing.features.support': '২৪/৭ সাপোর্ট',
    'pricing.cta': 'প্যাকেজ নিন',
    'pricing.coupon': 'কুপন কোড',
    'pricing.apply': 'প্রয়োগ করুন',
    
    // Comparison
    'comparison.title': 'তুলনা করুন',
    'comparison.manual': 'হাতে হিসাব 😓',
    'comparison.system': 'আমাদের সিস্টেম 😌',
    'comparison.manual.1': 'মাস শেষে ঝগড়া',
    'comparison.manual.2': 'ভুল হিসাব',
    'comparison.manual.3': 'খাতা হারানোর ভয়',
    'comparison.manual.4': 'স্বচ্ছতা নেই',
    'comparison.system.1': 'অটোমেটিক হিসাব',
    'comparison.system.2': 'সবাই নিজেরটা দেখে',
    'comparison.system.3': 'ঝগড়া শূন্য',
    'comparison.system.4': 'শান্তিপূর্ণ মেস',
    
    // X-Factor
    'xfactor.title': 'কেন আমাদের সিস্টেম আলাদা?',
    'xfactor.1': '🔄 নিজে নিজে meal rate হিসাব',
    'xfactor.2': '👀 member শুধু নিজের হিসাব দেখে',
    'xfactor.3': '🔔 কম ব্যালেন্স হলে নোটিফিকেশন',
    'xfactor.4': '📅 মাস শেষে অটো নতুন মাস শুরু',
    
    // Steps
    'steps.title': 'সার্ভিস নিন ৩টি সহজ ধাপে',
    'steps.1.title': 'প্যাকেজ নির্বাচন করুন',
    'steps.1.desc': 'আপনার প্রয়োজন অনুযায়ী মাসিক বা বার্ষিক প্যাকেজ বেছে নিন',
    'steps.2.title': 'রেজিস্ট্রেশন করুন',
    'steps.2.desc': 'ইমেইল ও পাসওয়ার্ড দিয়ে একাউন্ট খুলুন',
    'steps.3.title': 'হিসাবের ঝামেলা ভুলে যান',
    'steps.3.desc': 'আপনার মেস পরিচালনা শুরু করুন',
    'steps.cta': 'এখনই শুরু করুন',
    
    // Testimonial
    'testimonial.quote': '"আগে মাস শেষে ঝগড়া লেগেই থাকতো। এখন সব হিসাব software দেখায়।"',
    'testimonial.author': '— একজন মেস ম্যানেজার',
    
    // FAQ
    'faq.title': 'সাধারণ প্রশ্নসমূহ',
    'faq.q1': 'Subscription শেষ হলে কী হবে?',
    'faq.a1': 'Login করলে আপনাকে জানিয়ে দেওয়া হবে এবং সাবস্ক্রিপশন নবায়ন করার অপশন দেখানো হবে।',
    'faq.q2': 'Member কি অন্য member এর হিসাব দেখতে পারবে?',
    'faq.a2': 'না। প্রতিটি মেম্বার শুধুমাত্র নিজের হিসাব দেখতে পারবে। ১০০% প্রাইভেসি নিশ্চিত।',
    'faq.q3': 'ডাটা কি নিরাপদ?',
    'faq.a3': 'হ্যাঁ। আমরা Cloud secured system ব্যবহার করি এবং সব ডাটা encrypted থাকে।',
    'faq.q4': 'মোবাইলে কি কাজ করে?',
    'faq.a4': 'হ্যাঁ। ওয়েবসাইট সম্পূর্ণ মোবাইল responsive এবং যেকোনো ডিভাইসে ব্যবহারযোগ্য।',
    
    // Final CTA
    'finalCta.title': 'হিসাব নিয়ে চিন্তা নয়—এখন শান্তিতে থাকুন',
    'finalCta.button': 'আজই রেজিস্ট্রেশন করুন',
    
    // Footer
    'footer.about': 'আমাদের সম্পর্কে',
    'footer.contact': 'যোগাযোগ',
    'footer.refund': 'রিফান্ড পলিসি',
    'footer.terms': 'শর্তাবলী',
    'footer.privacy': 'প্রাইভেসি পলিসি',
    'footer.copyright': '© ২০২৪ MessHishab. সর্বস্বত্ব সংরক্ষিত।',
    
    // Auth
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.confirmPassword': 'পাসওয়ার্ড নিশ্চিত করুন',
    'auth.login': 'লগইন',
    'auth.register': 'রেজিস্ট্রেশন',
    'auth.forgotPassword': 'পাসওয়ার্ড ভুলে গেছেন?',
    'auth.noAccount': 'একাউন্ট নেই?',
    'auth.hasAccount': 'একাউন্ট আছে?',
    'auth.registerHere': 'রেজিস্ট্রেশন করুন',
    'auth.loginHere': 'লগইন করুন',
    'auth.messId': 'মেস আইডি',
    'auth.messPassword': 'মেস পাসওয়ার্ড',
    'auth.memberLogin': 'মেম্বার লগইন',
    'auth.managerLogin': 'ম্যানেজার লগইন',
    
    // Common
    'common.loading': 'লোড হচ্ছে...',
    'common.save': 'সেভ করুন',
    'common.cancel': 'বাতিল',
    'common.delete': 'মুছুন',
    'common.edit': 'সম্পাদনা',
    'common.add': 'যোগ করুন',
    'common.search': 'খুঁজুন',
    'common.filter': 'ফিল্টার',
    'common.export': 'এক্সপোর্ট',
    'common.language': 'ভাষা',
    'common.theme': 'থিম',
    'common.light': 'লাইট',
    'common.dark': 'ডার্ক',
    
    // Payment
    'payment.title': 'পেমেন্ট',
    'payment.selectMethod': 'পেমেন্ট মেথড নির্বাচন করুন',
    'payment.orderSummary': 'অর্ডার সারাংশ',
    'payment.completePayment': 'পেমেন্ট সম্পন্ন করুন',
    'payment.processing': 'প্রসেসিং...',
    'payment.securePayment': 'সম্পূর্ণ নিরাপদ পেমেন্ট',
  },
  en: {
    // Navbar
    'nav.pricing': 'Pricing',
    'nav.howItWorks': 'How It Works',
    'nav.faq': 'FAQ',
    'nav.login': 'Login',
    'nav.register': 'Register',
    
    // Hero
    'hero.title': 'No More Hassle with Mess Accounts',
    'hero.subtitle': 'Forget notebooks, Excel, and calculation errors. Make all accounts transparent, automatic, and hassle-free.',
    'hero.cta': 'Start Free Now',
    
    // Trust Badges
    'trust.secure': '🔒 Your Data is Completely Secure',
    'trust.mobile': '📱 Works on Mobile & Desktop',
    'trust.bangladesh': '🇧🇩 Built for Bangladeshi Messes',
    
    // Pricing
    'pricing.title': 'Complete Mess Management at the Price of a Cup of Tea',
    'pricing.monthly': 'Monthly',
    'pricing.yearly': 'Yearly',
    'pricing.perMonth': '/month',
    'pricing.perYear': '/year',
    'pricing.bestValue': 'Best Value',
    'pricing.features.unlimited': 'Unlimited Members',
    'pricing.features.auto': 'Auto Calculations',
    'pricing.features.reset': 'Monthly Reset',
    'pricing.features.support': '24/7 Support',
    'pricing.cta': 'Get Package',
    'pricing.coupon': 'Coupon Code',
    'pricing.apply': 'Apply',
    
    // Comparison
    'comparison.title': 'Compare',
    'comparison.manual': 'Manual Calculation 😓',
    'comparison.system': 'Our System 😌',
    'comparison.manual.1': 'Month-end disputes',
    'comparison.manual.2': 'Calculation errors',
    'comparison.manual.3': 'Fear of losing records',
    'comparison.manual.4': 'No transparency',
    'comparison.system.1': 'Automatic calculations',
    'comparison.system.2': 'Everyone sees their own',
    'comparison.system.3': 'Zero disputes',
    'comparison.system.4': 'Peaceful mess',
    
    // X-Factor
    'xfactor.title': 'Why Our System is Different?',
    'xfactor.1': '🔄 Auto meal rate calculation',
    'xfactor.2': '👀 Members see only their own data',
    'xfactor.3': '🔔 Low balance notifications',
    'xfactor.4': '📅 Auto monthly reset',
    
    // Steps
    'steps.title': 'Get Started in 3 Easy Steps',
    'steps.1.title': 'Choose a Package',
    'steps.1.desc': 'Select monthly or yearly plan based on your needs',
    'steps.2.title': 'Register',
    'steps.2.desc': 'Create account with email and password',
    'steps.3.title': 'Forget Account Hassles',
    'steps.3.desc': 'Start managing your mess',
    'steps.cta': 'Start Now',
    
    // Testimonial
    'testimonial.quote': '"Month-end disputes were constant before. Now the software shows all accounts."',
    'testimonial.author': '— A Mess Manager',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'What happens when subscription expires?',
    'faq.a1': 'You will be notified upon login and shown options to renew your subscription.',
    'faq.q2': 'Can members see other members\' accounts?',
    'faq.a2': 'No. Each member can only see their own accounts. 100% privacy guaranteed.',
    'faq.q3': 'Is the data secure?',
    'faq.a3': 'Yes. We use cloud secured system and all data is encrypted.',
    'faq.q4': 'Does it work on mobile?',
    'faq.a4': 'Yes. The website is fully mobile responsive and works on any device.',
    
    // Final CTA
    'finalCta.title': 'No Worries About Accounts—Stay Peaceful Now',
    'finalCta.button': 'Register Today',
    
    // Footer
    'footer.about': 'About Us',
    'footer.contact': 'Contact',
    'footer.refund': 'Refund Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.copyright': '© 2024 MessHishab. All rights reserved.',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.registerHere': 'Register here',
    'auth.loginHere': 'Login here',
    'auth.messId': 'Mess ID',
    'auth.messPassword': 'Mess Password',
    'auth.memberLogin': 'Member Login',
    'auth.managerLogin': 'Manager Login',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.language': 'Language',
    'common.theme': 'Theme',
    'common.light': 'Light',
    'common.dark': 'Dark',
    
    // Payment
    'payment.title': 'Payment',
    'payment.selectMethod': 'Select Payment Method',
    'payment.orderSummary': 'Order Summary',
    'payment.completePayment': 'Complete Payment',
    'payment.processing': 'Processing...',
    'payment.securePayment': 'Secure payment guaranteed',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('messhishab-language');
      return (saved as Language) || 'bn';
    }
    return 'bn';
  });

  useEffect(() => {
    localStorage.setItem('messhishab-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

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
    
    // About Page
    'about.title': 'আমাদের সম্পর্কে',
    'about.subtitle': 'মেস হিসাব পরিচালনার সহজ সমাধান',
    'about.whatIs.title': 'Mess Hishab কি?',
    'about.whatIs.content': 'Mess Hishab একটি আধুনিক ওয়েব অ্যাপ্লিকেশন যা বাংলাদেশের মেস (ব্যাচেলর হোস্টেল) ম্যানেজমেন্টের জন্য তৈরি। এটি মেসের দৈনন্দিন খরচ, মিল হিসাব, বাজার খরচ, এবং মেম্বারদের ব্যালেন্স স্বয়ংক্রিয়ভাবে হিসাব করে।',
    'about.whoFor.title': 'কাদের জন্য?',
    'about.whoFor.content': 'এই সিস্টেম মেস ম্যানেজার এবং মেম্বারদের জন্য ডিজাইন করা হয়েছে। ম্যানেজাররা সহজেই মিল, বাজার, এবং ডিপোজিট ট্র্যাক করতে পারেন। মেম্বাররা তাদের নিজস্ব হিসাব দেখতে পারেন এবং স্বচ্ছতা নিশ্চিত হয়।',
    'about.mission.title': 'আমাদের মিশন',
    'about.mission.content': 'আমাদের লক্ষ্য হলো মেসের হিসাব পরিচালনাকে সহজ, স্বচ্ছ এবং ঝামেলামুক্ত করা। খাতা-কলম বা এক্সেল শীটের বদলে একটি সহজ ডিজিটাল সমাধান প্রদান করা যা সবার জন্য সুলভ।',
    'about.feature1.title': 'সহজ ব্যবহার',
    'about.feature1.desc': 'কোনো প্রযুক্তিগত জ্ঞান ছাড়াই ব্যবহার করুন',
    'about.feature2.title': 'নির্ভুল হিসাব',
    'about.feature2.desc': 'স্বয়ংক্রিয় গণনায় ভুল হবার সুযোগ নেই',
    'about.feature3.title': 'সবার জন্য স্বচ্ছ',
    'about.feature3.desc': 'প্রতিটি মেম্বার নিজের হিসাব দেখতে পারে',
    
    // Contact Page
    'contact.title': 'যোগাযোগ করুন',
    'contact.subtitle': 'আমরা আপনাকে সাহায্য করতে প্রস্তুত',
    'contact.email.title': 'ইমেইল',
    'contact.email.desc': 'যেকোনো প্রশ্নের জন্য ইমেইল করুন',
    'contact.whatsapp.title': 'হোয়াটসঅ্যাপ',
    'contact.whatsapp.desc': 'দ্রুত সাপোর্টের জন্য মেসেজ করুন',
    'contact.support.title': 'সাপোর্ট সময়',
    'contact.support.desc': 'আমরা সকাল ৯টা থেকে রাত ১০টা পর্যন্ত সাপোর্ট দিয়ে থাকি। সাধারণত ২-৪ ঘন্টার মধ্যে উত্তর দেওয়া হয়।',
    'contact.form.title': 'মেসেজ পাঠান',
    'contact.form.name': 'আপনার নাম',
    'contact.form.namePlaceholder': 'নাম লিখুন',
    'contact.form.email': 'ইমেইল',
    'contact.form.emailPlaceholder': 'your@email.com',
    'contact.form.message': 'মেসেজ',
    'contact.form.messagePlaceholder': 'আপনার মেসেজ লিখুন...',
    'contact.form.submit': 'মেসেজ পাঠান',
    
    // Refund Page
    'refund.title': 'রিফান্ড পলিসি',
    'refund.subtitle': 'আমাদের রিফান্ড নীতিমালা সম্পর্কে জানুন',
    'refund.eligibility.title': 'রিফান্ডের যোগ্যতা',
    'refund.eligibility.item1': 'পেমেন্টের ৭ দিনের মধ্যে রিফান্ড অনুরোধ করতে হবে',
    'refund.eligibility.item2': 'সার্ভিস সমস্যার কারণে রিফান্ড প্রযোজ্য',
    'refund.eligibility.item3': 'প্রথমবার সাবস্ক্রিপশনে সন্তুষ্ট না হলে রিফান্ড পাবেন',
    'refund.timeline.title': 'রিফান্ড সময়সীমা',
    'refund.timeline.item1': 'রিফান্ড অনুরোধ প্রক্রিয়াকরণে ৩-৫ কার্যদিবস',
    'refund.timeline.item2': 'বিকাশ/নগদে ১-২ কার্যদিবসে টাকা ফেরত',
    'refund.timeline.item3': 'ব্যাংক ট্রান্সফারে ৫-৭ কার্যদিবস লাগতে পারে',
    'refund.nonRefundable.title': 'যেসব ক্ষেত্রে রিফান্ড প্রযোজ্য নয়',
    'refund.nonRefundable.item1': 'সাবস্ক্রিপশন ৭ দিনের বেশি ব্যবহার করলে',
    'refund.nonRefundable.item2': 'নীতিমালা লঙ্ঘনের কারণে অ্যাকাউন্ট বাতিল হলে',
    'refund.nonRefundable.item3': 'আংশিক সময়ের জন্য রিফান্ড পাওয়া যাবে না',
    'refund.contact.text': 'রিফান্ড অনুরোধ করতে যোগাযোগ করুন:',
    
    // Terms Page
    'terms.title': 'শর্তাবলী',
    'terms.subtitle': 'সার্ভিস ব্যবহারের নিয়মাবলী',
    'terms.intro': 'Mess Hishab ব্যবহার করে আপনি নিম্নলিখিত শর্তাবলী মেনে চলতে সম্মত হচ্ছেন। অনুগ্রহ করে মনোযোগ সহকারে পড়ুন।',
    'terms.usage.title': 'সার্ভিস ব্যবহার',
    'terms.usage.item1': 'শুধুমাত্র বৈধ মেস পরিচালনার উদ্দেশ্যে ব্যবহার করুন',
    'terms.usage.item2': 'সঠিক এবং আপডেট তথ্য প্রদান করুন',
    'terms.usage.item3': 'আপনার অ্যাকাউন্টের নিরাপত্তা নিজে বজায় রাখুন',
    'terms.usage.item4': 'অন্যের অ্যাকাউন্টে অননুমোদিত প্রবেশ করবেন না',
    'terms.subscription.title': 'সাবস্ক্রিপশন নিয়মাবলী',
    'terms.subscription.item1': 'সাবস্ক্রিপশন স্বয়ংক্রিয়ভাবে নবায়ন হবে না',
    'terms.subscription.item2': 'মেয়াদ শেষে নতুন সাবস্ক্রিপশন নিতে হবে',
    'terms.subscription.item3': 'মেয়াদ শেষ হলে ডাটা অক্ষত থাকবে',
    'terms.subscription.item4': 'যেকোনো সময় সাবস্ক্রিপশন আপগ্রেড করতে পারবেন',
    'terms.payment.title': 'পেমেন্ট দায়িত্ব',
    'terms.payment.item1': 'সঠিক পেমেন্ট তথ্য প্রদান করা আপনার দায়িত্ব',
    'terms.payment.item2': 'পেমেন্ট নিশ্চিত হলে সাবস্ক্রিপশন সক্রিয় হবে',
    'terms.payment.item3': 'ভুল তথ্যে পেমেন্ট বাতিল হলে আমরা দায়ী নই',
    'terms.suspension.title': 'অ্যাকাউন্ট স্থগিতকরণ',
    'terms.suspension.item1': 'নীতিমালা লঙ্ঘনে অ্যাকাউন্ট স্থগিত করা হতে পারে',
    'terms.suspension.item2': 'অবৈধ কার্যকলাপে স্থায়ী নিষেধাজ্ঞা প্রযোজ্য',
    'terms.suspension.item3': 'স্থগিতকরণের আগে নোটিশ দেওয়া হবে',
    'terms.lastUpdated': 'সর্বশেষ আপডেট: জানুয়ারি ২০২৫',
    
    // Privacy Page
    'privacy.title': 'প্রাইভেসি পলিসি',
    'privacy.subtitle': 'আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ',
    'privacy.intro': 'আমরা আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। এই নীতিমালায় আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি তা বর্ণনা করা হয়েছে।',
    'privacy.collection.title': 'তথ্য সংগ্রহ',
    'privacy.collection.item1': 'রেজিস্ট্রেশনের সময় ইমেইল সংগ্রহ করি',
    'privacy.collection.item2': 'মেস পরিচালনার জন্য প্রয়োজনীয় তথ্য',
    'privacy.collection.item3': 'পেমেন্ট সংক্রান্ত তথ্য (সুরক্ষিতভাবে)',
    'privacy.usage.title': 'তথ্য ব্যবহার',
    'privacy.usage.item1': 'সার্ভিস প্রদান এবং উন্নতির জন্য',
    'privacy.usage.item2': 'অ্যাকাউন্ট ও পেমেন্ট সংক্রান্ত যোগাযোগ',
    'privacy.usage.item3': 'সমস্যা সমাধান ও সাপোর্ট প্রদান',
    'privacy.protection.title': 'তথ্য সুরক্ষা',
    'privacy.protection.item1': 'সব তথ্য এনক্রিপ্টেড সার্ভারে সংরক্ষিত',
    'privacy.protection.item2': 'SSL সার্টিফিকেট দ্বারা নিরাপদ সংযোগ',
    'privacy.protection.item3': 'তৃতীয় পক্ষের কাছে তথ্য বিক্রি করা হয় না',
    'privacy.rights.title': 'আপনার অধিকার',
    'privacy.rights.item1': 'নিজের তথ্য দেখা ও আপডেট করার অধিকার',
    'privacy.rights.item2': 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারেন',
    'privacy.rights.item3': 'তথ্য ব্যবহারে আপত্তি জানাতে পারেন',
    'privacy.contact.text': 'প্রাইভেসি সংক্রান্ত প্রশ্নে যোগাযোগ করুন:',
    'privacy.lastUpdated': 'সর্বশেষ আপডেট: জানুয়ারি ২০২৫',
    
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
    
    // About Page
    'about.title': 'About Us',
    'about.subtitle': 'The simple solution for mess accounting',
    'about.whatIs.title': 'What is Mess Hishab?',
    'about.whatIs.content': 'Mess Hishab is a modern web application designed for managing messes (bachelor hostels) in Bangladesh. It automatically calculates daily expenses, meal counts, grocery costs, and member balances.',
    'about.whoFor.title': 'Who is it for?',
    'about.whoFor.content': 'This system is designed for mess managers and members. Managers can easily track meals, groceries, and deposits. Members can view their own accounts, ensuring transparency.',
    'about.mission.title': 'Our Mission',
    'about.mission.content': 'Our goal is to make mess accounting simple, transparent, and hassle-free. Instead of notebooks or Excel sheets, we provide an easy digital solution that is accessible to everyone.',
    'about.feature1.title': 'Easy to Use',
    'about.feature1.desc': 'No technical knowledge required',
    'about.feature2.title': 'Accurate Calculations',
    'about.feature2.desc': 'No room for errors with automatic calculations',
    'about.feature3.title': 'Transparent for All',
    'about.feature3.desc': 'Every member can see their own accounts',
    
    // Contact Page
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are ready to help you',
    'contact.email.title': 'Email',
    'contact.email.desc': 'Email us for any questions',
    'contact.whatsapp.title': 'WhatsApp',
    'contact.whatsapp.desc': 'Message us for quick support',
    'contact.support.title': 'Support Hours',
    'contact.support.desc': 'We provide support from 9 AM to 10 PM. Usually respond within 2-4 hours.',
    'contact.form.title': 'Send a Message',
    'contact.form.name': 'Your Name',
    'contact.form.namePlaceholder': 'Enter your name',
    'contact.form.email': 'Email',
    'contact.form.emailPlaceholder': 'your@email.com',
    'contact.form.message': 'Message',
    'contact.form.messagePlaceholder': 'Write your message...',
    'contact.form.submit': 'Send Message',
    
    // Refund Page
    'refund.title': 'Refund Policy',
    'refund.subtitle': 'Learn about our refund policies',
    'refund.eligibility.title': 'Refund Eligibility',
    'refund.eligibility.item1': 'Refund request must be made within 7 days of payment',
    'refund.eligibility.item2': 'Refunds apply for service-related issues',
    'refund.eligibility.item3': 'First-time subscribers get refund if not satisfied',
    'refund.timeline.title': 'Refund Timeline',
    'refund.timeline.item1': 'Refund request processing takes 3-5 business days',
    'refund.timeline.item2': 'bKash/Nagad refunds in 1-2 business days',
    'refund.timeline.item3': 'Bank transfers may take 5-7 business days',
    'refund.nonRefundable.title': 'Non-Refundable Cases',
    'refund.nonRefundable.item1': 'Subscription used for more than 7 days',
    'refund.nonRefundable.item2': 'Account cancelled due to policy violation',
    'refund.nonRefundable.item3': 'Partial period refunds are not available',
    'refund.contact.text': 'To request a refund, contact us at:',
    
    // Terms Page
    'terms.title': 'Terms & Conditions',
    'terms.subtitle': 'Rules for using our service',
    'terms.intro': 'By using Mess Hishab, you agree to the following terms and conditions. Please read carefully.',
    'terms.usage.title': 'Service Usage',
    'terms.usage.item1': 'Use only for legitimate mess management purposes',
    'terms.usage.item2': 'Provide accurate and updated information',
    'terms.usage.item3': 'Maintain your account security',
    'terms.usage.item4': 'Do not access other accounts without authorization',
    'terms.subscription.title': 'Subscription Rules',
    'terms.subscription.item1': 'Subscriptions do not auto-renew',
    'terms.subscription.item2': 'New subscription required after expiry',
    'terms.subscription.item3': 'Data remains intact after expiry',
    'terms.subscription.item4': 'Upgrade subscription anytime',
    'terms.payment.title': 'Payment Responsibility',
    'terms.payment.item1': 'Providing correct payment info is your responsibility',
    'terms.payment.item2': 'Subscription activates after payment confirmation',
    'terms.payment.item3': 'We are not liable for incorrect payment info',
    'terms.suspension.title': 'Account Suspension',
    'terms.suspension.item1': 'Account may be suspended for policy violations',
    'terms.suspension.item2': 'Permanent ban for illegal activities',
    'terms.suspension.item3': 'Notice will be given before suspension',
    'terms.lastUpdated': 'Last updated: January 2025',
    
    // Privacy Page
    'privacy.title': 'Privacy Policy',
    'privacy.subtitle': 'Your privacy is important to us',
    'privacy.intro': 'We are committed to protecting your personal information. This policy describes how we collect, use, and protect your data.',
    'privacy.collection.title': 'Data Collection',
    'privacy.collection.item1': 'Email collected during registration',
    'privacy.collection.item2': 'Information necessary for mess management',
    'privacy.collection.item3': 'Payment information (securely stored)',
    'privacy.usage.title': 'Data Usage',
    'privacy.usage.item1': 'To provide and improve services',
    'privacy.usage.item2': 'Account and payment related communication',
    'privacy.usage.item3': 'Problem solving and support',
    'privacy.protection.title': 'Data Protection',
    'privacy.protection.item1': 'All data stored on encrypted servers',
    'privacy.protection.item2': 'Secure connection via SSL certificate',
    'privacy.protection.item3': 'Data is never sold to third parties',
    'privacy.rights.title': 'Your Rights',
    'privacy.rights.item1': 'Right to view and update your data',
    'privacy.rights.item2': 'Request account deletion',
    'privacy.rights.item3': 'Object to data usage',
    'privacy.contact.text': 'For privacy questions, contact us at:',
    'privacy.lastUpdated': 'Last updated: January 2025',
    
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

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
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

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Info, CreditCard, Smartphone, Building2 } from 'lucide-react';

export function SSLCommerzContent() {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#2563EB]/5 border border-[#2563EB]/20">
        <Info className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" />
        <div className="space-y-4 text-sm leading-relaxed">
          {language === 'bn' ? (
            <>
              <p className="font-medium text-foreground">পেমেন্ট করার নিয়মঃ</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">১.</span>
                  <span>পেমেন্ট অপশন হিসেবে SSL Commerz ক্লিক করো,</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">২.</span>
                  <span>"Complete Payment" বাটনে ক্লিক করো</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">৩.</span>
                  <span>SSL Commerz এর একটি Pop Up প্যানেল আসবে।</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">৪.</span>
                  <span>সেখান থেকে Cards, Mobile Banking, Net Banking যে কোন একটি অপশন সিলেক্ট করো।</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">৫.</span>
                  <span>পরবর্তী অপশন অনুসরণ করে পেমেন্ট কমপ্লিট করে ফেলো।</span>
                </li>
              </ul>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">How to pay:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">1.</span>
                  <span>Select SSL Commerz as payment option.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">2.</span>
                  <span>Click the "Complete Payment" button.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">3.</span>
                  <span>An SSL Commerz popup panel will appear.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">4.</span>
                  <span>Choose from Cards, Mobile Banking, or Net Banking.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2563EB] font-bold">5.</span>
                  <span>Follow the steps to complete the payment.</span>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Available Payment Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#2563EB]" />
            </div>
            <span className="font-medium text-sm">Cards</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Visa, Debit, Credit & Prepaid
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#E2136E]/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#E2136E]" />
            </div>
            <span className="font-medium text-sm">Mobile Banking</span>
          </div>
          <p className="text-xs text-muted-foreground">
            bKash, Rocket, Nagad, Mcash
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-success" />
            </div>
            <span className="font-medium text-sm">Net Banking</span>
          </div>
          <p className="text-xs text-muted-foreground">
            City, BRAC, MTB, Islami Bank
          </p>
        </div>
      </div>
    </motion.div>
  );
}

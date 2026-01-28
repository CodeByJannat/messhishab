import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Info } from 'lucide-react';

export function BkashPaymentContent() {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#E2136E]/5 border border-[#E2136E]/20">
        <Info className="w-5 h-5 text-[#E2136E] mt-0.5 shrink-0" />
        <div className="space-y-4 text-sm leading-relaxed">
          {language === 'bn' ? (
            <>
              <p className="font-medium text-foreground">
                বিকাশ পেমেন্ট হচ্ছে ডিরেক্ট বিকাশ পেমেন্ট:
              </p>
              <p className="text-muted-foreground">
                ম্যানুয়াল বিকাশ ও বিকাশ পেমেন্ট পার্থক্য হচ্ছে, মানুয়াল বিকাশে আপনি টাকা পাঠিয়ে আমাদের ইনফরমেশন দিচ্ছেন, আর বিকাশ পেমেন্ট এ আমাদের ওয়েবসাইটএ এসে বিকাশে ডিরেক্ট পেমেন্ট করছেন।
              </p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">পেমেন্ট করার নিয়মঃ</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">১.</span>
                    <span>Bkash Payment সিলেক্ট করে কমপ্লিট পেমেন্ট বাটনে ক্লিক করলে বিকাশ পেমেন্ট Popup ওপেন হবে।</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">২.</span>
                    <span>আপনি যে নাম্বার থেকে পেমেন্ট করবেন সেই বিকাশ নাম্বার দিতে হবে।</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">৩.</span>
                    <span>বিকাশ ভেরিফিকেশন কোড পাঠাবে আপনার মোবাইলে সেটি বসাতে হবে।</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">৪.</span>
                    <span>এমাউন্ট দেখে সব কিছু ঠিক থাকলে পিন কোড দিতে বলবে বিকাশ।</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">৫.</span>
                    <span>Confirm এ ক্লিক করলে পেমেন্ট হয়ে যাবে, আপনার অ্যাকাউন্ট থেকে।</span>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">
                bKash Payment is Direct Payment:
              </p>
              <p className="text-muted-foreground">
                The difference between Manual bKash and bKash Payment is that in Manual bKash you send money and provide us the information, while in bKash Payment you make direct payment through our website.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">How to pay:</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">1.</span>
                    <span>Select Bkash Payment and click Complete Payment button to open the bKash popup.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">2.</span>
                    <span>Enter the bKash number from which you want to pay.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">3.</span>
                    <span>Enter the verification code sent to your mobile.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">4.</span>
                    <span>Review the amount and enter your PIN when prompted.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#E2136E] font-bold">5.</span>
                    <span>Click Confirm to complete the payment from your account.</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

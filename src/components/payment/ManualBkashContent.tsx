import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bkashQrCode from '@/assets/bkash-qr-code.jpg';

interface ManualBkashContentProps {
  totalAmount: number;
  messName: string;
  bkashNumber: string;
  trxId: string;
  onBkashNumberChange: (value: string) => void;
  onTrxIdChange: (value: string) => void;
}

export function ManualBkashContent({
  totalAmount,
  messName,
  bkashNumber,
  trxId,
  onBkashNumberChange,
  onTrxIdChange,
}: ManualBkashContentProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
        description: text,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'কপি করা যায়নি' : 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Input Fields */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="bkash-number" className="text-sm font-medium">
            {language === 'bn' ? 'বিকাশ নাম্বার' : 'bKash Number'}
          </Label>
          <Input
            id="bkash-number"
            type="tel"
            placeholder={language === 'bn' ? '01XXXXXXXXX' : '01XXXXXXXXX'}
            value={bkashNumber}
            onChange={(e) => onBkashNumberChange(e.target.value)}
            className="h-12 rounded-xl border-2 focus:border-[#E2136E] focus:ring-[#E2136E]/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trx-id" className="text-sm font-medium">
            {language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
          </Label>
          <Input
            id="trx-id"
            type="text"
            placeholder={language === 'bn' ? 'যেমন: ABC123XYZ' : 'e.g., ABC123XYZ'}
            value={trxId}
            onChange={(e) => onTrxIdChange(e.target.value.toUpperCase())}
            className="h-12 rounded-xl border-2 focus:border-[#E2136E] focus:ring-[#E2136E]/20 uppercase"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-[#E2136E]/5 border border-[#E2136E]/20 space-y-4">
        <div className="flex items-center gap-2 text-[#E2136E]">
          <Info className="w-5 h-5" />
          <span className="font-medium">
            {language === 'bn' ? 'পেমেন্ট করার নিয়মঃ' : 'Payment Instructions:'}
          </span>
        </div>
        
        <div className="space-y-3 text-sm">
          {/* bKash Number */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/80">
            <div>
              <span className="text-muted-foreground">
                {language === 'bn' ? 'বিকাশ নাম্বারঃ' : 'bKash Number:'}
              </span>
              <span className="ml-2 font-semibold text-foreground">01732854793</span>
            </div>
            <CopyButton text="01732854793" field="bkash" />
          </div>

          {/* Steps */}
          <div className="space-y-2 text-muted-foreground leading-relaxed">
            <p className="flex gap-2">
              <span className="text-[#E2136E] font-bold shrink-0">১.</span>
              <span>
                {language === 'bn' 
                  ? '*247# ডায়াল করো বা বিকাশ মোবাইল অ্যাপ-এ যাও।'
                  : 'Dial *247# or open the bKash mobile app.'}
              </span>
            </p>
            <p className="flex gap-2">
              <span className="text-[#E2136E] font-bold shrink-0">২.</span>
              <span>
                {language === 'bn' 
                  ? 'সেন্ড মানি অপশন সিলেক্ট করো।'
                  : 'Select Send Money option.'}
              </span>
            </p>
          </div>

          {/* Copyable fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/80">
              <div>
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'আমাদের বিকাশ নাম্বারঃ' : 'Our bKash Number:'}
                </span>
                <span className="ml-2 font-semibold text-foreground">01732854793</span>
              </div>
              <CopyButton text="01732854793" field="number2" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-background/80">
              <div>
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'টাকার পরিমানঃ' : 'Amount:'}
                </span>
                <span className="ml-2 font-semibold text-primary">৳{totalAmount}</span>
              </div>
              <CopyButton text={totalAmount.toString()} field="amount" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-background/80">
              <div>
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'রেফারেন্সঃ' : 'Reference:'}
                </span>
                <span className="ml-2 font-semibold text-foreground">{messName || 'MessHishab'}</span>
              </div>
              <CopyButton text={messName || 'MessHishab'} field="reference" />
            </div>
          </div>

          {/* Final steps */}
          <div className="space-y-2 text-muted-foreground leading-relaxed pt-2">
            <p className="flex gap-2">
              <span className="text-[#E2136E] font-bold shrink-0">৩.</span>
              <span>
                {language === 'bn' 
                  ? 'তোমার পিন নাম্বার দিয়ে পেমেন্ট কমপ্লিট করো।'
                  : 'Complete payment with your PIN.'}
              </span>
            </p>
            <p className="flex gap-2">
              <span className="text-[#E2136E] font-bold shrink-0">৪.</span>
              <span>
                {language === 'bn' 
                  ? 'যে নাম্বার থেকে বিকাশ করেছ তা এবং ট্রানজেকশন আইডি/TrxID, উপরের ফর্মে ফিলাপ করে দাও।'
                  : 'Fill in the bKash number and Transaction ID in the form above.'}
              </span>
            </p>
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs">
            {language === 'bn' 
              ? "⚠️ ট্রানজেকশন আইডি/TrxID দেওয়ার সময় অবশ্যই ভাল করে খেয়াল করে, জিরো '0', ইংরেজি 'o', বড় হাতের 'I' ও ছোট হাতের 'l' দেখে দিবে। সাধারন ভাবে ট্রানজেকশন আইডি বড় হাতের অক্ষরে দেওয়া থাকে।"
              : "⚠️ When entering the TrxID, carefully distinguish between zero '0' and letter 'o', uppercase 'I' and lowercase 'l'. Transaction IDs are usually in uppercase."}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E2136E]/5 to-[#E2136E]/10 border border-[#E2136E]/20">
        <div className="text-center space-y-4">
          <h4 className="font-semibold text-foreground">
            {language === 'bn' ? 'অথবা QR কোড স্ক্যান করুন' : 'Or Scan QR Code'}
          </h4>
          <div className="inline-block p-3 bg-white rounded-2xl shadow-lg">
            <img 
              src={bkashQrCode} 
              alt="bKash QR Code" 
              className="w-48 h-auto rounded-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'bn' 
              ? 'সেন্ড মানি করতে বিকাশ অ্যাপ দিয়ে QR কোডটি স্ক্যান করুন'
              : 'Scan this QR code with bKash app to send money'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

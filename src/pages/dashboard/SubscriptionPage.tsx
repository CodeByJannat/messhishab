import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePricing } from "@/hooks/usePricing";
import { useCoupon } from "@/hooks/useCoupon";
import { CreditCard, Calendar, Tag, Check, Clock, Shield, ArrowRight, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { subscription, mess } = useAuth();
  const { toast } = useToast();
  const { pricing, isLoading: isPricingLoading } = usePricing();
  const { appliedCoupon, isApplying, validateAndApplyCoupon, clearCoupon, calculateDiscount } = useCoupon();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [couponCode, setCouponCode] = useState("");

  const basePrice = selectedPlan === "yearly" ? pricing.yearly_price : pricing.monthly_price;
  const { discountAmount, finalPrice } = calculateDiscount(basePrice);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    await validateAndApplyCoupon(couponCode, basePrice);
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    setCouponCode("");
  };

  const handleProceedToPayment = () => {
    // Navigate to payment page with plan info
    navigate("/manager/payment", {
      state: {
        plan: selectedPlan,
        coupon: appliedCoupon,
        finalPrice,
        basePrice,
        discountAmount,
      },
    });
  };

  const isActive = subscription?.status === "active" && new Date(subscription.end_date) > new Date();
  const daysRemaining = subscription
    ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{language === "bn" ? "সাবস্ক্রিপশন" : "Subscription"}</h1>
          <p className="text-muted-foreground">
            {language === "bn" ? "আপনার সাবস্ক্রিপশন পরিচালনা করুন" : "Manage your subscription"}
          </p>
        </div>

        {/* Current Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {language === "bn" ? "বর্তমান অবস্থা" : "Current Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Badge variant={isActive ? "default" : "destructive"} className="text-sm px-3 py-1">
                  {isActive ? (language === "bn" ? "সক্রিয়" : "Active") : language === "bn" ? "মেয়াদ শেষ" : "Expired"}
                </Badge>
                <span className="text-muted-foreground">
                  {subscription?.type === "yearly"
                    ? language === "bn"
                      ? "বার্ষিক প্ল্যান"
                      : "Yearly Plan"
                    : language === "bn"
                      ? "মাসিক প্ল্যান"
                      : "Monthly Plan"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {language === "bn" ? "মেয়াদ শেষ: " : "Expires: "}
                  {subscription ? format(new Date(subscription.end_date), "dd MMM yyyy") : "N/A"}
                </span>
              </div>
              {isActive && daysRemaining > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{language === "bn" ? `${daysRemaining} দিন বাকি` : `${daysRemaining} days remaining`}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              className={`glass-card cursor-pointer transition-all ${
                selectedPlan === "monthly" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === "bn" ? "মাসিক" : "Monthly"}</span>
                  {selectedPlan === "monthly" && <Check className="w-5 h-5 text-primary" />}
                </CardTitle>
                <CardDescription>{language === "bn" ? "প্রতি মাসে পে করুন" : "Pay every month"}</CardDescription>
              </CardHeader>
              <CardContent>
                {isPricingLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">
                    ৳{pricing.monthly_price}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{language === "bn" ? "মাস" : "month"}
                    </span>
                  </div>
                )}
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {language === "bn" ? "সব ফিচার" : "All features"}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {language === "bn" ? "আনলিমিটেড মেম্বার" : "Unlimited members"}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              className={`glass-card cursor-pointer transition-all relative overflow-hidden ${
                selectedPlan === "yearly" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedPlan("yearly")}
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                {language === "bn" ? "বেস্ট ভ্যালু" : "Best Value"}
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === "bn" ? "বার্ষিক" : "Yearly"}</span>
                  {selectedPlan === "yearly" && <Check className="w-5 h-5 text-primary" />}
                </CardTitle>
                <CardDescription>{language === "bn" ? "২ মাস ফ্রি!" : "2 months free!"}</CardDescription>
              </CardHeader>
              <CardContent>
                {isPricingLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">
                    ৳{pricing.yearly_price}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{language === "bn" ? "বছর" : "year"}
                    </span>
                  </div>
                )}
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {language === "bn" ? "সব ফিচার" : "All features"}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {language === "bn" ? "আনলিমিটেড মেম্বার" : "Unlimited members"}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {language === "bn" ? "১৭% সাশ্রয়" : "17% savings"}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Coupon & Payment */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              {language === "bn" ? "কুপন ও পেমেন্ট" : "Coupon & Payment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coupon Input */}
            <div className="flex gap-2">
              <Input
                placeholder={language === "bn" ? "কুপন কোড লিখুন" : "Enter coupon code"}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
                disabled={isApplying || !!appliedCoupon}
              />
              {appliedCoupon ? (
                <Button variant="outline" onClick={handleRemoveCoupon}>
                  <X className="w-4 h-4 mr-1" />
                  {language === "bn" ? "সরান" : "Remove"}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleApplyCoupon} disabled={isApplying || !couponCode.trim()}>
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : language === "bn" ? (
                    "প্রয়োগ করুন"
                  ) : (
                    "Apply"
                  )}
                </Button>
              )}
            </div>

            {appliedCoupon && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-primary">{appliedCoupon.code}</span>
                    <p className="text-sm text-muted-foreground">{appliedCoupon.description}</p>
                  </div>
                  <Badge variant="secondary">
                    {appliedCoupon.discount_type === "percentage"
                      ? `${appliedCoupon.discount_value}% OFF`
                      : `৳${appliedCoupon.discount_value} OFF`}
                  </Badge>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedPlan === "yearly"
                    ? language === "bn"
                      ? "বার্ষিক প্ল্যান"
                      : "Yearly Plan"
                    : language === "bn"
                      ? "মাসিক প্ল্যান"
                      : "Monthly Plan"}
                </span>
                <span>৳{basePrice}</span>
              </div>
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>{language === "bn" ? "ডিসকাউন্ট" : "Discount"}</span>
                  <span>-৳{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-border pt-2 mt-2">
                <span>{language === "bn" ? "মোট" : "Total"}</span>
                <span>৳{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Button */}
            <Button className="w-full h-12 rounded-xl text-base font-semibold" onClick={handleProceedToPayment}>
              <CreditCard className="w-5 h-5 mr-2" />
              {language === "bn" ? "পেমেন্ট করুন" : "Make Payment"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Contact for Manual Payment */}
        <Card className="glass-card border-primary/20">
          <CardContent className="py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "ম্যানুয়াল পেমেন্টের জন্য যোগাযোগ করুন: " : "For manual payment, contact: "}
                <a href="tel:+8801732854793" className="text-primary font-medium">
                  +880 1732-854793
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

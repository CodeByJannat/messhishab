import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustBadges } from '@/components/landing/TrustBadges';
import { PricingSection } from '@/components/landing/PricingSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { XFactorSection } from '@/components/landing/XFactorSection';
import { StepsSection } from '@/components/landing/StepsSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { Footer } from '@/components/landing/Footer';
import { PromotionModal } from '@/components/landing/PromotionModal';

const Index = () => {
  return (
    <div className="min-h-screen">
      <PromotionModal />
      <Navbar />
      <HeroSection />
      <TrustBadges />
      <PricingSection />
      <ComparisonSection />
      <XFactorSection />
      <StepsSection />
      <TestimonialSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default Index;

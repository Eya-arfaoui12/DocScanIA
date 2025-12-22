// pages/Home.tsx
import PageMeta from "../components/common/PageMeta";
import HeroSection from "../components/home/HeroSection";
import BenefitsSection  from "../components/home/BenefitsSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import CTASection from "../components/home/CTASection";
import FeaturesSection  from "../components/home/FeaturesSection";




export default function Home() {
  return (
    <>
      <PageMeta
        title="DocScan - Scanner et Classification Intelligente de Documents"
        description="Solution professionnelle de numérisation et classification automatique de documents avec IA"
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* HeroSection contient le Header */}
      <HeroSection />
      
      {/* ✅ Section Features avec ID pour navigation */}
      <div id="features">
        <FeaturesSection />
      </div>
      
      {/* ✅ Section How it Works avec ID pour navigation */}
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      
      {/* ✅ Section Benefits avec ID pour navigation */}
      <div id="benefits">
        <BenefitsSection />
      </div>
      
      {/* ✅ Section Pricing avec ID pour navigation */}
      <div id="pricing">
        <CTASection />
      </div>
    </div>
    </>
  );
}
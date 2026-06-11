import React from 'react';
import HeroSection from '../../landing/components/HeroSection.jsx';
import BusinessFeatures from '../../landing/components/BusinessFeatures.jsx';
import ProductCategories from '../../landing/components/ProductCategories.jsx';
import WholesaleDeals from '../../landing/components/WholesaleDeals.jsx';
import PlatformShowcase from '../../landing/components/PlatformShowcase.jsx';
import SocialProof from '../../landing/components/SocialProof.jsx';
import CTASection from '../../landing/components/CTASection.jsx';
import MobileAppPromotion from '../../landing/components/MobileAppPromotion.jsx';

const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <BusinessFeatures />
      <ProductCategories />
      <WholesaleDeals />
      <PlatformShowcase />
      <SocialProof />
      <CTASection />
      <MobileAppPromotion />
    </>
  );
};

export default LandingPage;
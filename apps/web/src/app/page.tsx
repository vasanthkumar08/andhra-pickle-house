import dynamic from 'next/dynamic';
import { Footer } from '@/components/layout/Footer';

const CinematicHero = dynamic(() =>
  import('@/components/hero/CinematicHero').then((m) => ({ default: m.CinematicHero }))
);
const BrandStory = dynamic(() =>
  import('@/components/sections/BrandStory').then((m) => ({ default: m.BrandStory }))
);
const WhyHomemade = dynamic(() =>
  import('@/components/sections/WhyHomemade').then((m) => ({ default: m.WhyHomemade }))
);
const IngredientsShowcase = dynamic(() =>
  import('@/components/sections/IngredientsShowcase').then((m) => ({ default: m.IngredientsShowcase }))
);
const ProductGrid = dynamic(() =>
  import('@/components/sections/ProductGrid').then((m) => ({ default: m.ProductGrid }))
);
const Testimonials = dynamic(() =>
  import('@/components/sections/Testimonials').then((m) => ({ default: m.Testimonials }))
);
const TrustSection = dynamic(() =>
  import('@/components/sections/TrustSection').then((m) => ({ default: m.TrustSection }))
);
const FAQ = dynamic(() =>
  import('@/components/sections/FAQ').then((m) => ({ default: m.FAQ }))
);

export default function HomePage() {
  return (
    <main>
      <CinematicHero />
      <ProductGrid />
      <BrandStory />
      <WhyHomemade />
      <IngredientsShowcase />
      <Testimonials />
      <TrustSection />
      <FAQ />
      <Footer />
    </main>
  );
}

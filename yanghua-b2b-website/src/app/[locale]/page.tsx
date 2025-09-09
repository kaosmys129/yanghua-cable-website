import Hero from '@/components/business/Hero';
import CompanyStrength from '@/components/business/CompanyStrength';
import ApplicationAreas from '@/components/business/ApplicationAreas';
import ProductComparison from '@/components/ui/flexible_busbar_comparison';
import Partners from '@/components/business/Partners';
import InquiryForm from '@/components/features/InquiryForm';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <CompanyStrength />
      <ProductComparison />
      <ApplicationAreas />
      <Partners />
      <InquiryForm />
    </div>
  );
}

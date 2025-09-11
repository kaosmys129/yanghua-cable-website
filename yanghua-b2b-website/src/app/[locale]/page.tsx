import Hero from '@/components/business/Hero';
import CompanyStrength from '@/components/business/CompanyStrength';
import ApplicationAreas from '@/components/business/ApplicationAreas';
import ProductComparison from '@/components/ui/flexible_busbar_comparison';
import Partners from '@/components/business/Partners';
import InquiryForm from '@/components/features/InquiryForm';
import ProjectGallery from '@/components/business/ProjectGallery';
import { getFeaturedProjects } from '@/lib/projects';

export default function Home() {
  const featuredProjects = getFeaturedProjects(4);
  return (
    <div className="min-h-screen">
      <Hero />
      <CompanyStrength />
      <ProductComparison />
      <ApplicationAreas />
      <ProjectGallery projects={featuredProjects} />
      <Partners />
      <InquiryForm />
    </div>
  );
}

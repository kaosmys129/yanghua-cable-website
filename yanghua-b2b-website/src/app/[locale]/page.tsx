import Hero from '@/components/business/Hero';
import CompanyStrength from '@/components/business/CompanyStrength';
import ApplicationAreas from '@/components/business/ApplicationAreas';
import ProductComparison from '@/components/ui/FlexibleBusbarComparison';
import Partners from '@/components/business/Partners';
import InquiryForm from '@/components/features/InquiryForm';
import ProjectGallery from '@/components/business/ProjectGallery';
import { getFeaturedProjects } from '@/lib/projects';
import { getCsrfToken } from '@/lib/security/csrf';

export default async function Home() {
  const featuredProjects = getFeaturedProjects(4);
  const csrfToken = getCsrfToken();
  return (
    <div className="min-h-screen">
      <Hero />
      <CompanyStrength />
      <ProductComparison />
      <ApplicationAreas />
      <ProjectGallery projects={featuredProjects} />
      <Partners />
      <InquiryForm csrfToken={csrfToken} />
    </div>
  );
}

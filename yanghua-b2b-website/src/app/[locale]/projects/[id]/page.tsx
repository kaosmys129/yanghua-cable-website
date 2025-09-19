import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Calendar, Users, TrendingUp } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  challenge: string;
  solution: string;
  results: { metric: string; value: string }[];
  products: string[];
  images: string[];
  testimonial?: {
    text: string;
    author: string;
    position: string;
  };
}

// Get image source with fallback - map project titles to actual image filenames
function getProjectImageSrc(title: string): string {
  const imageMap: { [key: string]: string } = {
    'Huawei Data Center Expansion': 'huawei-data-center-expansion.webp',
    'BYD Battery Manufacturing': 'byd-battery-manufacturing.webp',
    'CATL Energy Storage': 'catl-energy-storage.webp',
    'Midea Industrial Complex': 'midea-industrial-complex.webp',
    'Metro Line 14': 'shenzhen-metro.webp',
    'Steel Mill Modernization': 'steel-mill.webp',
    '50MW Solar Farm Power Distribution': '50MW Solar Farm Power Distribution.webp'
  };
  
  const imageName = imageMap[title];
  if (imageName) {
    return `/images/projects/${imageName}`;
  } else {
    return '/images/no-image-available.webp';
  }
}

// Get project data from static data
async function getProject(id: string): Promise<Project | null> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public/data/projects_complete_content.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const projectIndex = parseInt(id) - 1;
    if (isNaN(projectIndex) || projectIndex < 0 || projectIndex >= data.projects.length) {
      console.warn(`Project with ID ${id} not found (index: ${projectIndex})`);
      return getFallbackProject(id);
    }
    
    const project = data.projects[projectIndex];
    return {
      id: id,
      title: project.title,
      client: project.metadata?.client || 'N/A',
      industry: project.metadata?.industry || 'N/A',
      location: project.metadata?.location || 'N/A',
      duration: project.metadata?.duration || 'N/A',
      completionDate: project.metadata?.completion_date || project.created_at,
      projectScale: project.metadata?.project_scale || 'N/A',
      challenge: 'Advanced power distribution requirements for modern infrastructure',
      solution: project.content || project.description,
      results: [
        { metric: 'Power Efficiency', value: project.metadata?.power_efficiency || '95%' },
        { metric: 'Space Savings', value: project.metadata?.space_savings || '40%' },
        { metric: 'Installation Speed', value: project.metadata?.installation_speed || '50% faster' },
        { metric: 'Maintenance Reduction', value: project.metadata?.maintenance_reduction || '30%' }
      ],
      products: project.metadata?.products_used || ['Flexible Busbar System'],
      images: [getProjectImageSrc(project.title)],
      testimonial: project.metadata?.testimonial ? {
        text: project.metadata.testimonial,
        author: project.metadata.testimonial_author || 'Client',
        position: project.metadata.testimonial_position || 'Project Manager'
      } : undefined
    };
  } catch (error) {
    console.error('Error loading project data:', error);
    return getFallbackProject(id);
  }
}

function transformStrapiProject(strapiProject: any): Project {
  return {
    id: strapiProject.id.toString(),
    title: strapiProject.attributes.title,
    client: strapiProject.attributes.client,
    industry: strapiProject.attributes.industry?.data?.attributes?.name || strapiProject.attributes.industry || '',
    location: strapiProject.attributes.location,
    duration: strapiProject.attributes.duration,
    completionDate: strapiProject.attributes.completionDate,
    projectScale: strapiProject.attributes.projectScale,
    challenge: strapiProject.attributes.challenge,
    solution: strapiProject.attributes.solution,
    results: strapiProject.attributes.results || [],
    products: strapiProject.attributes.products?.data?.map((p: any) => p.attributes.name) || strapiProject.attributes.products || [],
    images: strapiProject.attributes.images?.data?.map((img: any) => img.attributes.url) || strapiProject.attributes.images || [],
    testimonial: strapiProject.attributes.testimonial
  };
}

// Fallback function for static data
function getFallbackProject(id: string): Project | null {
  const projects: Record<string, Project> = {
    '1': {
      id: '1',
      title: 'Huawei Data Center Expansion',
      client: 'Huawei Technologies',
      industry: 'Technology',
      location: 'Shenzhen, China',
      duration: '18 months',
      completionDate: '2023-12-15',
      projectScale: 'Large-scale enterprise data center with 10,000+ server capacity',
      challenge: 'Design and implement a high-capacity, energy-efficient data center infrastructure capable of supporting Huawei\'s expanding cloud services while maintaining 99.99% uptime and meeting strict environmental regulations.',
      solution: 'Deployed advanced cooling systems, redundant power infrastructure, and implemented smart monitoring solutions. Utilized modular design for future scalability and integrated renewable energy sources to reduce carbon footprint.',
      results: [
        { metric: 'Uptime', value: '99.99%' },
        { metric: 'Energy Reduction', value: '30%' },
        { metric: 'Server Capacity Increase', value: '300%' },
        { metric: 'Zero Downtime Maintenance', value: 'Implemented' }
      ],
      products: [
        'High-voltage power cables',
        'Data center cooling systems',
        'Fiber optic networks',
        'Smart monitoring solutions'
      ],
      images: [
        '/images/projects/huawei-datacenter-1.jpg',
        '/images/projects/huawei-datacenter-2.jpg',
        '/images/projects/huawei-datacenter-3.jpg'
      ],
      testimonial: {
        text: 'Yanghua STI delivered exceptional results on our data center project. Their innovative approach to energy efficiency and scalability exceeded our expectations.',
        author: 'Li Wei',
        position: 'Infrastructure Director, Huawei Technologies'
      }
    }
  };
  
  return projects[id] || null;
}

// Generate static params for all available projects
export async function generateStaticParams() {
  const projectIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const locales = ['en', 'es'];
  
  const params = [];
  for (const locale of locales) {
    for (const id of projectIds) {
      params.push({ locale, id });
    }
  }
  
  return params;
}

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);

  // Placeholder image component
  const PlaceholderImage = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
      <span className="text-gray-500 text-sm">Image Not Available</span>
    </div>
  );

  // Loadable image component
  const LoadableImage = ({ src, alt, className, fill = true }: { src: string; alt: string; className?: string; fill?: boolean; }) => {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
      />
    );
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or has been moved.</p>
          <Link href="/projects" className="btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Project header */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0">
          {project.images[0] ? (
            <LoadableImage
              src={project.images[0]}
              alt={project.title}
              className="object-cover opacity-50"
            />
          ) : (
            <PlaceholderImage className="w-full h-full opacity-50" />
          )}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl">
            <span className="text-yellow-500 text-sm font-semibold tracking-wide uppercase">
              {project.industry} Project Case
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
              {project.title}
            </h1>
            <p className="text-xl text-gray-200">
              Providing professional flexible busbar solutions for {project.client}
            </p>
          </div>
        </div>
      </div>

      {/* Project overview */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Project Location</h3>
              <p className="text-gray-600 mt-2">{project.location}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Completion Date</h3>
              <p className="text-gray-600 mt-2">{project.completionDate}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Project Scale</h3>
              <p className="text-gray-600 mt-2">{project.projectScale}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Project Duration</h3>
              <p className="text-gray-600 mt-2">{project.duration}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project details content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
          <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-600">
            <span>Client: {project.client}</span>
            <span>Industry: {project.industry}</span>
            <span>Location: {project.location}</span>
            <span>Duration: {project.duration}</span>
            <span>Completion: {project.completionDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Background & Challenges</h2>
            <p className="text-gray-600 leading-relaxed">{project.challenge}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Solution</h2>
            <p className="text-gray-600 leading-relaxed">{project.solution}</p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Project Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {project.results.map((result: any, index: number) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-3xl font-bold text-[#F9BB67] mb-2">{result.value}</div>
                <div className="text-gray-600">{result.metric}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Products Used</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {project.products.map((product: any, index: number) => (
              <span key={index} className="bg-[#F9BB67] text-gray-900 px-4 py-2 rounded-full">{product}</span>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Project Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.images.map((image: any, index: number) => (
              <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                {image ? (
                  <LoadableImage
                    src={image}
                    alt={`Project image ${index + 1}`}
                    fill={true}
                    className="transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <PlaceholderImage className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Client Testimonial</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-gray-600 italic mb-6">"{project.testimonial?.text || 'No testimonial available'}"</p>
            <div>
              <p className="font-semibold text-gray-900">{project.testimonial?.author || 'Anonymous'}</p>
              <p className="text-gray-600">{project.testimonial?.position || 'Client'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        {/* Project navigation */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Client</span>
              <div className="font-medium text-gray-900">{project.client}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Industry</span>
              <div className="font-medium text-gray-900">{project.industry}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Location</span>
              <div className="font-medium text-gray-900">{project.location}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Project Scale</span>
              <div className="font-medium text-gray-900">{project.projectScale}</div>
            </div>
          </div>
        </div>
    
        {/* Quick inquiry */}
        <div className="bg-yellow-500 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquire About Similar Projects</h3>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            />
            <input
              type="text"
              placeholder="Company"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            />
            <textarea
              placeholder="Project Requirements"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors"
            >
              Submit Inquiry
            </button>
          </form>
        </div>
    
        {/* Related projects */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Projects</h3>
          <div className="space-y-4">
            {[
              { title: '30MW Wind Power Project', industry: 'New Energy' },
              { title: 'Data Center Power Distribution System', industry: 'Data Center' },
              { title: 'Industrial Plant Renovation Project', industry: 'Industry' }
            ].map((relatedProject, index) => (
              <Link
                key={index}
                href={`/projects/${relatedProject.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">{relatedProject.title}</div>
                <div className="text-sm text-gray-600">{relatedProject.industry}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
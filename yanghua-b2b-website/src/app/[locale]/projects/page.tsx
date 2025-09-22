// import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Calendar, Building2, TrendingUp } from 'lucide-react';
import fs from 'fs';
import path from 'path';
// ISR配置：每小时重新验证
export const revalidate = 3600;

// 获取项目数据的服务端函数
function getProjects() {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'projects_complete_content.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const projectsData = JSON.parse(jsonData);
    
    const imageMap: { [key: string]: string } = {
      'Huawei Data Center Expansion': 'huawei-data-center-expansion.webp',
      'BYD Battery Manufacturing': 'byd-battery-manufacturing.webp',
      'CATL Energy Storage': 'catl-energy-storage.webp',
      'Midea Industrial Complex': 'midea-industrial-complex.webp',
      'Metro Line 14': 'metro-line-14.webp',
      'Steel Mill Modernization': 'steel-mill-modernization.webp',
      '50MW Solar Farm Power Distribution': '50mw-solar-farm-power-distribution.webp'
    };

    // 转换数据格式以匹配组件需要的结构
    return projectsData.projects.map((project: any, index: number) => {
      return {
        id: (index + 1).toString(),
        title: project.title,
        client: project.metadata.client,
        industry: project.metadata.industry,
        location: project.metadata.location,
        duration: project.metadata.duration,
        completionDate: project.metadata.completion_date,
        projectScale: project.metadata.project_scale,
        scale: project.metadata.project_scale,
        year: new Date(project.created_at).getFullYear().toString(),
        description: project.description,
        image: imageMap[project.title] ? `/images/projects/${imageMap[project.title]}` : '/images/no-image-available.webp'
      }
    });
  } catch (error) {
    console.error('Error loading projects data:', error);
    return getFallbackProjects();
  }
}

function getFallbackProjects() {
  // 静态项目数据作为最后的降级方案
  return [
    {
      id: '1',
      title: 'Huawei Data Center Expansion',
      client: 'Huawei Technologies',
      industry: 'Data Center',
      location: 'Shenzhen, China',
      duration: '4 months',
      completionDate: 'June 2024',
      projectScale: '2000A system',
      scale: '2000A system',
      year: '2024',
      description: 'High-density power distribution for cloud infrastructure expansion'
    }
  ];
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const projects = getProjects();
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">
            Our Projects
          </h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
            Explore our successful projects and case studies that demonstrate our expertise in power distribution solutions.
          </p>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button className="btn-primary text-sm">All Projects</button>
          <button className="btn-secondary text-sm">Data Center</button>
          <button className="btn-secondary text-sm">New Energy</button>
          <button className="btn-secondary text-sm">Industrial</button>
          <button className="btn-secondary text-sm">Rail Transit</button>
          <button className="btn-secondary text-sm">Metallurgy</button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project: any) => (
            <div key={project.id} className="card overflow-hidden group">
              <div className="h-48 overflow-hidden bg-gray-200 flex items-center justify-center">
                <Image 
                  src={project.image}
                  alt={project.title}
                  width={400}
                  height={200}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#212529] mb-2">
                  {project.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>Client:</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>Industry:</span>
                    <span className="font-medium">{project.industry}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>Scale:</span>
                    <span className="font-medium">{project.scale}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>Year:</span>
                    <span className="font-medium">{project.year}</span>
                  </div>
                </div>
                
                <p className="text-[#6c757d] mb-6">
                  {project.description}
                </p>
                
                <Link 
                  href={`/${locale}/projects/${project.id}`}
                  className="btn-primary w-full text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Project Statistics */}
        <div className="mt-16 bg-[#212529] rounded-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                100+
              </div>
              <div className="text-white">Total Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                7
              </div>
              <div className="text-white">Industries Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                10+
              </div>
              <div className="text-white">Countries Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                50000A+
              </div>
              <div className="text-white">Total Capacity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
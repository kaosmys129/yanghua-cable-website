import fs from 'fs';
import path from 'path';

export interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  scale: string;
  year: string;
  description: string;
}

// 获取项目数据的服务端函数
export function getProjects(): Project[] {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'projects_complete_content.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const projectsData = JSON.parse(jsonData);
    
    // 转换数据格式以匹配组件需要的结构
    return projectsData.projects.map((project: any, index: number) => ({
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
      description: project.description
    }));
  } catch (error) {
    console.error('Error loading projects data:', error);
    return getFallbackProjects();
  }
}

function getFallbackProjects(): Project[] {
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
    },
    {
      id: '2',
      title: 'BYD Battery Manufacturing',
      client: 'BYD Company',
      industry: 'New Energy',
      location: 'Shenzhen, China',
      duration: '5 months',
      completionDate: 'April 2024',
      projectScale: '1600A system',
      scale: '1600A system',
      year: '2024',
      description: 'Flexible power solution for lithium battery production lines'
    },
    {
      id: '3',
      title: 'CATL Energy Storage',
      client: 'CATL',
      industry: 'Energy Storage',
      location: 'Ningde, China',
      duration: '6 months',
      completionDate: 'March 2024',
      projectScale: '3200A system',
      scale: '3200A system',
      year: '2024',
      description: 'Large-scale energy storage power distribution system'
    },
    {
      id: '4',
      title: 'Midea Industrial Complex',
      client: 'Midea Group',
      industry: 'Manufacturing',
      location: 'Foshan, China',
      duration: '3 months',
      completionDate: 'February 2024',
      projectScale: '1200A system',
      scale: '1200A system',
      year: '2024',
      description: 'Smart manufacturing facility power infrastructure'
    },
    {
      id: '5',
      title: 'Metro Line 14',
      client: 'Shenzhen Metro',
      industry: 'Rail Transit',
      location: 'Shenzhen, China',
      duration: '8 months',
      completionDate: 'January 2024',
      projectScale: '800A system',
      scale: '800A system',
      year: '2024',
      description: 'Urban rail transit power distribution solution'
    }
  ];
}

// 获取前N个项目
export function getFeaturedProjects(count: number = 5): Project[] {
  const projects = getProjects();
  return projects.slice(0, count);
}
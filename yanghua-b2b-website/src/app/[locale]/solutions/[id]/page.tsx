import { notFound } from 'next/navigation';

// Generate static params for all available solutions
export async function generateStaticParams() {
  const solutionIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const locales = ['en', 'es'];
  
  const params = [];
  for (const locale of locales) {
    for (const id of solutionIds) {
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

export default async function SolutionDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  // Simple solution detail page
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Solution Details</h1>
      <p className="text-gray-600">Solution ID: {id}</p>
      <p className="mt-4">This is a placeholder for solution details. The solution system has been simplified during the Supabase removal process.</p>
    </div>
  );
}
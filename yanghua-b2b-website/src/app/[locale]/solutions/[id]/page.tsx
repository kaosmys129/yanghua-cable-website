import { notFound } from 'next/navigation';

export default async function SolutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
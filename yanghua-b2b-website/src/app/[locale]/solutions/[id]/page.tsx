import { SolutionDetail } from '../../solutions/page';

export default async function SolutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SolutionDetail solutionId={id} />;
}
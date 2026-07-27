import { AiScreen } from '@/features/recommendations/ai-screen';

export const dynamic = 'force-dynamic';

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const params = await searchParams;
  return <AiScreen initialSource={params.source === 'image' ? 'image' : 'text'} />;
}

import { requireUser } from '@/features/telegram-auth/server';
import { getAIProvider } from '@/lib/ai';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';
import { searchCriteriaSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { FREE_TIER_LIMITS } from '@/constants';
import { truncate } from '@/lib/utils';
import type { ProductSearchCriteria } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { telegram, user } = await requireUser();
    checkRateLimit(`search:${telegram.id}`, RATE_LIMITS.ai);

    const criteria = searchCriteriaSchema.parse(await request.json()) as ProductSearchCriteria;
    const data = getDataSource();

    // Free tier gets a limited number of full analyses per day.
    if (user.tier === 'free') {
      const history = await data.listHistory(telegram.id);
      const since = Date.now() - 24 * 60 * 60 * 1000;
      const todaysAnalyses = history.filter(
        (entry) => entry.kind === 'ai_analysis' && new Date(entry.createdAt).getTime() > since,
      );
      if (todaysAnalyses.length >= FREE_TIER_LIMITS.AI_ANALYSES_PER_DAY) {
        return ok({
          summary:
            "Bugungi bepul AI tahlillari limiti tugadi. Ertaga qayta urinib ko'ring yoki Premium'ga o'ting.",
          confidence: 'low' as const,
          confidenceReason: 'Tahlil bajarilmadi — bepul tarif limiti.',
          recommendedOptions: [],
          missingInformation: [],
          nextActions: ["Premium tarifni ko'rish", 'Katalogdan qidirish'],
        });
      }
    }

    const result = await getAIProvider().analyzeProduct({ criteria, telegramId: telegram.id });

    await data.addHistory({
      telegramId: telegram.id,
      kind: 'ai_analysis',
      title: truncate(criteria.query, 60),
      subtitle: `${result.recommendedOptions.length} ta tavsiya`,
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error, 'search');
  }
}

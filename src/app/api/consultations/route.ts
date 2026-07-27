import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';
import { consultationSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { CONSULTATION_TYPES } from '@/features/consultation/types';
import { track } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { telegram } = await requireUser();
    return ok(await getDataSource().listConsultations(telegram.id));
  } catch (error) {
    return handleApiError(error, 'consultations:get');
  }
}

export async function POST(request: Request) {
  try {
    const { telegram, user } = await requireUser();
    checkRateLimit(`consultation:${telegram.id}`, RATE_LIMITS.write);

    const body = consultationSchema.parse(await request.json());
    const data = getDataSource();

    // The price comes from the catalogue, never from the client.
    const definition = CONSULTATION_TYPES.find((item) => item.value === body.type);
    const priceUzs = definition?.priceUzs ?? 0;

    const consultation = await data.createConsultation({
      userId: user.id,
      telegramId: telegram.id,
      type: body.type,
      description: body.description,
      productUrl: body.productUrl || undefined,
      attachmentName: body.attachmentName,
      contactMethod: body.contactMethod,
      contactValue: body.contactValue,
      preferredTime: body.preferredTime,
      priceUzs,
    });

    await data.addHistory({
      telegramId: telegram.id,
      kind: 'consultation',
      title: definition?.label ?? 'Konsultatsiya',
      subtitle: 'So‘rov yuborildi',
    });

    track('consultation_requested', { type: body.type });

    return ok(consultation, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'consultations:post');
  }
}

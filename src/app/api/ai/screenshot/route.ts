import { requireUser } from '@/features/telegram-auth/server';
import { getAIProvider } from '@/lib/ai';
import { getDataSource } from '@/lib/data';
import { fail, handleApiError, ok } from '@/lib/api/response';
import { validateUploadedFile } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { deleteTemporaryUpload, storeTemporaryUpload } from '@/lib/storage/uploads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let uploadKey: string | null = null;

  try {
    const { telegram, user } = await requireUser();
    checkRateLimit(`screenshot:${telegram.id}`, RATE_LIMITS.upload);

    // The screenshot assistant is a premium feature.
    if (user.tier !== 'premium') {
      return fail(
        "Screenshot yordamchisi Premium tarifda mavjud.",
        403,
        'premium_required',
      );
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('Fayl yuborilmadi.', 400, 'missing_file');

    const validation = validateUploadedFile(
      { name: file.name, type: file.type, size: file.size },
      'image',
    );
    if (!validation.ok) return fail(validation.error ?? "Fayl qabul qilinmadi.", 415, 'bad_file');

    const upload = await storeTemporaryUpload(file);
    uploadKey = upload.key;

    const analysis = await getAIProvider().analyzeScreenshot({
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      data: upload.data,
    });

    await getDataSource().addHistory({
      telegramId: telegram.id,
      kind: 'ai_analysis',
      title: 'Screenshot tahlili',
      subtitle: analysis.stage,
    });

    return ok(analysis);
  } catch (error) {
    return handleApiError(error, 'ai/screenshot');
  } finally {
    if (uploadKey) {
      // Uploaded images never outlive their analysis.
      await deleteTemporaryUpload(uploadKey).catch((error) =>
        logger.error('ai/screenshot:cleanup', error),
      );
    }
  }
}

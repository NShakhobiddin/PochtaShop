import { z } from 'zod';
import { requireRole } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { fail, handleApiError, ok } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { safeText } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/** Fields a courier representative may propose changes to. */
const EDITABLE_FIELDS = [
  'pricePerKgUzs',
  'minChargeUzs',
  'deliveryDays',
  'routes',
  'warehouseAddress',
  'serviceTerms',
  'promotion',
] as const;

const changeSchema = z.object({
  courierId: safeText(80),
  field: z.enum(EDITABLE_FIELDS),
  previousValue: safeText(500).default(''),
  newValue: safeText(500),
});

export async function GET(request: Request) {
  try {
    await requireRole('courier');
    const courierId = new URL(request.url).searchParams.get('courierId') ?? undefined;
    const data = getDataSource();

    const [couriers, requests, reviews] = await Promise.all([
      data.listCouriers(),
      data.listCourierChangeRequests(courierId),
      data.listReviews(courierId),
    ]);

    return ok({ couriers, requests, reviews });
  } catch (error) {
    return handleApiError(error, 'courier-panel:get');
  }
}

/**
 * Courier edits are never applied directly: they are recorded as change
 * requests and published only after an administrator approves them.
 */
export async function POST(request: Request) {
  try {
    const { telegram } = await requireRole('courier');
    checkRateLimit(`courier-panel:${telegram.id}`, RATE_LIMITS.write);

    const body = changeSchema.parse(await request.json());
    const data = getDataSource();

    const courier = await data.getCourier(body.courierId);
    if (!courier) return fail('Kuryer topilmadi.', 404, 'not_found');

    const created = await data.createCourierChangeRequest({
      courierId: body.courierId,
      submittedBy: `courier:${telegram.id}`,
      field: body.field,
      previousValue: body.previousValue,
      newValue: body.newValue,
    });

    await data.appendAuditLog({
      actor: `courier:${telegram.id}`,
      action: 'courier_change.submitted',
      entity: 'courier_change_requests',
      entityId: created.id,
      previousValue: body.previousValue,
      newValue: body.newValue,
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'courier-panel:post');
  }
}

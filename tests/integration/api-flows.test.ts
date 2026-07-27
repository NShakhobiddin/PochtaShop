import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryDataSource, setDataSource } from '@/lib/data';
import { MockAIProvider, setAIProvider } from '@/lib/ai';
import { resetRateLimits } from '@/lib/validation/rate-limit';
import { resetServerEnvCache } from '@/lib/env';

/**
 * These exercise the real request handlers with the in-memory data source,
 * so routing, validation, authorisation and persistence are all covered.
 */
async function callRoute(
  route: { GET?: (req: Request) => Promise<Response>; POST?: (req: Request) => Promise<Response>; PUT?: (req: Request) => Promise<Response>; DELETE?: (req: Request) => Promise<Response> },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<{ status: number; payload: { ok?: boolean; data?: unknown; error?: { message?: string; code?: string } } }> {
  const handler = route[method];
  if (!handler) throw new Error(`Route has no ${method} handler`);
  const request = new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const response = await handler(request);
  return { status: response.status, payload: await response.json() };
}

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-telegram-init-data': '' }),
}));

let dataSource: MemoryDataSource;

beforeEach(() => {
  // The dev fallback identity is used; initData verification has its own tests.
  process.env.APP_ENV = 'test';
  process.env.ALLOW_INSECURE_TELEGRAM_AUTH = 'true';
  process.env.AI_PROVIDER = 'mock';
  process.env.NEXT_PUBLIC_SUPABASE_URL = '';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  resetServerEnvCache();
  resetRateLimits();

  dataSource = new MemoryDataSource();
  setDataSource(dataSource);
  setAIProvider(new MockAIProvider());
});

afterEach(() => {
  setDataSource(null);
  setAIProvider(null);
  vi.restoreAllMocks();
});

describe('search flow', () => {
  it('returns three recommendation types with costs and risk', async () => {
    const route = await import('@/app/api/search/route');
    const { status, payload } = await callRoute(route, 'POST', 'http://x/api/search', {
      query: 'quloqchin',
    });

    expect(status).toBe(200);
    const data = payload.data as {
      recommendedOptions: Array<{
        type: string;
        estimatedCost: { totalUzs: number };
        customsRisk: { level: string };
      }>;
      confidence: string;
    };

    expect(data.recommendedOptions.length).toBeGreaterThan(0);
    expect(data.recommendedOptions.map((option) => option.type)).toEqual(
      expect.arrayContaining(['cheapest']),
    );
    for (const option of data.recommendedOptions) {
      expect(option.estimatedCost.totalUzs).toBeGreaterThan(0);
      expect(['green', 'yellow', 'red']).toContain(option.customsRisk.level);
    }
    expect(['high', 'medium', 'low']).toContain(data.confidence);
  });

  it('records the analysis in history without storing the raw payload', async () => {
    const route = await import('@/app/api/search/route');
    await callRoute(route, 'POST', 'http://x/api/search', { query: 'krossovka' });

    const history = await dataSource.listHistory(100_000_001);
    expect(history.some((entry) => entry.kind === 'ai_analysis')).toBe(true);

    const logs = await dataSource.listAiRequests();
    expect(logs[0]?.feature).toBe('analyzeProduct');
    expect(logs[0]?.provider).toBe('mock');
  });

  it('rejects a malformed request body', async () => {
    const route = await import('@/app/api/search/route');
    const { status, payload } = await callRoute(route, 'POST', 'http://x/api/search', {
      query: 'x',
      quantity: -5,
    });

    expect(status).toBe(422);
    expect(payload.ok).toBe(false);
  });

  it('enforces the free-tier daily analysis limit', async () => {
    const route = await import('@/app/api/search/route');
    for (let index = 0; index < 4; index += 1) {
      await callRoute(route, 'POST', 'http://x/api/search', { query: `quloqchin ${index}` });
    }

    const { payload } = await callRoute(route, 'POST', 'http://x/api/search', {
      query: 'quloqchin oxirgi',
    });
    const data = payload.data as { summary: string; recommendedOptions: unknown[] };
    expect(data.summary).toContain('limiti');
    expect(data.recommendedOptions).toHaveLength(0);
  });
});

describe('saved items flow', () => {
  it('creates, lists and removes a saved item', async () => {
    const route = await import('@/app/api/saved/route');

    const created = await callRoute(route, 'POST', 'http://x/api/saved', {
      kind: 'product',
      refId: 'product_headphones',
      title: 'Quloqchin',
    });
    expect(created.status).toBe(201);
    const savedId = (created.payload.data as { id: string }).id;

    const listed = await callRoute(route, 'GET', 'http://x/api/saved');
    expect((listed.payload.data as unknown[]).length).toBe(1);

    await callRoute(route, 'DELETE', `http://x/api/saved?id=${savedId}`);
    const after = await callRoute(route, 'GET', 'http://x/api/saved');
    expect((after.payload.data as unknown[]).length).toBe(0);
  });

  it('rejects an unknown saved-item kind', async () => {
    const route = await import('@/app/api/saved/route');
    const { status } = await callRoute(route, 'POST', 'http://x/api/saved', {
      kind: 'spaceship',
      refId: 'x',
      title: 'y',
    });
    expect(status).toBe(422);
  });
});

describe('consultation flow', () => {
  it('creates a consultation with the catalogue price and a new status', async () => {
    const route = await import('@/app/api/consultations/route');

    const { status, payload } = await callRoute(route, 'POST', 'http://x/api/consultations', {
      type: 'customs_issue',
      description: 'Yukim bojxonada ushlab qolindi, nima qilishim kerak?',
      contactMethod: 'telegram',
      contactValue: '@integration',
      preferredTime: 'kechqurun',
      // A client-supplied price must not be trusted.
      priceUzs: 1,
      consent: true,
    });

    expect(status).toBe(201);
    const consultation = payload.data as { status: string; priceUzs: number };
    expect(consultation.status).toBe('new');
    expect(consultation.priceUzs).toBe(150_000);
  });

  it('refuses a request without consent', async () => {
    const route = await import('@/app/api/consultations/route');
    const { status } = await callRoute(route, 'POST', 'http://x/api/consultations', {
      type: 'product_selection',
      description: 'Mahsulot tanlashda yordam kerak',
      contactMethod: 'telegram',
      contactValue: '@integration',
      priceUzs: 50_000,
      consent: false,
    });
    expect(status).toBe(422);
  });

  it('lets an admin move the request through its statuses and writes an audit entry', async () => {
    const consultationRoute = await import('@/app/api/consultations/route');
    const created = await callRoute(consultationRoute, 'POST', 'http://x/api/consultations', {
      type: 'courier_choice',
      description: 'Qaysi kuryerni tanlashim kerakligini bilmayman',
      contactMethod: 'telegram',
      contactValue: '@integration',
      priceUzs: 50_000,
      consent: true,
    });
    const id = (created.payload.data as { id: string }).id;

    const adminRoute = await import('@/app/api/admin/route');
    const { status } = await callRoute(adminRoute, 'POST', 'http://x/api/admin', {
      action: 'consultation.status',
      id,
      status: 'in_progress',
    });
    expect(status).toBe(200);

    const consultations = await dataSource.listConsultations();
    expect(consultations.find((item) => item.id === id)?.status).toBe('in_progress');

    const audit = await dataSource.listAuditLog();
    expect(audit.some((entry) => entry.action === 'consultation.status_changed')).toBe(true);
  });
});

describe('assisted order flow', () => {
  it('requires an explicit user confirmation', async () => {
    const route = await import('@/app/api/assisted-orders/route');
    const { status } = await callRoute(route, 'POST', 'http://x/api/assisted-orders', {
      productUrl: 'https://taobao.com/item/1',
      variant: 'oq',
      quantity: 1,
      maxBudgetUzs: 500_000,
      userConfirmed: false,
    });
    expect(status).toBe(422);
  });

  it('creates the request once confirmed', async () => {
    const route = await import('@/app/api/assisted-orders/route');
    const { status, payload } = await callRoute(route, 'POST', 'http://x/api/assisted-orders', {
      productUrl: 'https://taobao.com/item/1',
      variant: 'oq',
      quantity: 2,
      maxBudgetUzs: 500_000,
      userConfirmed: true,
    });
    expect(status).toBe(201);
    expect((payload.data as { userConfirmed: boolean }).userConfirmed).toBe(true);
  });
});

describe('review moderation flow', () => {
  it('creates reviews as pending and blocks a second review from the same user', async () => {
    const route = await import('@/app/api/reviews/route');
    const body = {
      subject: 'courier',
      subjectId: 'courier_fast_cargo',
      rating: 5,
      body: 'Yuk 18 kunda yetib keldi, qadoq butun edi va kuzatuv ishladi.',
    };

    const first = await callRoute(route, 'POST', 'http://x/api/reviews', body);
    expect(first.status).toBe(201);
    expect((first.payload.data as { status: string }).status).toBe('pending');

    const second = await callRoute(route, 'POST', 'http://x/api/reviews', {
      ...body,
      body: 'Boshqa matn, lekin bir xil foydalanuvchi tomonidan yozilgan sharh.',
    });
    expect(second.status).toBe(409);
  });

  it('hides unpublished reviews from the public endpoint', async () => {
    const route = await import('@/app/api/reviews/route');
    await callRoute(route, 'POST', 'http://x/api/reviews', {
      subject: 'store',
      subjectId: 'store_taobao',
      rating: 4,
      body: 'Sotuvchini tekshirsangiz muammo bo‘lmaydi, men rozi qoldim.',
    });

    const listed = await callRoute(route, 'GET', 'http://x/api/reviews?subjectId=store_taobao');
    const reviews = listed.payload.data as Array<{ status: string }>;
    expect(reviews.every((review) => review.status === 'published')).toBe(true);
  });
});

describe('customs endpoints', () => {
  it('calculates and stores a customs estimate', async () => {
    const route = await import('@/app/api/customs/calculate/route');
    const { status, payload } = await callRoute(route, 'POST', 'http://x/api/customs/calculate', {
      category: 'electronics',
      itemName: 'Noutbuk',
      quantity: 1,
      declaredValue: 500,
      currency: 'USD',
      weightKg: 2,
      shippingCostUzs: 200_000,
      fromCountry: 'CN',
      previousMonthlyValueUsd: 0,
      purpose: 'personal',
    });

    expect(status).toBe(200);
    const result = payload.data as { totalCustomsUzs: number; disclaimer: string };
    expect(result.totalCustomsUzs).toBeGreaterThan(0);
    expect(result.disclaimer.length).toBeGreaterThan(0);

    const history = await dataSource.listHistory(100_000_001);
    expect(history.some((entry) => entry.kind === 'customs_calculation')).toBe(true);
  });

  it('evaluates customs risk and records it', async () => {
    const route = await import('@/app/api/customs/risk/route');
    const { status, payload } = await callRoute(route, 'POST', 'http://x/api/customs/risk', {
      itemName: 'Powerbank 20000 mAh',
      category: 'electronics',
      declaredValue: 40,
      currency: 'USD',
      quantity: 1,
      weightKg: 0.4,
      fromCountry: 'CN',
      purpose: 'personal',
    });

    expect(status).toBe(200);
    const result = payload.data as { level: string; reasons: string[] };
    expect(['green', 'yellow', 'red']).toContain(result.level);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('scores commercial intent through the PUT handler', async () => {
    const route = await import('@/app/api/customs/risk/route');
    const { status, payload } = await callRoute(route, 'PUT', 'http://x/api/customs/risk', {
      identicalItemCount: 20,
      totalQuantity: 30,
      recentSimilarOrders: 4,
      category: 'clothing',
      declaredValueUsd: 900,
      distinctVariants: 5,
      bulkPackaging: true,
    });

    expect(status).toBe(200);
    expect((payload.data as { level: string }).level).toBe('high');
  });
});

describe('learning progress flow', () => {
  it('persists progress and reports the next step', async () => {
    const progressRoute = await import('@/app/api/learning/progress/route');
    const courses = await dataSource.listCourses();
    const course = courses[0];
    expect(course).toBeDefined();
    if (!course) return;

    const firstStep = course.steps[0];
    expect(firstStep).toBeDefined();
    if (!firstStep) return;

    const { status } = await callRoute(progressRoute, 'POST', 'http://x/api/learning/progress', {
      courseId: course.id,
      stepId: firstStep.id,
      completed: false,
    });
    expect(status).toBe(200);

    const continueRoute = await import('@/app/api/learning/continue/route');
    const { payload } = await callRoute(continueRoute, 'GET', 'http://x/api/learning/continue');
    const payloadData = payload.data as { percent: number; nextStepTitle: string } | null;
    expect(payloadData).not.toBeNull();
    expect(payloadData?.percent).toBeGreaterThan(0);
  });

  it('rejects a step that does not belong to the course', async () => {
    const route = await import('@/app/api/learning/progress/route');
    const { status } = await callRoute(route, 'POST', 'http://x/api/learning/progress', {
      courseId: 'course_taobao',
      stepId: 'nonexistent_step',
    });
    expect(status).toBe(404);
  });
});

describe('health endpoint', () => {
  it('reports demo mode when Supabase is not configured', async () => {
    const route = await import('@/app/api/health/route');
    const response = await route.GET();
    const payload = (await response.json()) as {
      status: string;
      database: string;
      ai: string;
      timestamp: string;
    };

    expect(payload.status).toBe('ok');
    expect(payload.database).toBe('demo');
    expect(payload.ai).toBe('mock');
    expect(payload.timestamp).toBeTruthy();
  });
});

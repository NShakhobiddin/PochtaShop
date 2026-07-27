import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminPageTitle } from '@/features/admin/admin-ui';
import { getServerEnv } from '@/lib/env';
import { getDataSource } from '@/lib/data';
import { getAIProvider } from '@/lib/ai';
import { CUSTOMS, FILE_UPLOAD, FREE_TIER_LIMITS } from '@/constants';

export const dynamic = 'force-dynamic';

/**
 * Shows only non-secret configuration. API keys are never read into a page.
 */
export default function AdminSettingsPage() {
  const env = getServerEnv();
  const rows: Array<[string, string]> = [
    ['Muhit', env.APP_ENV],
    ['Ma\'lumotlar manbai', getDataSource().kind === 'supabase' ? 'Supabase' : 'Demo (xotira)'],
    ['AI provayder', getAIProvider().name],
    ['Telegram bot tokeni', env.TELEGRAM_BOT_TOKEN ? 'sozlangan' : 'sozlanmagan'],
    ['Supabase', env.isSupabaseConfigured ? 'sozlangan' : 'sozlanmagan'],
    [
      'Rasm tahlildan keyin o\'chiriladi',
      env.FILE_DELETE_AFTER_ANALYSIS ? 'ha' : "yo'q",
    ],
    ['Maksimal rasm hajmi', `${FILE_UPLOAD.MAX_IMAGE_BYTES / (1024 * 1024)} MB`],
    ['Maksimal PDF hajmi', `${FILE_UPLOAD.MAX_DOCUMENT_BYTES / (1024 * 1024)} MB`],
    ['Bepul tarifda kunlik AI tahlili', String(FREE_TIER_LIMITS.AI_ANALYSES_PER_DAY)],
    ['Bojxona qoidalari yangilangan', CUSTOMS.UPDATED_AT],
  ];

  return (
    <>
      <AdminPageTitle title="Sozlamalar" subtitle="Amaldagi konfiguratsiya (maxfiy qiymatlarsiz)" />
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Tizim sozlamalari</caption>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-border last:border-0">
                <th scope="row" className="p-3 text-left font-medium text-content">
                  {label}
                </th>
                <td className="p-3 text-content-secondary">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-5 p-4">
        <Badge tone="warning">Eslatma</Badge>
        <p className="mt-2 text-sm text-content-secondary">
          API kalitlari faqat serverda saqlanadi va hech qachon interfeysga chiqarilmaydi.
        </p>
      </Card>
    </>
  );
}

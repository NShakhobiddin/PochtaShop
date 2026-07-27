import type { ConsultationStatus, ConsultationType } from '@/types';

export const CONSULTATION_TYPES: Array<{
  value: ConsultationType;
  label: string;
  description: string;
  priceUzs: number;
}> = [
  {
    value: 'product_selection',
    label: 'Mahsulot tanlash',
    description: "Sizga mos mahsulot va variantni birgalikda tanlaymiz.",
    priceUzs: 50_000,
  },
  {
    value: 'seller_check',
    label: 'Sotuvchini tekshirish',
    description: "Sotuvchi va do'kon ishonchliligini tahlil qilamiz.",
    priceUzs: 50_000,
  },
  {
    value: 'order_process',
    label: 'Buyurtma jarayoni',
    description: "Buyurtma berishning har bir bosqichida yordam beramiz.",
    priceUzs: 100_000,
  },
  {
    value: 'courier_choice',
    label: 'Kuryer tanlash',
    description: "Yukingizga mos kuryerni tanlashda yordam beramiz.",
    priceUzs: 50_000,
  },
  {
    value: 'customs_issue',
    label: 'Bojxona masalasi',
    description: "Bojxona to'lovi, hujjatlar va ushlab qolingan yuk bo'yicha maslahat.",
    priceUzs: 150_000,
  },
  {
    value: 'seller_negotiation',
    label: 'Sotuvchi bilan muzokara',
    description: "Sotuvchi bilan yozishmalarni siz uchun olib boramiz.",
    priceUzs: 100_000,
  },
  {
    value: 'assisted_order',
    label: 'Men uchun buyurtma bering',
    description: "Buyurtmani siz nomingizdan rasmiylashtiramiz.",
    priceUzs: 150_000,
  },
];

export const CONSULTATION_STATUS_LABEL: Record<ConsultationStatus, string> = {
  new: 'Yangi',
  reviewing: "Ko'rib chiqilmoqda",
  need_info: "Qo'shimcha ma'lumot kerak",
  accepted: 'Qabul qilindi',
  in_progress: 'Jarayonda',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
};

export const CONSULTATION_STATUS_TONE: Record<
  ConsultationStatus,
  'neutral' | 'primary' | 'warning' | 'success' | 'danger'
> = {
  new: 'primary',
  reviewing: 'neutral',
  need_info: 'warning',
  accepted: 'primary',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

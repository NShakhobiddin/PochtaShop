import type { LearningCourse, LearningPlatform, LearningStep } from '@/types';

export const SEED_LEARNING_PLATFORMS: LearningPlatform[] = [
  {
    id: 'platform_pinduoduo',
    name: 'Pinduoduo',
    logoEmoji: '🧧',
    country: 'CN',
    description: "Arzon narxlar, faqat xitoy tili. Kuryer ombori majburiy.",
  },
  {
    id: 'platform_taobao',
    name: 'Taobao',
    logoEmoji: '🛍️',
    country: 'CN',
    description: "Eng katta assortiment, sotuvchini tekshirish muhim.",
  },
  {
    id: 'platform_amazon',
    name: 'Amazon',
    logoEmoji: '📗',
    country: 'US',
    description: "Ingliz tili, kuchli xaridor himoyasi va qaytarish.",
  },
  {
    id: 'platform_trendyol',
    name: 'Trendyol',
    logoEmoji: '🧡',
    country: 'TR',
    description: "Turk tili, O'zbekistonga to'g'ridan-to'g'ri yetkazish mavjud.",
  },
];

const COURSE_STAGES: Array<{ title: string; kind: LearningStep['kind']; body: string }> = [
  {
    title: "Ro'yxatdan o'tish",
    kind: 'reading',
    body: "Telefon raqami yoki e-pochta orqali akkaunt yarating. Xalqaro raqamni +998 formatida kiriting. Tasdiqlash kodi SMS orqali keladi.",
  },
  {
    title: 'Til va hudud sozlamalari',
    kind: 'reading',
    body: "Sozlamalarda tilni ingliz tiliga o'zgartiring va yetkazish hududini tanlang. Hudud narx va yetkazish variantlarini o'zgartiradi.",
  },
  {
    title: 'Mahsulot qidirish',
    kind: 'simulator',
    body: "Qidiruvda aniq kalit so'z va filtrlardan foydalaning. Narx oralig'i, reyting va sotuvlar soni bo'yicha saralang.",
  },
  {
    title: 'Sotuvchini tekshirish',
    kind: 'simulator',
    body: "Sotuvchi reytingi, sotuvlar soni, do'kon yoshi va sharhlarni ko'ring. Rasmiy do'kon belgisi ishonchni oshiradi.",
  },
  {
    title: 'Variant tanlash',
    kind: 'simulator',
    body: "Rang, o'lcham, model va komplektatsiyani diqqat bilan tanlang. Har bir variantning narxi farq qilishi mumkin.",
  },
  {
    title: 'Savatchaga qo‘shish',
    kind: 'reading',
    body: "Savatchada miqdor va tanlangan variantni qayta tekshiring. Kupon va chegirmalarni shu bosqichda qo'llang.",
  },
  {
    title: 'Ombor manzilini kiritish',
    kind: 'simulator',
    body: "Kuryer bergan ombor manzilini to'liq va shaxsiy kod bilan kiriting. Kodsiz yuk yo'qolishi mumkin.",
  },
  {
    title: "To'lov",
    kind: 'reading',
    body: "Xalqaro karta yoki platforma hamyoni orqali to'lang. To'lov chekini saqlang — bojxonada kerak bo'lishi mumkin.",
  },
  {
    title: 'Buyurtmani kuzatish',
    kind: 'reading',
    body: "Trek raqamini platformadan va kuryerdan alohida kuzating. Ombordan chiqqach kuryer treki faollashadi.",
  },
  {
    title: 'Qaytarish yoki nizo',
    kind: 'quiz',
    body: "Mahsulot mos kelmasa, belgilangan muddat ichida nizo oching. Rasm va video dalil qo'shing.",
  },
];

function buildSteps(courseId: string, platformName: string): LearningStep[] {
  return COURSE_STAGES.map((stage, index) => {
    const base: LearningStep = {
      id: `${courseId}_step_${index + 1}`,
      courseId,
      order: index + 1,
      title: stage.title,
      kind: stage.kind,
      body: stage.body,
    };

    if (stage.kind === 'reading') return base;

    if (stage.title === 'Mahsulot qidirish') {
      return {
        ...base,
        hint: "Filtrlar natijani sezilarli darajada yaxshilaydi.",
        question: `${platformName}da mahsulotni qanday qidirasiz?`,
        options: [
          {
            id: 'a',
            label: "Faqat mahsulot nomini yozaman",
            correct: false,
            explanation:
              "Faqat nom yozilsa minglab natija chiqadi va mos bo'lmagan tovarlar aralashib ketadi.",
          },
          {
            id: 'b',
            label: "Nom + narx oralig'i + reyting filtri qo'llayman",
            correct: true,
            explanation:
              "Filtrlar mos bo'lmagan natijalarni olib tashlaydi va ishonchli sotuvchilarni tepaga chiqaradi.",
          },
          {
            id: 'c',
            label: "Eng arzon natijani darrov tanlayman",
            correct: false,
            explanation:
              "Eng arzon variant ko'pincha soxta yoki komplektatsiyasi kam bo'ladi.",
          },
        ],
      };
    }

    if (stage.title === 'Sotuvchini tekshirish') {
      return {
        ...base,
        hint: "Reyting yolg'iz o'zi yetarli emas.",
        question: "To'g'ri sotuvchini qanday tanlaysiz?",
        options: [
          {
            id: 'a',
            label: "Faqat narxi arzon bo'lsa, tanlayman",
            correct: false,
            explanation:
              "Narx tanlovning yagona mezoni bo'lsa, soxta tovar yoki javob bermaydigan sotuvchiga duch kelasiz.",
          },
          {
            id: 'b',
            label: "Reyting, sharhlar, sotuvlar soni va do'kon turini tekshiraman",
            correct: true,
            explanation:
              "To'rt mezon birgalikda sotuvchining haqiqiy ishonchliligini ko'rsatadi.",
          },
        ],
      };
    }

    if (stage.title === 'Variant tanlash') {
      return {
        ...base,
        hint: "Xitoy o'lchamlari Yevropa o'lchamidan kichikroq bo'ladi.",
        question: "Kiyim buyurtma qilyapsiz. Qaysi qadam to'g'ri?",
        options: [
          {
            id: 'a',
            label: "O'zimning odatdagi o'lchamimni tanlayman",
            correct: false,
            explanation:
              "Xitoy o'lcham jadvali boshqacha. Odatdagi o'lcham kichik kelib qolishi mumkin.",
          },
          {
            id: 'b',
            label: "Sotuvchining o'lcham jadvalini sm bo'yicha solishtiraman",
            correct: true,
            explanation:
              "Santimetrdagi o'lchov jadvali eng ishonchli. Ko'krak, bel va uzunlikni o'zingiznikiga solishtiring.",
          },
        ],
      };
    }

    if (stage.title === 'Ombor manzilini kiritish') {
      return {
        ...base,
        hint: "Shaxsiy kod — yukingizni sizga bog'laydigan yagona belgi.",
        question: "Yetkazish manzili sifatida nimani kiritasiz?",
        options: [
          {
            id: 'a',
            label: "Toshkentdagi uy manzilimni",
            correct: false,
            explanation:
              "Ko'p xitoy sotuvchilari xalqaro yetkazmaydi. Buyurtma bekor qilinadi yoki qaytariladi.",
          },
          {
            id: 'b',
            label: "Kuryerning ombor manzilini va shaxsiy kodimni",
            correct: true,
            explanation:
              "Ombor manzili + shaxsiy kod yukni sizga biriktiradi va kuryer uni to'g'ri jo'natadi.",
          },
          {
            id: 'c',
            label: "Kuryer ombori manzilini, kodsiz",
            correct: false,
            explanation:
              "Kodsiz yuk kimga tegishli ekani aniqlanmaydi va omborda qolib ketishi mumkin.",
          },
        ],
      };
    }

    return {
      ...base,
      question: "Mahsulot tavsifga mos kelmadi. Birinchi navbatda nima qilasiz?",
      options: [
        {
          id: 'a',
          label: "Sharhda salbiy baho qoldiraman va kutaman",
          correct: false,
          explanation:
            "Sharh muammoni hal qilmaydi. Nizo muddati o'tib ketishi mumkin.",
        },
        {
          id: 'b',
          label: "Qadoqni ochish jarayonini videoga olib, muddat ichida nizo ochaman",
          correct: true,
          explanation:
            "Dalil bilan ochilgan nizo — pulni qaytarishning eng ishonchli yo'li.",
        },
        {
          id: 'c',
          label: "Kuryerga murojaat qilaman",
          correct: false,
          explanation:
            "Kuryer tovar sifatiga javob bermaydi. Nizo sotuvchi bilan platformada ochiladi.",
        },
      ],
    };
  });
}

export const SEED_LEARNING_COURSES: LearningCourse[] = SEED_LEARNING_PLATFORMS.map((platform) => {
  const courseId = `course_${platform.id.replace('platform_', '')}`;
  return {
    id: courseId,
    platformId: platform.id,
    title: `${platform.name} bo'yicha dars`,
    summary: `${platform.name} platformasida ro'yxatdan o'tishdan qaytarishgacha bo'lgan to'liq yo'l.`,
    estimatedMinutes: 18,
    isPremium: false,
    steps: buildSteps(courseId, platform.name),
  };
});

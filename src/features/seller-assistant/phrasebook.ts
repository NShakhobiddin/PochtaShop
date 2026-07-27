import type { SellerLanguage, SellerMessageDraft } from '@/types';

export interface SellerTopic {
  id: string;
  label: string;
  templates: Record<SellerLanguage, string>;
  backTranslation: string;
  tip: string;
}

/**
 * Ready-made, natural phrasings for the ten questions users actually need.
 * They are sendable as-is, which keeps the feature useful even when no AI
 * provider is configured.
 */
export const SELLER_TOPICS: SellerTopic[] = [
  {
    id: 'availability',
    label: 'Mahsulot mavjudmi?',
    templates: {
      zh: '你好，请问这个商品现在有现货吗？',
      en: 'Hello, is this item currently in stock?',
      tr: 'Merhaba, bu ürün şu anda stokta var mı?',
    },
    backTranslation: 'Salom, bu mahsulot hozir omborda bormi?',
    tip: "Javob kelmasa, boshqa sotuvchini ko'ring — javob bermaslik yomon belgi.",
  },
  {
    id: 'authentic',
    label: 'Original mahsulotmi?',
    templates: {
      zh: '请问这是正品吗？有品牌授权或者防伪标签吗？',
      en: 'Is this an authentic product? Do you have brand authorisation or an anti-counterfeit tag?',
      tr: 'Bu orijinal bir ürün mü? Marka yetkisi veya orijinallik etiketi var mı?',
    },
    backTranslation:
      'Bu original mahsulotmi? Brend ruxsatnomasi yoki soxtalikka qarshi yorliq bormi?',
    tip: "Sotuvchi to'g'ridan-to'g'ri javob bermasa, original ehtimoli past.",
  },
  {
    id: 'real_photo',
    label: 'Real rasmini yuboring',
    templates: {
      zh: '可以发一下实物照片吗？不要官方图片，谢谢。',
      en: 'Could you send real photos of the actual item, not catalogue images?',
      tr: 'Ürünün gerçek fotoğraflarını gönderebilir misiniz? Katalog görseli değil lütfen.',
    },
    backTranslation: "Mahsulotning haqiqiy rasmini yuboring, katalog rasmi emas.",
    tip: 'Real rasm — sifat va rangni tekshirishning eng oson yo‘li.',
  },
  {
    id: 'defects',
    label: 'Nuqsoni bormi?',
    templates: {
      zh: '这个商品有瑕疵吗？是全新未拆封的吗？',
      en: 'Does the item have any defects? Is it brand new and sealed?',
      tr: 'Üründe herhangi bir kusur var mı? Sıfır ve ambalajı açılmamış mı?',
    },
    backTranslation: "Mahsulotda nuqson bormi? U yangi va ochilmaganmi?",
    tip: "Javobni skrinshot qilib saqlang — nizo ochilsa dalil bo'ladi.",
  },
  {
    id: 'material',
    label: 'Material qanday?',
    templates: {
      zh: '请问材质是什么？含棉量是多少？',
      en: 'What is the material? What is the fabric composition?',
      tr: 'Malzemesi nedir? Kumaş bileşimi nasıl?',
    },
    backTranslation: 'Materiali nima? Tarkibi qanday?',
    tip: "Kiyimda tarkib teri sezgirligi va qishki issiqlik uchun muhim.",
  },
  {
    id: 'size',
    label: "O'lchami qancha?",
    templates: {
      zh: '可以发一下尺码表吗？胸围、腰围和衣长是多少厘米？',
      en: 'Could you share the size chart? What are the chest, waist and length in centimetres?',
      tr: 'Beden tablosunu paylaşabilir misiniz? Göğüs, bel ve boy kaç santim?',
    },
    backTranslation:
      "O'lcham jadvalini yuboring. Ko'krak, bel va uzunlik necha santimetr?",
    tip: "Xitoy o'lchamlari Yevropanikidan 1-2 o'lcham kichik bo'ladi.",
  },
  {
    id: 'color',
    label: 'Boshqa rang bormi?',
    templates: {
      zh: '还有其他颜色吗？可以发一下颜色对比图吗？',
      en: 'Do you have other colours? Could you send a comparison photo?',
      tr: 'Başka renk seçeneği var mı? Karşılaştırma fotoğrafı gönderebilir misiniz?',
    },
    backTranslation: 'Boshqa ranglar bormi? Solishtirish rasmini yuboring.',
    tip: "Ekrandagi rang haqiqiysidan farq qiladi — real rasm so'rang.",
  },
  {
    id: 'shipping_time',
    label: 'Qachon yuborasiz?',
    templates: {
      zh: '付款后多久发货？发货后能提供快递单号吗？',
      en: 'How soon do you ship after payment? Will you provide a tracking number?',
      tr: 'Ödemeden sonra ne kadar sürede kargoya verirsiniz? Takip numarası verecek misiniz?',
    },
    backTranslation:
      "To'lovdan keyin qancha vaqtda jo'natasiz? Kuzatuv raqamini berasizmi?",
    tip: "Kuzatuv raqami bo'lmasa, yukni topish qiyin bo'ladi.",
  },
  {
    id: 'discount',
    label: 'Narxni tushira olasizmi?',
    templates: {
      zh: '如果买多件，可以便宜一点吗？',
      en: 'If I buy several units, could you offer a better price?',
      tr: 'Birkaç adet alırsam daha iyi bir fiyat verebilir misiniz?',
    },
    backTranslation: "Bir nechta olsam, narxni pasaytira olasizmi?",
    tip: "Ko'p dona olish bojxonada tijorat maqsadi xavfini oshiradi — ehtiyot bo'ling.",
  },
  {
    id: 'return',
    label: 'Qaytarish mumkinmi?',
    templates: {
      zh: '如果尺码不合适或者有质量问题，可以退换吗？',
      en: 'If the size does not fit or there is a quality issue, can I return or exchange it?',
      tr: 'Beden uymazsa veya kalite sorunu olursa iade veya değişim mümkün mü?',
    },
    backTranslation:
      "O'lcham to'g'ri kelmasa yoki sifat muammosi bo'lsa, qaytarish mumkinmi?",
    tip: "Xalqaro qaytarish pochtasi ko'pincha xaridor hisobidan bo'ladi.",
  },
];

const LANGUAGE_LABEL: Record<SellerLanguage, string> = {
  zh: 'Xitoycha',
  en: 'Inglizcha',
  tr: 'Turkcha',
};

export function getTopic(id: string): SellerTopic | undefined {
  return SELLER_TOPICS.find((topic) => topic.id === id);
}

/**
 * Builds a ready-to-send message. When the user adds their own text it is
 * appended verbatim and clearly marked, so nothing is silently mistranslated.
 */
export function translateTopic(
  topicId: string,
  userText: string,
  language: SellerLanguage,
): SellerMessageDraft {
  const topic = getTopic(topicId);
  const base = topic?.templates[language] ?? '';
  const extra = userText.trim();

  return {
    language,
    translated: extra ? `${base}\n\n${extra}` : base,
    backTranslation: topic?.backTranslation ?? extra,
    tip:
      topic?.tip ??
      `${LANGUAGE_LABEL[language]} tilida yozilgan xabar. Javobni qayta tarjima qildiring.`,
  };
}

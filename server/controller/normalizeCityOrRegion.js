const cityRegionMap = [
  { en: "Riyadh", ar: "الرياض" },
  { en: "Jeddah", ar: "جدة" },
  { en: "Mecca", ar: "مكة" },
  { en: "Medina", ar: "المدينة المنورة" },
  { en: "Dammam", ar: "الدمام" },
  { en: "Khobar", ar: "الخبر" },
  { en: "Dhahran", ar: "الظهران" },
  { en: "Tabuk", ar: "تبوك" },
  { en: "Hail", ar: "حائل" },
  { en: "Abha", ar: "أبها" },
  { en: "Khamis Mushait", ar: "خميس مشيط" },
  { en: "Najran", ar: "نجران" },
  { en: "Jazan", ar: "جازان" },
  { en: "Buraidah", ar: "بريدة" },
  { en: "Sakaka", ar: "سكاكا" },
  { en: "Al Bahah", ar: "الباحة" },
  { en: "Arar", ar: "عرعر" },
  { en: "Hafar Al Batin", ar: "حفر الباطن" },
  { en: "Al Qassim", ar: "القصيم" },
  { en: "Eastern Province", ar: "المنطقة الشرقية" },
  { en: "Northern Borders Region", ar: "الحدود الشمالية" },
  { en: "Asir", ar: "عسير" },
  { en: "Al Jawf", ar: "الجوف" },
  { en: "Al Madinah Region", ar: "منطقة المدينة المنورة" },
  { en: "Al Riyadh Region", ar: "منطقة الرياض" },
  { en: "Al Makkah Region", ar: "منطقة مكة المكرمة" },
];

const normalizeCityOrRegion = (input) => {
  if (!input) return [];

  const cleanInput = input.toLowerCase().replace(/saudi arabia/gi, "").trim();

  const match = cityRegionMap.find((entry) => {
    return (
      cleanInput.includes(entry.en.toLowerCase()) ||
      cleanInput.includes(entry.ar.toLowerCase())
    );
  });

  const result = match
    ? [match.en.toLowerCase(), match.ar.toLowerCase()]
    : [cleanInput];

  return result;
};

module.exports = { normalizeCityOrRegion };
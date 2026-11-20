export interface Item {
  id: string;
  emoji: string;
  en: string;
  ar: string;
}

export const SHOPPING_ITEMS: Item[] = [
  { id: "dates", emoji: "🌴", en: "Dates", ar: "تمر" },
  { id: "rice", emoji: "🍚", en: "Rice", ar: "أرز" },
  { id: "milk", emoji: "🥛", en: "Milk", ar: "حليب" },
  { id: "bread", emoji: "🫓", en: "Bread", ar: "خبز" },
  { id: "coffee", emoji: "☕", en: "Coffee", ar: "قهوة" },
  { id: "tea", emoji: "🍵", en: "Tea", ar: "شاي" },
  { id: "tomato", emoji: "🍅", en: "Tomatoes", ar: "طماطم" },
  { id: "cucumber", emoji: "🥒", en: "Cucumbers", ar: "خيار" },
  { id: "onion", emoji: "🧅", en: "Onions", ar: "بصل" },
  { id: "lemon", emoji: "🍋", en: "Lemons", ar: "ليمون" },
  { id: "eggs", emoji: "🥚", en: "Eggs", ar: "بيض" },
  { id: "chicken", emoji: "🍗", en: "Chicken", ar: "دجاج" },
  { id: "fish", emoji: "🐟", en: "Fish", ar: "سمك" },
  { id: "honey", emoji: "🍯", en: "Honey", ar: "عسل" },
  { id: "apple", emoji: "🍎", en: "Apples", ar: "تفاح" },
  { id: "banana", emoji: "🍌", en: "Bananas", ar: "موز" },
  { id: "orange", emoji: "🍊", en: "Oranges", ar: "برتقال" },
  { id: "grapes", emoji: "🍇", en: "Grapes", ar: "عنب" },
  { id: "watermelon", emoji: "🍉", en: "Watermelon", ar: "بطيخ" },
  { id: "carrot", emoji: "🥕", en: "Carrots", ar: "جزر" },
  { id: "potato", emoji: "🥔", en: "Potatoes", ar: "بطاطس" },
  { id: "cheese", emoji: "🧀", en: "Cheese", ar: "جبن" },
  { id: "salt", emoji: "🧂", en: "Salt", ar: "ملح" },
  { id: "garlic", emoji: "🧄", en: "Garlic", ar: "ثوم" },
  { id: "pepper", emoji: "🌶️", en: "Chili", ar: "فلفل حار" },
  { id: "mango", emoji: "🥭", en: "Mangoes", ar: "مانجو" },
  { id: "water", emoji: "💧", en: "Water", ar: "ماء" },
  { id: "corn", emoji: "🌽", en: "Corn", ar: "ذرة" },
  { id: "eggplant", emoji: "🍆", en: "Eggplant", ar: "باذنجان" },
  { id: "pomegranate", emoji: "🔴", en: "Pomegranate", ar: "رمان" },
];

export type Slot = "morning" | "noon" | "night";
export const SLOTS: Slot[] = ["morning", "noon", "night"];

export interface Instruction {
  id: string;
  slots: Slot[];
  en: string;
  ar: string;
}

export const INSTRUCTIONS: Instruction[] = [
  { id: "once_morning", slots: ["morning"], en: "Once a day, with breakfast", ar: "مرة يوميًا مع الفطور" },
  { id: "once_bed", slots: ["night"], en: "Once a day, before sleep", ar: "مرة يوميًا قبل النوم" },
  { id: "twice", slots: ["morning", "night"], en: "Twice a day, morning and evening", ar: "مرتين يوميًا، صباحًا ومساءً" },
  { id: "thrice", slots: ["morning", "noon", "night"], en: "Three times a day, with meals", ar: "ثلاث مرات يوميًا مع الوجبات" },
  { id: "lunch", slots: ["noon"], en: "Once a day, with lunch", ar: "مرة يوميًا مع الغداء" },
  { id: "morning_noon", slots: ["morning", "noon"], en: "With breakfast and with lunch", ar: "مع الفطور ومع الغداء" },
  { id: "noon_night", slots: ["noon", "night"], en: "With lunch and before sleep", ar: "مع الغداء وقبل النوم" },
];

export interface Medicine {
  id: string;
  color: string;
  en: string;
  ar: string;
}

export const MEDICINES: Medicine[] = [
  { id: "blue", color: "#2563eb", en: "Blue tablet", ar: "القرص الأزرق" },
  { id: "white", color: "#a8a29e", en: "White tablet", ar: "القرص الأبيض" },
  { id: "yellow", color: "#ca8a04", en: "Yellow capsule", ar: "الكبسولة الصفراء" },
  { id: "pink", color: "#db2777", en: "Pink tablet", ar: "القرص الوردي" },
  { id: "green", color: "#16a34a", en: "Green capsule", ar: "الكبسولة الخضراء" },
  { id: "orange", color: "#ea580c", en: "Orange tablet", ar: "القرص البرتقالي" },
];

export const TARGETS = { quickSimple: "☕", quickChoiceA: "☕", quickChoiceB: "🫖" } as const;

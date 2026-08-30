export const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "XOF", label: "CFA Franc (XOF)" },
  { code: "NGN", label: "Nigerian Naira" },
  { code: "MAD", label: "Moroccan Dirham" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

export const DEFAULT_CURRENCY = "XOF";

/* ---------- active locale ---------- */

const LOCALE_BY_LANG: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "en-US", // Spanish translations pending — falls back to English formatting
};

let activeLang = "en";
let activeLocale = "en-US";

export function setActiveLanguage(lang: string) {
  activeLang = LOCALE_BY_LANG[lang] ? lang : "en";
  activeLocale = LOCALE_BY_LANG[activeLang]!;
}

export function localeFor(lang: string) {
  return LOCALE_BY_LANG[lang] ?? "en-US";
}

export function getActiveLocale() {
  return activeLocale;
}

const RELATIVE_DAYS: Record<string, { today: string; yesterday: string }> = {
  en: { today: "Today", yesterday: "Yesterday" },
  fr: { today: "Aujourd'hui", yesterday: "Hier" },
  es: { today: "Today", yesterday: "Yesterday" },
};

export function formatMoney(value: number, currency = DEFAULT_CURRENCY, compact = false) {
  try {
    return new Intl.NumberFormat(activeLocale, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** Splits a formatted amount into main part and cents for oversized typography. */
export function splitMoney(value: number, currency = DEFAULT_CURRENCY) {
  const formatted = formatMoney(value, currency);
  const match = formatted.match(/^(.*)([.,]\d{2})$/);
  if (!match) return { main: formatted, cents: "" };
  return { main: match[1], cents: match[2] };
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(d: Date) {
  return d.toLocaleDateString(activeLocale, { month: "long", year: "numeric" });
}

export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(activeLocale, {
    day: "numeric",
    month: "short",
  });
}

export function dateTimeLabel(value: string | Date) {
  return new Date(value).toLocaleString(activeLocale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const words = RELATIVE_DAYS[activeLang] ?? RELATIVE_DAYS['en']!;
  if (same(date, today)) return words.today;
  if (same(date, yest)) return words.yesterday;
  return date.toLocaleDateString(activeLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function daysUntil(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(`${iso}T00:00:00`).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

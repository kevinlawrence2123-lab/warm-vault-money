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

export function formatMoney(value: number, currency = "USD", compact = false) {
  try {
    return new Intl.NumberFormat("en-US", {
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
export function splitMoney(value: number, currency = "USD") {
  const formatted = formatMoney(value, currency);
  const match = formatted.match(/^(.*)([.,]\d{2})$/);
  if (!match) return { main: formatted, cents: "" };
  return { main: match[1], cents: match[2] };
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function dayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, today)) return "Today";
  if (same(date, yest)) return "Yesterday";
  return date.toLocaleDateString("en-US", {
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

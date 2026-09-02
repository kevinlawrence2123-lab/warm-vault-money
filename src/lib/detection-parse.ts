/**
 * Pure parsing helpers for bank / mobile money notification text.
 * Shared by the ingest endpoint and the client (preview of a test message).
 */

export interface ParsedNotification {
  amount: number;
  type: "expense" | "income";
  merchant: string | null;
  balance: number | null;
  reference: string | null;
}

const INCOME_WORDS = [
  "received",
  "credited",
  "credit of",
  "deposit",
  "deposited",
  "you have received",
  "recu",
  "reçu",
  "crédité",
  "credite",
  "versement",
  "dépôt",
  "depot",
  "entrée",
  "remboursement",
  "refund",
  "salary",
  "salaire",
];

const EXPENSE_WORDS = [
  "debited",
  "debit of",
  "withdraw",
  "withdrawal",
  "sent",
  "paid",
  "payment",
  "purchase",
  "spent",
  "transfer to",
  "retrait",
  "débité",
  "debite",
  "paiement",
  "payé",
  "paye",
  "achat",
  "envoyé",
  "envoye",
  "prélèvement",
  "prelevement",
];

/** Numbers like 12,500.75 / 12 500,75 / 12500 / 1.250,00 */
const AMOUNT_RE =
  /(?:^|[^\d])((?:\d{1,3}(?:[ .,\u00a0]\d{3})+|\d+)(?:[.,]\d{1,2})?)(?![\d])/g;

const CURRENCY_HINT =
  /(xof|fcfa|f\s?cfa|cfa|usd|eur|gbp|ngn|mad|cad|jpy|\$|€|£|₦)/i;

export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00a0]/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const sep = Math.max(lastComma, lastDot);
  let normalised: string;
  if (sep === -1) {
    normalised = cleaned;
  } else {
    const decimals = cleaned.length - sep - 1;
    if (decimals === 1 || decimals === 2) {
      normalised = `${cleaned.slice(0, sep).replace(/[.,]/g, "")}.${cleaned.slice(sep + 1)}`;
    } else {
      normalised = cleaned.replace(/[.,]/g, "");
    }
  }
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

function scoreWords(text: string, words: string[]) {
  return words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
}

const OTP_RE =
  /\b(otp|one[- ]time|code (?:is|:)|verification code|security code|mot de passe|code de v[ée]rification|code secret|pin code)\b/i;

/** True when the message is a transaction notice rather than an OTP/marketing text. */
export function looksTransactional(text: string) {
  const lower = text.toLowerCase();
  if (OTP_RE.test(text)) return false;
  const hasWord =
    scoreWords(lower, INCOME_WORDS) > 0 || scoreWords(lower, EXPENSE_WORDS) > 0;
  return hasWord || CURRENCY_HINT.test(text);
}

export function detectType(text: string): "expense" | "income" {
  const lower = text.toLowerCase();
  const income = scoreWords(lower, INCOME_WORDS);
  const expense = scoreWords(lower, EXPENSE_WORDS);
  if (income > expense) return "income";
  return "expense";
}

function extractMerchant(text: string): string | null {
  const patterns = [
    /(?:from|de)\s+([A-Za-zÀ-ÿ0-9&'’.\- ]{2,40}?)(?=[.,;]|\s+(?:on|le|at|à|ref|id|bal)\b|$)/i,
    /(?:to|at|chez|vers|à)\s+([A-Za-zÀ-ÿ0-9&'’.\- ]{2,40}?)(?=[.,;]|\s+(?:on|le|ref|id|bal)\b|$)/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    const value = m?.[1]?.trim();
    if (value && !/^\d+$/.test(value)) {
      const trimmed = value
        .replace(/\s+(effectu[ée]?e?|r[ée]ussi[e]?|confirm[ée]?e?|success(ful)?|completed)$/i, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (trimmed) return trimmed.slice(0, 60);
    }
  }
  return null;
}

function extractReference(text: string): string | null {
  const m = /(?:ref|reference|txn|transaction(?:\s*id)?|id)[^\dA-Za-z]{0,3}([A-Za-z0-9-]{4,32})/i.exec(
    text,
  );
  return m?.[1] ?? null;
}

function extractBalance(text: string): number | null {
  const m =
    /(?:balance|bal|solde|nouveau solde)[^\d-]{0,12}((?:\d{1,3}(?:[ .,\u00a0]\d{3})+|\d+)(?:[.,]\d{1,2})?)/i.exec(
      text,
    );
  return m?.[1] ? parseAmount(m[1]) : null;
}

/**
 * Extracts the transaction from a raw notification / SMS body.
 * Returns null when no plausible amount is present.
 */
export function parseNotification(text: string): ParsedNotification | null {
  if (!text || !text.trim()) return null;
  if (!looksTransactional(text)) return null;

  const balance = extractBalance(text);
  const candidates: number[] = [];
  AMOUNT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = AMOUNT_RE.exec(text)) !== null) {
    const around = text.slice(Math.max(0, match.index - 24), match.index + match[0].length + 12);
    const value = parseAmount(match[1] ?? "");
    if (value === null || value <= 0) continue;
    // Skip the running balance and obvious dates / phone numbers.
    if (balance !== null && value === balance) continue;
    if (/\b(bal|balance|solde)\b/i.test(around) && !CURRENCY_HINT.test(match[1] ?? "")) {
      if (balance === null) continue;
    }
    if (/\d{2}[/:-]\d{2}/.test(match[0])) continue;
    candidates.push(value);
  }

  if (!candidates.length) return null;

  // The transaction amount is usually the first monetary value in the message.
  const amount = candidates[0]!;

  return {
    amount,
    type: detectType(text),
    merchant: extractMerchant(text),
    balance,
    reference: extractReference(text),
  };
}

/** Normalises an app/package name into one of the known detection sources. */
export function resolveSourceKey(input: string | null | undefined): string {
  const value = (input ?? "").toLowerCase();
  if (value.includes("nita")) return "nita";
  if (value.includes("amana")) return "amana";
  if (
    value.includes("mobile") ||
    value.includes("momo") ||
    value.includes("wallet") ||
    value.includes("money")
  ) {
    return "mobile_banking";
  }
  return "bank";
}

/**
 * Pure parsing helpers for bank / mobile money SMS and notification text.
 * Shared by the ingest endpoint and the client (paste / share import).
 *
 * Heuristics (no AI): finds the transaction amount (never an account number,
 * a date, the fee or the running balance), its direction, the fee, the balance,
 * the operator, the counterparty, the date written in the message and a likely
 * category.
 */

export type TxType = "expense" | "income";

export interface ParsedNotification {
  amount: number;
  type: TxType;
  merchant: string | null;
  balance: number | null;
  reference: string | null;
  fee: number;
  provider: string | null;
  /** Date written in the message (YYYY-MM-DD), if any. */
  date: string | null;
  /** Category name guessed from keywords (English seed names, matched case-insensitively). */
  categoryHint: string | null;
  label: string;
}

export const PROVIDERS: { name: string; re: RegExp; kind: "mobile_money" | "bank"; source: string }[] = [
  { name: "Nita", re: /\bnita\b/i, kind: "mobile_money", source: "nita" },
  { name: "Amana", re: /\bamana\b/i, kind: "mobile_money", source: "amana" },
  { name: "Airtel Money", re: /airtel/i, kind: "mobile_money", source: "mobile_banking" },
  { name: "Moov Money", re: /\bmoov\s*money\b|\bmoov\b|flooz/i, kind: "mobile_money", source: "mobile_banking" },
  // Togo : T-Money est devenu Mixx (Yas). Les SMS disent « Nouveau solde Mixx », l'expéditeur « Mixx Togo ».
  { name: "Mixx", re: /\bmixx\b|t-?money|\byas\b/i, kind: "mobile_money", source: "mobile_banking" },
  { name: "Orange Money", re: /orange\s*money/i, kind: "mobile_money", source: "mobile_banking" },
  { name: "Wave", re: /\bwave\b/i, kind: "mobile_money", source: "mobile_banking" },
  { name: "MTN MoMo", re: /\bmtn\b|\bmomo\b/i, kind: "mobile_money", source: "mobile_banking" },
  { name: "Zamani Cash", re: /zamani/i, kind: "mobile_money", source: "mobile_banking" },
  // Les SMS Ecobank ne contiennent pas le mot « Ecobank » : « XOF 2,000.00 Débit du ac XX106001 … »
  { name: "Ecobank", re: /ecobank|\b(?:du|au) ac xx\d/i, kind: "bank", source: "bank" },
  { name: "BOA", re: /\bboa\b|bank of africa/i, kind: "bank", source: "bank" },
  { name: "Sonibank", re: /sonibank/i, kind: "bank", source: "bank" },
  { name: "BIA", re: /\bbia\b/i, kind: "bank", source: "bank" },
  { name: "Coris Bank", re: /coris/i, kind: "bank", source: "bank" },
  { name: "UBA", re: /\buba\b/i, kind: "bank", source: "bank" },
  { name: "Société Générale", re: /soci[ée]t[ée]\s*g[ée]n[ée]rale/i, kind: "bank", source: "bank" },
  { name: "Orabank", re: /orabank/i, kind: "bank", source: "bank" },
  { name: "BSIC", re: /\bbsic\b/i, kind: "bank", source: "bank" },
];

const CUR = "(?:f\\s?cfa|cfa|xof|fcfa|f|francs?|eur|€|usd|\\$|ngn|₦|ghs|mad|gbp|£|cad|jpy)";
// 12 500 | 12.500 | 12,500 | 12500,00 | 12 500.50
const NUM = "(\\d{1,3}(?:[\\s.\\u202f\\u00a0,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)";
const AMOUNT_RE = new RegExp(`${NUM}\\s?${CUR}(?![a-z])|${CUR}\\s?${NUM}`, "gi");

// Accents parfois perdus par l'opérateur (« Dbit », « Crdit ») : on tolère la lettre manquante.
const CREDIT =
  /(re[çc]u|recu|cr[ée]?dit[ée]?|credited|received|deposit|d[ée]p[oô]t|versement|vous a (?:envoy|transf)|remboursement|refund|cash[\s-]?in|salaire|salary)/i;
const DEBIT =
  /(d[ée]?bit[ée]?|debited|retrait|retir[ée]|withdraw|paiement|pay[ée]|paid|payment|purchase|achat|spent|transf[ée]r[ée]?\s|transfert|transfer to|envoy[ée]|\benvoi\b|sent|cash[\s-]?out|factur|pr[ée]l[èe]v)/i;
/** Formulations qui sont toujours une entrée d'argent, même si elles contiennent un mot de débit. */
const SURE_INCOME =
  /transfert re[çc]u|vous a (?:envoy|transf)|you have received|vous avez re[çc]u|d[ée]p[oô]t de|cr[ée]?dit au ac/i;

/**
 * Supprime la publicité et les rappels de sécurité ajoutés en fin de SMS
 * (« Tente de gagner… », « Moov Money évolue… », « Gardez votre mot de passe… », liens).
 */
function stripTail(text: string) {
  return text
    .replace(/(tente de gagner|moov money [ée]volue|nouvelle appli|gardez votre mot de passe|t[ée]l[ée]charge[rz]? l'app).*$/i, "")
    .replace(/https?:\/\/\S+/gi, "")
    .trim();
}
const NOISE =
  /(code (?:de )?(?:v[ée]rification|confirmation|secret)|verification code|security code|one[- ]time|\botp\b|mot de passe|\bpin\b|promo|bonus offert|gagnez|tentez|f[ée]licitations? vous avez gagn)/i;

const CATEGORY_RULES: [RegExp, string[]][] = [
  [/salaire|salary|paie\b|payroll/i, ["salary", "salaire"]],
  [/canal\+?|netflix|spotify|abonnement|subscription|forfait|internet|data|recharge/i, ["subscriptions", "abonnements"]],
  [/carburant|essence|gasoil|station|taxi|transport|bus|yango|uber/i, ["transport"]],
  [/loyer|rent\b|nigelec|senelec|\bcie\b|[ée]lectricit|seeg|\beau\b|snde|\bsde\b/i, ["housing", "logement"]],
  [/pharmac|clinique|h[oô]pital|m[ée]dic|sant[ée]|health/i, ["health", "santé"]],
  [/restaurant|resto|supermarch|march[ée]|boutique|alimentation|boulang|caf[ée]|food/i, ["food", "alimentation"]],
  [/cin[ée]ma|concert|\bbar\b|sortie|loisir/i, ["leisure", "loisirs"]],
];

/** Numbers like 12,500.75 / 12 500,75 / 12500 / 1.250,00 / 10.000 */
export function parseAmount(raw: string): number | null {
  let t = raw.replace(/[\s  ]/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, "");
  else if (/^\d{1,3}([.,]\d{3})+[.,]\d{1,2}$/.test(t)) t = t.replace(/[.,](?=\d{3})/g, "").replace(",", ".");
  else t = t.replace(",", ".");
  const value = Number(t);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** True when the message is a transaction notice rather than an OTP/marketing text. */
export function looksTransactional(text: string) {
  if (NOISE.test(text) && !/(d[ée]?bit|cr[ée]?dit|re[çc]u|retrait|retir|paiement|envoi|d[ée]p[oô]t)/i.test(text)) return false;
  return CREDIT.test(text) || DEBIT.test(text);
}

export function detectType(text: string): TxType {
  if (SURE_INCOME.test(text)) return "income";
  const c = CREDIT.exec(text);
  const d = DEBIT.exec(text);
  if (c && d) return c.index < d.index ? "income" : "expense";
  return c ? "income" : "expense";
}

function parseDate(s: string): string | null {
  const m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const [, dd = "", mm = "", yy = ""] = m;
    const y = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
    const d = new Date(y, Number(mm) - 1, Number(dd));
    if (!Number.isNaN(d.getTime()) && d.getMonth() === Number(mm) - 1) {
      const p = (x: number) => String(x).padStart(2, "0");
      return `${y}-${p(Number(mm))}-${p(Number(dd))}`;
    }
  }
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/)?.[0];
  if (iso) return iso;
  // Ecobank : « on 15-NOV-26 »
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const FR = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOU", "SEP", "OCT", "NOV", "DEC"];
  const n = s.match(/(\d{1,2})[-\s]([A-Za-zéû]{3})[A-Za-zéû]*[-\s](\d{2,4})/);
  if (n) {
    const [, dd = "", mon = "", yy = ""] = n;
    const key = mon.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    let mi = MONTHS.indexOf(key);
    if (mi < 0) mi = FR.indexOf(key);
    if (mi >= 0) {
      const y = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
      const p = (x: number) => String(x).padStart(2, "0");
      return `${y}-${p(mi + 1)}-${p(Number(dd))}`;
    }
  }
  return null;
}

function extractReference(text: string): string | null {
  const m = text.match(
    /(?:\bref(?:[ée]rence)?|\btxn|\btrans(?:action)?\s*id|\bid\s*(?:trans\w*)?)\s*[:#.-]?\s*([A-Z0-9][A-Z0-9.-]{3,31})/i,
  );
  const ref = m?.[1];
  return ref && /\d/.test(ref) ? ref.replace(/[.-]+$/, "") : null;
}

const STOP =
  "(?:le|a|à|au|on|ref|r[ée]f|montant|nouveau|solde|bal|trans\\w*|id|est|r[ée]ussi|reussi|effectu[ée]e?|avec|frais|via|success\\w*|completed)";
const BAD_START = /^(?:[ée]t[ée]|votre|vous|ete|un|une|des|ce|cette|your|you|r[ée]ussi|reussi|effectu)/i;

const tidy = (v: string) => v.replace(/\s{2,}/g, " ").replace(/[\s,.;:-]+$/, "").trim().slice(0, 60);

function extractMerchant(s: string, type: TxType): string | null {
  const libelle = s.match(/libell[ée]\s*:?\s*([^.;\n]{2,40})/i);
  if (libelle?.[1]) return libelle[1].trim();

  // Ecobank : « … REF:M69CAVO263200OES RETRAIT ATM-ATM - Agence Nukafu Nukafu TG on 15-NOV-26 »
  //           « … REF:M63… REF:TG156… B/O KOUAWO ACHILLE C A Allocation … on 16-NOV-26 »
  const eco = s.match(/\bREF:?\s*\S+\s+(?:REF:?\s*\S+\s+)?(.+?)\s+on\s+\d{1,2}-[A-Za-z]{3}-\d{2,4}/i)?.[1];
  if (eco) {
    const v = tidy(eco.replace(/^B\/O\s+/i, "").replace(/\s+TG$/i, ""));
    if (v) return v;
  }

  // Mixx / T-Money : « chez l'agent 38855(ETS ASSIKOUYO) », « au 91424009(KOSSIWA) »
  const named = s.match(/\d{4,}\s*\(([^)]{2,40})\)/)?.[1];
  if (named) return tidy(named);

  // Moov Money : « Expéditeur: 22897653865 », « Numero du destinataire: 9xxxxxxx »
  const field = s.match(
    type === "income"
      ? /exp[ée]diteur\s*:\s*([+\dA-Za-zÀ-ÿ][^\n.;]{1,40}?)(?=\s+(?:date|montant|nouveau|txn|frais)\b|[.;\n]|$)/i
      : /destinataire\s*:\s*([+\dA-Za-zÀ-ÿ][^\n.;]{1,40}?)(?=\s+(?:date|montant|nouveau|txn|frais)\b|[.;\n]|$)/i,
  )?.[1];
  if (field && !/^(frais|date|montant)/i.test(field)) return tidy(field);
  if (type === "income") {
    const sender = s.match(/([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,30}?)\s+vous a (?:envoy|transf)/i)?.[1];
    if (sender && !BAD_START.test(sender.trim())) return sender.replace(/^.*[:]\s*/, "").trim();
  }
  const prep =
    type === "income"
      ? "(?:\\bde\\b|\\bdu\\b|\\bfrom\\b|\\bpar\\b)"
      : "(?:\\bvers\\b|\\b[àa]\\b|\\bau\\b|\\bto\\b|\\bat\\b|\\bchez\\b|\\bpour\\b)";
  const re = new RegExp(
    `${prep}\\s+([A-Za-zÀ-ÿ0-9+&][A-Za-zÀ-ÿ0-9 .'’+&-]{1,40}?)(?=[,.;:]|\\s+${STOP}\\b|$)`,
    "gi",
  );
  for (const m of s.matchAll(re)) {
    const v = (m[1] ?? "").trim();
    if (!v) continue;
    if (BAD_START.test(v)) continue;
    if (new RegExp(`^${NUM}\\s?${CUR}?$`, "i").test(v)) {
      if (/^\+?\d{8,}$/.test(v.replace(/\s/g, ""))) return v; // phone number
      continue; // an amount, not a counterparty
    }
    return v.slice(0, 60);
  }
  return null;
}

export function detectProvider(text: string) {
  return PROVIDERS.find((p) => p.re.test(text)) ?? null;
}

/**
 * Extracts the transaction from a raw notification / SMS body.
 * Returns null for OTPs, promotions, balance-only messages or when no amount is present.
 */
export function parseNotification(raw: string, senderHint?: string | null): ParsedNotification | null {
  const text = stripTail((raw ?? "").replace(/\s+/g, " ").trim());
  if (!text || !looksTransactional(text)) return null;

  const amounts: { value: number; idx: number; ctx: string }[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const value = parseAmount(m[1] ?? m[2] ?? "");
    if (!value || value > 1e12) continue;
    const idx = m.index ?? 0;
    amounts.push({ value, idx, ctx: text.slice(Math.max(0, idx - 30), idx).toLowerCase() });
  }
  if (!amounts.length) return null;

  const isBalance = (c: string) =>
    /(solde|balance|\bbal\b|disponible|avoir)\s*(?:est|actuel|dispo\w*|:|de|is)?\s*[:=]?\s*$|solde[^.]{0,20}$/.test(c);
  const isFee = (c: string) => /(frais|fee|fees|commission|taxe|tva)\s*[:=]?\s*(?:de|of)?\s*$/.test(c);

  const balance = amounts.find((a) => isBalance(a.ctx))?.value ?? null;
  const fee = amounts.find((a) => isFee(a.ctx))?.value ?? 0;
  const main = amounts.find((a) => !isBalance(a.ctx) && !isFee(a.ctx));
  if (!main) return null;

  const type = detectType(text.slice(0, main.idx + 40));
  // L'opérateur vient souvent de l'expéditeur du SMS (« ECOBANK », « MoovMoney », « Mixx Togo »)
  const provider = detectProvider(`${senderHint ?? ""} ${text}`)?.name ?? null;
  const merchant = extractMerchant(text, type);
  const categoryHint = CATEGORY_RULES.find(([re]) => re.test(text))?.[1][0] ?? null;
  const verb = /retrait|withdraw|cash[\s-]?out/i.test(text)
    ? "Retrait"
    : /paiement|payment|achat|purchase|pay[ée]|paid/i.test(text)
      ? "Paiement"
      : /transf|envoy|sent/i.test(text)
        ? type === "income"
          ? "Transfert reçu"
          : "Transfert envoyé"
        : type === "income"
          ? "Crédit"
          : "Débit";
  const label = [verb, merchant ? (type === "income" ? `de ${merchant}` : `· ${merchant}`) : null, provider ? `(${provider})` : null]
    .filter(Boolean)
    .join(" ");

  return {
    amount: main.value,
    type,
    merchant,
    balance,
    reference: extractReference(text),
    fee,
    provider,
    date: parseDate(text),
    categoryHint,
    label,
  };
}

/** Finds the category matching a parsed hint, in English or French seed names. */
export function matchCategoryHint<C extends { id: string; name: string; type: string }>(
  hint: string | null,
  type: TxType,
  categories: C[],
): C | null {
  if (!hint) return null;
  const names = CATEGORY_RULES.find(([, n]) => n[0] === hint)?.[1] ?? [hint];
  return (
    categories.find(
      (c) => c.type === type && names.some((n) => c.name.toLowerCase().includes(n.toLowerCase())),
    ) ?? null
  );
}

/** Normalises an app/package name or message into one of the known detection sources. */
export function resolveSourceKey(input: string | null | undefined): string {
  const value = input ?? "";
  const provider = detectProvider(value);
  if (provider) return provider.source;
  const lower = value.toLowerCase();
  if (lower.includes("mobile") || lower.includes("momo") || lower.includes("wallet") || lower.includes("money")) {
    return "mobile_banking";
  }
  return "bank";
}

/** Shape of a message without amounts or short words, used for "always ignore". */
export function messageShape(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\d+/g, " ")
    .replace(/[^a-z ]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 2)
    .join(" ");
}

/** True when the message has the same shape as a muted one (stored as the original message). */
export function isMutedMessage(text: string, mutedPatterns: string[]) {
  const shape = messageShape(text);
  return mutedPatterns.some((p) => {
    const ps = messageShape(p ?? "");
    if (!ps) return false;
    const head = ps.split(" ").slice(0, 6).join(" ");
    return ps === shape || (head.length > 8 && shape.includes(head));
  });
}

/** Account whose name contains the operator name (e.g. account "Nita" for a Nita SMS). */
export function matchAccountByProvider<A extends { id: string; name: string }>(provider: string | null, accounts: A[]) {
  if (!provider) return null;
  const first = (provider.split(" ")[0] ?? provider).toLowerCase();
  return accounts.find((a) => a.name.toLowerCase().includes(first)) ?? null;
}

/** Splits pasted text into individual messages (blank line between two SMS, or one per line). */
export function splitMessages(input: string): string[] {
  const blocks = input.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  const hasAmount = (l: string) => new RegExp(AMOUNT_RE.source, "i").test(l);
  if (lines.length > 1 && lines.every(hasAmount)) return lines;
  return blocks;
}

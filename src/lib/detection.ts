import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DETECTION_SOURCES = [
  { key: "bank", label: "Bank app", icon: "landmark" },
  { key: "mobile_banking", label: "Mobile Banking", icon: "smartphone" },
  { key: "nita", label: "Nita", icon: "credit-card" },
  { key: "amana", label: "Amana", icon: "wallet" },
] as const;

export type DetectionSourceKey = (typeof DETECTION_SOURCES)[number]["key"];

export interface DetectionSettings {
  user_id: string;
  enabled: boolean;
  permission_granted: boolean;
  ingest_token: string;
  auto_save: boolean;
  default_account_id: string | null;
  last_ingest_at: string | null;
}

export interface DetectionRule {
  id: string;
  keyword: string;
  category_id: string | null;
  auto_confirm: boolean;
}

export interface DetectionSource {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
}

export interface DetectedTransaction {
  id: string;
  source_key: string;
  app_name: string;
  amount: number;
  type: "expense" | "income";
  category_id: string | null;
  raw_text: string | null;
  detected_at: string;
  status: string;
  merchant: string | null;
  account_id: string | null;
  transaction_id: string | null;
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useDetectionSettings() {
  return useQuery({
    queryKey: ["detection-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detection_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DetectionSettings | null;
    },
  });
}

export function useDetectionSources() {
  return useQuery({
    queryKey: ["detection-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detection_sources")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DetectionSource[];
    },
  });
}

export function useDetectedTransactions() {
  return useQuery({
    queryKey: ["detected-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detected_transactions")
        .select("*")
        .eq("status", "pending")
        .order("detected_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DetectedTransaction[];
    },
  });
}

export function useDetectionRules() {
  return useQuery({
    queryKey: ["detection-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detection_rules")
        .select("id, keyword, category_id, auto_confirm")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DetectionRule[];
    },
  });
}

export function useSaveDetectionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: { keyword: string; category_id: string | null; auto_confirm: boolean }) => {
      const user_id = await uid();
      if (!user_id) throw new Error("Not signed in");
      const { error } = await supabase.from("detection_rules").insert({ user_id, ...rule });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["detection-rules"] }),
  });
}

export function useDeleteDetectionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("detection_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["detection-rules"] }),
  });
}

/** The public URL a phone automation posts notification text to. */
export function ingestEndpoint() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/api/public/detection-ingest`;
}

export function useSaveDetectionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<DetectionSettings, "user_id">>) => {
      const user_id = await uid();
      if (!user_id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("detection_settings")
        .upsert({ user_id, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["detection-settings"] }),
  });
}

export function useToggleSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      label,
      enabled,
    }: {
      key: string;
      label: string;
      enabled: boolean;
    }) => {
      const user_id = await uid();
      if (!user_id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("detection_sources")
        .upsert({ user_id, key, label, enabled }, { onConflict: "user_id,key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["detection-sources"] }),
  });
}

export function useResolveDetection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      detection,
      action,
    }: {
      detection: DetectedTransaction;
      action: "ignored" | "muted";
    }) => {
      const user_id = await uid();
      if (!user_id) throw new Error("Not signed in");
      if (action === "muted") {
        const { error: mErr } = await supabase.from("detection_muted_patterns").insert({
          user_id,
          source_key: detection.source_key,
          pattern: detection.raw_text ?? detection.app_name,
        });
        if (mErr) throw mErr;
      }
      const { error } = await supabase
        .from("detected_transactions")
        .update({ status: action })
        .eq("id", detection.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["detected-transactions"] });
      qc.invalidateQueries({ queryKey: ["detection-muted"] });
    },
  });
}

export function useMutedPatterns() {
  return useQuery({
    queryKey: ["detection-muted"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detection_muted_patterns")
        .select("pattern");
      if (error) throw error;
      return (data ?? []).map((m) => m.pattern as string);
    },
  });
}

/** Stable short hash used as external_ref when the SMS carries no operator reference. */
function messageRef(text: string) {
  const s = text.replace(/\s+/g, " ").trim().toLowerCase();
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `sms_${h.toString(36)}_${s.length.toString(36)}`;
}

export interface ImportSummary {
  added: number;
  duplicates: number;
  skipped: number;
}

/**
 * Imports pasted or shared SMS into the review inbox (status "pending"):
 * parses each message, applies "always ignore" patterns and keyword rules,
 * picks the account named after the operator, and records the fee as a
 * separate expense so balances stay exact. Duplicates are skipped.
 */
export function useImportMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      messages: string[];
      accounts: { id: string; name: string }[];
      categories: { id: string; name: string; type: string }[];
      rules: DetectionRule[];
      muted: string[];
      defaultAccountId: string | null;
    }): Promise<ImportSummary> => {
      const {
        parseNotification,
        resolveSourceKey,
        isMutedMessage,
        matchAccountByProvider,
        matchCategoryHint,
      } = await import("./detection-parse");
      const user_id = await uid();
      if (!user_id) throw new Error("Not signed in");
      const summary: ImportSummary = { added: 0, duplicates: 0, skipped: 0 };

      for (const raw of input.messages) {
        const text = raw.trim();
        const parsed = parseNotification(text);
        if (!parsed || isMutedMessage(text, input.muted)) {
          summary.skipped++;
          continue;
        }
        const sourceKey = resolveSourceKey(text);
        const lower = text.toLowerCase();
        const rule = input.rules.find((r) => r.keyword && lower.includes(r.keyword.toLowerCase()));
        const category_id =
          rule?.category_id ?? matchCategoryHint(parsed.categoryHint, parsed.type, input.categories)?.id ?? null;
        const account_id =
          matchAccountByProvider(parsed.provider, input.accounts)?.id ?? input.defaultAccountId;
        const ref = parsed.reference
          ? `ref_${sourceKey}_${parsed.reference.toLowerCase()}`
          : messageRef(text);
        const detected_at = parsed.date ? new Date(`${parsed.date}T12:00:00`).toISOString() : new Date().toISOString();
        const app_name = parsed.provider ?? "SMS";

        const rows = [
          { amount: parsed.amount, type: parsed.type, category_id, merchant: parsed.label || parsed.merchant, external_ref: ref },
          ...(parsed.fee > 0
            ? [{ amount: parsed.fee, type: "expense" as const, category_id: null, merchant: `Frais · ${parsed.label || app_name}`, external_ref: `${ref}_fee` }]
            : []),
        ];
        for (const [i, row] of rows.entries()) {
          const { error } = await supabase.from("detected_transactions").insert({
            user_id,
            source_key: sourceKey,
            app_name,
            account_id,
            raw_text: text.slice(0, 500),
            detected_at,
            status: "pending",
            ...row,
          });
          if (error) {
            // Unique (user_id, external_ref): this SMS was already imported
            if (error.code === "23505") {
              if (i === 0) summary.duplicates++;
              break;
            }
            throw error;
          }
          if (i === 0) summary.added++;
        }
      }
      return summary;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["detected-transactions"] }),
  });
}

export type SourceStatus = "Active" | "Waiting for permission" | "Off";

export function sourceStatus(
  settings: DetectionSettings | null | undefined,
  enabled: boolean,
): SourceStatus {
  if (!settings?.enabled || !enabled) return "Off";
  return settings.permission_granted ? "Active" : "Waiting for permission";
}

/**
 * Asks the Android host app (if any) to open the notification-access system
 * settings. Returns false in a normal browser, where the bridge is absent.
 */
export function requestNotificationAccess(): boolean {
  const bridge = (
    globalThis as unknown as {
      MyBudgetNative?: { openNotificationAccessSettings?: () => void };
    }
  ).MyBudgetNative;
  try {
    if (bridge?.openNotificationAccessSettings) {
      bridge.openNotificationAccessSettings();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

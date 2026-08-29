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

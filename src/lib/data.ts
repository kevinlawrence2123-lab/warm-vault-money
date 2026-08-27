import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  currency: string;
  language: string;
  theme: string;
  onboarded: boolean;
  pin_enabled: boolean;
  biometric_enabled: boolean;
  notifications_enabled: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: "expense" | "income";
  color: string;
  is_default: boolean;
}

export interface Transaction {
  id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  type: "expense" | "income";
  date: string;
  note: string | null;
  receipt_url: string | null;
  payment_method: string;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
}

export interface Contribution {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
}

export interface Budget {
  id: string;
  category_id: string;
  month: string;
  limit_amount: number;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}

async function rows<T>(promise: PromiseLike<{ data: unknown; error: unknown }>) {
  const { data, error } = await promise;
  if (error) throw error;
  return (data ?? []) as T[];
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Profile | null;
    },
  });
}

export function useCurrency() {
  const { data } = useProfile();
  return data?.currency ?? "USD";
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      rows<Account>(
        supabase.from("accounts").select("*").order("created_at", { ascending: true }),
      ),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      rows<Category>(
        supabase.from("categories").select("*").order("created_at", { ascending: true }),
      ),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      rows<Transaction>(
        supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () =>
      rows<Goal>(
        supabase.from("savings_goals").select("*").order("created_at", { ascending: true }),
      ),
  });
}

export function useContributions(goalId?: string) {
  return useQuery({
    queryKey: ["contributions", goalId ?? "all"],
    queryFn: () => {
      let q = supabase.from("goal_contributions").select("*").order("date", { ascending: true });
      if (goalId) q = q.eq("goal_id", goalId);
      return rows<Contribution>(q);
    },
  });
}

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: () =>
      rows<Budget>(supabase.from("budgets").select("*").eq("month", month)),
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    for (const key of [
      "profile",
      "accounts",
      "categories",
      "transactions",
      "goals",
      "contributions",
      "budgets",
    ]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };
}

/* ---------- derived helpers ---------- */

export function accountBalance(account: Account, txs: Transaction[]) {
  return txs
    .filter((t) => t.account_id === account.id)
    .reduce(
      (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
      Number(account.balance),
    );
}

export function totalBalance(accounts: Account[], txs: Transaction[]) {
  const accountTotal = accounts.reduce((s, a) => s + accountBalance(a, txs), 0);
  const orphan = txs
    .filter((t) => !t.account_id)
    .reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
  return accountTotal + orphan;
}

export function inMonth(iso: string, ref = new Date()) {
  const d = new Date(`${iso}T00:00:00`);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function sumBy(txs: Transaction[], type: "expense" | "income") {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);
}

export type Range = "1D" | "1W" | "1M" | "3M" | "1Y";

const RANGE_DAYS: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

/** Cumulative balance series over the selected range. */
export function balanceSeries(
  accounts: Account[],
  txs: Transaction[],
  range: Range,
): { label: string; value: number }[] {
  const days = RANGE_DAYS[range];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const current = totalBalance(accounts, txs);
  const points: { label: string; value: number }[] = [];
  const steps = Math.min(days, 30);
  const stepMs = (days * 86400000) / steps;

  for (let i = steps; i >= 0; i--) {
    const at = new Date(end.getTime() - i * stepMs);
    const after = txs
      .filter((t) => new Date(`${t.date}T00:00:00`).getTime() > at.getTime())
      .reduce(
        (s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
        0,
      );
    points.push({
      label: at.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      value: current - after,
    });
  }
  return points;
}

export function periodChange(txs: Transaction[], days = 30) {
  const cutoff = Date.now() - days * 86400000;
  return txs
    .filter((t) => new Date(`${t.date}T00:00:00`).getTime() >= cutoff)
    .reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Card, EmptyState, IconBubble, ProgressBar } from "@/components/app/primitives";
import { formatMoney, monthKey, monthLabel } from "@/lib/format";
import {
  useBudgets,
  useCategories,
  useCurrency,
  useInvalidateAll,
  useTransactions,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Monthly budget — MyBudget" },
      { name: "description", content: "Set category limits and see exactly where your money goes each month." },
      { property: "og:title", content: "Monthly budget — MyBudget" },
      { property: "og:description", content: "Set category limits and see exactly where your money goes each month." },
    ],
  }),
  component: BudgetPage,
});

const PALETTE = [
  "#F4C10F",
  "#E08D3C",
  "#8FB98A",
  "#7FA7C9",
  "#C98A9E",
  "#B4A0DC",
  "#9A9188",
];

function BudgetPage() {
  const currency = useCurrency();
  const invalidate = useInvalidateAll();
  const [offset, setOffset] = useState(0);

  const refDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return d;
  }, [offset]);
  const month = monthKey(refDate);

  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets(month);

  const expenseCats = categories.filter((c) => c.type === "expense");

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || !t.date.startsWith(month) || !t.category_id) continue;
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
    }
    return map;
  }, [transactions, month]);

  const donut = expenseCats
    .map((c, i) => ({
      name: c.name,
      value: spentByCategory.get(c.id) ?? 0,
      fill: c.color || PALETTE[i % PALETTE.length]!,
    }))
    .filter((d) => d.value > 0);

  const totalSpent = donut.reduce((s, d) => s + d.value, 0);
  const overCategories = expenseCats.filter((c) => {
    const limit = budgets.find((b) => b.category_id === c.id)?.limit_amount ?? 0;
    return limit > 0 && (spentByCategory.get(c.id) ?? 0) >= limit * 0.9;
  });

  async function setLimit(categoryId: string, value: number) {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("budgets").upsert(
      {
        user_id: userData.user!.id,
        category_id: categoryId,
        month,
        limit_amount: value,
      },
      { onConflict: "user_id,category_id,month" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  return (
    <AppShell title="Budget">
      <Card className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setOffset((o) => o - 1)}>
          <ChevronLeft size={20} className="text-muted-foreground" />
        </button>
        <p className="font-bold">{monthLabel(refDate)}</p>
        <button type="button" aria-label="Next month" onClick={() => setOffset((o) => o + 1)}>
          <ChevronRight size={20} className="text-muted-foreground" />
        </button>
      </Card>

      {overCategories.length > 0 && (
        <Card className="flex items-start gap-3 border border-destructive/40">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm">
            <span className="font-bold">Heads up.</span>{" "}
            {overCategories.map((c) => c.name).join(", ")}{" "}
            {overCategories.length > 1 ? "are" : "is"} at or over the limit this month.
          </p>
        </Card>
      )}

      <Card className="space-y-3">
        <p className="font-bold">Spending by category</p>
        {donut.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses recorded this month.</p>
        ) : (
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "none",
                    borderRadius: 14,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatMoney(v, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="amount-xl text-xl">{formatMoney(totalSpent, currency)}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {expenseCats.length === 0 ? (
        <EmptyState title="No expense categories yet" />
      ) : (
        <div className="space-y-3">
          {expenseCats.map((c) => {
            const spent = spentByCategory.get(c.id) ?? 0;
            const limit = budgets.find((b) => b.category_id === c.id)?.limit_amount ?? 0;
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const tone = pct >= 100 ? "danger" : pct >= 80 ? "warning" : "gold";
            return (
              <Card key={c.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <IconBubble icon={c.icon} color={c.color} size="sm" />
                  <p className="min-w-0 flex-1 truncate font-semibold">{c.name}</p>
                  <input
                    inputMode="decimal"
                    defaultValue={limit || ""}
                    placeholder="Set limit"
                    onBlur={(e) => {
                      const v = Number(e.target.value.replace(/[^0-9.]/g, ""));
                      if (v !== limit) void setLimit(c.id, v);
                    }}
                    className="w-24 rounded-full bg-surface px-3 py-1.5 text-right text-sm font-semibold outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <ProgressBar value={limit > 0 ? pct : 0} tone={limit > 0 ? tone : "muted"} />
                <p className="text-xs text-muted-foreground">
                  {formatMoney(spent, currency)}
                  {limit > 0 ? ` of ${formatMoney(limit, currency)}` : " spent · no limit set"}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

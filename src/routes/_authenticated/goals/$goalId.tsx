import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PartyPopper, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/app/AppShell";
import { Card, Chip, EmptyState, IconBubble } from "@/components/app/primitives";
import { daysUntil, formatMoney } from "@/lib/format";
import {
  useContributions,
  useCurrency,
  useGoals,
  useInvalidateAll,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/goals/$goalId")({
  head: () => ({
    meta: [
      { title: "Goal detail — MyBudget" },
      { name: "description", content: "Track progress, contributions and days remaining for your savings goal." },
      { property: "og:title", content: "Goal detail — MyBudget" },
      { property: "og:description", content: "Track progress, contributions and days remaining for your savings goal." },
    ],
  }),
  component: GoalDetail,
});

function GoalDetail() {
  const { goalId } = useParams({ from: "/_authenticated/goals/$goalId" });
  const currency = useCurrency();
  const invalidate = useInvalidateAll();
  const { data: goals = [], isLoading } = useGoals();
  const { data: contributions = [] } = useContributions(goalId);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const goal = goals.find((g) => g.id === goalId);

  if (!goal) {
    return (
      <PageShell title="Goal">
        {!isLoading && <EmptyState title="Goal not found" />}
      </PageShell>
    );
  }

  const pct = goal.target_amount
    ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    : 0;
  const days = daysUntil(goal.target_date);
  const circumference = 2 * Math.PI * 54;

  async function addFunds() {
    const value = Number(amount);
    if (!goal || !value || value <= 0) {
      toast.error("Enter an amount");
      return;
    }
    setBusy(true);
    const next = goal.current_amount + value;
    const { error } = await supabase
      .from("goal_contributions")
      .insert({ goal_id: goal.id, amount: value, user_id: (await supabase.auth.getUser()).data.user!.id });
    if (!error) {
      await supabase
        .from("savings_goals")
        .update({
          current_amount: next,
          status: next >= goal.target_amount ? "completed" : "in_progress",
        })
        .eq("id", goal.id);
    }
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAmount("");
    invalidate();
    toast.success("Contribution added");
  }

  async function removeGoal() {
    if (!goal) return;
    const { error } = await supabase.from("savings_goals").delete().eq("id", goal.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
    window.history.back();
  }

  const chartData = contributions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((c) => ({ date: c.date.slice(5), amount: c.amount }));

  return (
    <PageShell title={goal.name}>
      {goal.status === "completed" && (
        <Card className="flex items-center gap-3">
          <IconBubble icon="party" active />
          <div>
            <p className="font-bold">Goal reached!</p>
            <p className="text-xs text-muted-foreground">
              You saved {formatMoney(goal.current_amount, currency)}.
            </p>
          </div>
          <PartyPopper className="ml-auto text-primary" size={22} />
        </Card>
      )}

      <Card className="flex flex-col items-center gap-3 py-8">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="10"
              className="stroke-surface"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke="var(--primary)"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="amount-xl text-3xl">{Math.round(pct)}%</span>
          </div>
        </div>
        <p className="amount-xl text-2xl">{formatMoney(goal.current_amount, currency)}</p>
        <p className="text-sm text-muted-foreground">
          of {formatMoney(goal.target_amount, currency)}
          {days !== null && ` · ${days} days left`}
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="font-bold">Add funds</p>
        <div className="flex gap-2">
          <input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="min-w-0 flex-1 rounded-full bg-surface px-4 py-3 font-semibold outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={addFunds}
            disabled={busy}
            className="gold-gradient shrink-0 rounded-full px-6 font-bold text-primary-foreground disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="font-bold">Contribution history</p>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributions yet.</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "var(--card)",
                    border: "none",
                    borderRadius: 14,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatMoney(v, currency)}
                />
                <Bar dataKey="amount" fill="var(--primary)" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Chip className="inline-flex items-center gap-2 text-destructive" onClick={removeGoal}>
        <Trash2 size={14} /> Delete goal
      </Chip>
    </PageShell>
  );
}

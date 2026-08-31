import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import {
  Amount,
  Card,
  Chip,
  EmptyState,
  IconBubble,
  ProgressBar,
  SectionHeader,
} from "@/components/app/primitives";
import { TransactionRow } from "@/components/app/TransactionRow";
import {
  balanceSeries,
  inMonth,
  periodChange,
  sumBy,
  totalBalance,
  useAccounts,
  useCategories,
  useGoals,
  useProfile,
  useTransactions,
  type Range,
} from "@/lib/data";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — MyBudget" },
      { name: "description", content: "Your balance, spending, savings goals and recent activity." },
      { property: "og:title", content: "Dashboard — MyBudget" },
      { property: "og:description", content: "Your balance, spending, savings goals and recent activity." },
    ],
  }),
  component: HomePage,
});

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y"];

function HomePage() {
  const t = useT();
  const [range, setRange] = useState<Range>("1M");
  const { data: profile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: txs = [] } = useTransactions();
  const { data: goals = [] } = useGoals();
  const { data: categories = [] } = useCategories();
  const navigate = useNavigate();
  const currency = profile?.currency ?? DEFAULT_CURRENCY;

  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [profile, navigate]);

  const balance = totalBalance(accounts, txs);
  const monthTxs = txs.filter((t) => inMonth(t.date));
  const spent = sumBy(monthTxs, "expense");
  const income = sumBy(monthTxs, "income");
  const saved = Math.max(0, income - spent);
  const change = periodChange(txs, 30);
  const series = balanceSeries(accounts, txs, range);

  return (
    <AppShell title={t("home.title")}>
      <Card className="relative overflow-hidden p-0" wavy>
        <div className="px-6 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t("home.totalBalance")}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <Amount
              value={balance}
              currency={currency}
              className="text-4xl text-primary"
              centsClassName="text-foreground/70"
            />
            <span
              className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                change >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {formatMoney(Math.abs(change), currency, true)} {t("home.thisMonth")}
            </span>
          </div>
        </div>

        <div className="mt-2 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(v: number) => [formatMoney(v, currency), t("home.balance")]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#balanceFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 pt-1 pb-2">
          {RANGES.map((r) => (
            <Chip
              key={r}
              active={r === range}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 text-xs"
            >
              {r}
            </Chip>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t("home.spentThisMonth")} value={spent} currency={currency} tone="gold" />
        <StatCard label={t("home.savedThisMonth")} value={saved} currency={currency} />
      </div>

      <section>
        <SectionHeader
          title={t("home.savingsGoals")}
          action={
            <Link to="/goals" className="text-sm font-semibold text-primary">
              {t("common.seeAll")}
            </Link>
          }
        />
        {goals.length === 0 ? (
          <EmptyState
            title={t("home.noGoals")}
            description={t("home.noGoalsDesc")}
            action={
              <Link
                to="/goals"
                className="gold-gradient inline-block rounded-full px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                {t("home.createGoal")}
              </Link>
            }
          />
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {goals.map((g) => {
              const pct = g.target_amount
                ? (Number(g.current_amount) / Number(g.target_amount)) * 100
                : 0;
              return (
                <Link
                  key={g.id}
                  to="/goals/$goalId"
                  params={{ goalId: g.id }}
                  className="surface-card w-52 shrink-0 space-y-3 p-4"
                >
                  <div className="flex items-center gap-3">
                    <IconBubble icon={g.icon} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(Number(g.current_amount), currency, true)} /{" "}
                        {formatMoney(Number(g.target_amount), currency, true)}
                      </p>
                    </div>
                  </div>
                  <ProgressBar value={pct} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title={t("home.recentActivity")}
          action={
            <Link to="/transactions" className="text-sm font-semibold text-primary">
              {t("common.viewAll")}
            </Link>
          }
        />
        {txs.length === 0 ? (
          <EmptyState
            title={t("home.nothingYet")}
            description={t("home.nothingYetDesc")}
          />
        ) : (
          <div className="surface-card divide-y divide-border p-2">
            {txs.slice(0, 8).map((t) => (
              <TransactionRow
                key={t.id}
                tx={t}
                category={categories.find((c) => c.id === t.category_id)}
                currency={currency}
              />
            ))}
          </div>
        )}
      </section>

      <Link
        to="/transactions/new"
        aria-label={t("home.addTransaction")}
        className="gold-gradient fixed right-5 bottom-24 z-40 grid h-14 w-14 place-items-center rounded-full text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-95"
      >
        <Plus size={26} strokeWidth={2.6} />
      </Link>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone?: "gold";
}) {
  return (
    <div
      className={`rounded-3xl p-4 ${
        tone === "gold" ? "gold-gradient text-primary-foreground" : "surface-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold opacity-80">{label}</p>
        <TrendingUp size={15} className="opacity-70" />
      </div>
      <p className="amount-xl mt-4 text-2xl">{formatMoney(value, currency, true)}</p>
    </div>
  );
}

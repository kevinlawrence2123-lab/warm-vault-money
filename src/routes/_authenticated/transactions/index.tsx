import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, Chip, EmptyState } from "@/components/app/primitives";
import { TransactionRow } from "@/components/app/TransactionRow";
import { dayLabel, formatMoney } from "@/lib/format";
import {
  inMonth,
  useCategories,
  useCurrency,
  useTransactions,
  type Transaction,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/transactions/")({
  head: () => ({
    meta: [
      { title: "Transactions — MyBudget" },
      { name: "description", content: "Search, filter and export every expense and income you record." },
      { property: "og:title", content: "Transactions — MyBudget" },
      { property: "og:description", content: "Search, filter and export every expense and income you record." },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const currency = useCurrency();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorised";

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (categoryId && t.category_id !== categoryId) return false;
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;
        if (query) {
          const hay = `${t.note ?? ""} ${catName(t.category_id)} ${t.payment_method ?? ""}`;
          if (!hay.toLowerCase().includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [transactions, categoryId, from, to, query, categories],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const monthTotal = filtered
    .filter((t) => inMonth(t.date))
    .reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  function exportCsv() {
    const rows = [
      ["Date", "Type", "Category", "Amount", "Payment method", "Note"],
      ...filtered.map((t) => [
        t.date,
        t.type,
        catName(t.category_id),
        String(t.amount),
        t.payment_method ?? "",
        (t.note ?? "").replace(/"/g, "'"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mybudget-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Transactions">
      <Card className="space-y-3">
        <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2.5">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes and categories"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-full bg-surface px-4 py-2 text-xs font-semibold outline-none"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-full bg-surface px-4 py-2 text-xs font-semibold outline-none"
          />
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          <Chip active={!categoryId} onClick={() => setCategoryId(null)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">This month net</p>
          <p className="amount-xl text-2xl">{formatMoney(monthTotal, currency)}</p>
        </div>
        <Chip className="inline-flex items-center gap-1.5" onClick={exportCsv}>
          <Download size={14} /> CSV
        </Chip>
      </Card>

      {groups.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first expense or income to start tracking."
        />
      ) : (
        <div className="space-y-5">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="sticky top-20 z-10 -mx-4 bg-background/90 px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase backdrop-blur">
                {dayLabel(date)}
              </h2>
              <Card className="space-y-1">
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    tx={t}
                    category={categories.find((c) => c.id === t.category_id)}
                    currency={currency}
                  />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <Link
        to="/transactions/new"
        aria-label="Add transaction"
        className="gold-gradient fixed right-5 bottom-28 z-40 grid h-14 w-14 place-items-center rounded-full text-primary-foreground shadow-lg"
      >
        <Plus size={24} strokeWidth={2.6} />
      </Link>
    </AppShell>
  );
}

import { Link } from "@tanstack/react-router";
import { IconBubble } from "./primitives";
import { formatMoney, shortDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Category, Transaction } from "@/lib/data";

export function TransactionRow({
  tx,
  category,
  currency,
}: {
  tx: Transaction;
  category?: Category | undefined;
  currency: string;
}) {
  const t = useT();
  const isIncome = tx.type === "income";
  return (
    <Link
      to="/transactions/$transactionId"
      params={{ transactionId: tx.id }}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-3 transition-colors active:bg-surface"
    >
      <IconBubble icon={category?.icon} color={category?.color} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {tx.note?.trim() || category?.name || t("common.transaction")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {category?.name ?? t("common.uncategorised")} · {shortDate(tx.date)}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-bold ${isIncome ? "text-success" : "text-foreground"}`}
      >
        {isIncome ? "+" : "−"}
        {formatMoney(Number(tx.amount), currency)}
      </span>
    </Link>
  );
}

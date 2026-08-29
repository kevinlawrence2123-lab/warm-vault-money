import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/app/AppShell";
import { TransactionForm } from "@/components/app/TransactionForm";

interface QuickAddSearch {
  amount?: string;
  type?: "expense" | "income";
  account?: string;
  note?: string;
  detection?: string;
}

export const Route = createFileRoute("/_authenticated/transactions/new")({
  validateSearch: (search: Record<string, unknown>): QuickAddSearch => {
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
    const amount = str(search['amount'])?.replace(/[^0-9.]/g, "");
    const type = search['type'] === "income" ? "income" : str(search['type']) ? "expense" : undefined;
    return {
      ...(amount ? { amount } : {}),
      ...(type ? { type } : {}),
      ...(str(search['account']) ? { account: String(search['account']) } : {}),
      ...(str(search['note']) ? { note: String(search['note']) } : {}),
      ...(str(search['detection']) ? { detection: String(search['detection']) } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Add a transaction — MyBudget" },
      { name: "description", content: "Record a new expense or income with category, account and receipt." },
      { property: "og:title", content: "Add a transaction — MyBudget" },
      { property: "og:description", content: "Record a new expense or income with category, account and receipt." },
    ],
  }),
  component: NewTransaction,
});

function NewTransaction() {
  const search = Route.useSearch();
  const prefilled = Boolean(search.amount || search.note || search.account);

  return (
    <PageShell title={prefilled ? "Confirm transaction" : "Add transaction"}>
      {prefilled && (
        <p className="rounded-2xl bg-surface px-4 py-3 text-xs text-muted-foreground">
          Pre-filled from a quick-add link. Review the details, pick a category, then save.
        </p>
      )}
      <TransactionForm
        prefill={{
          amount: search.amount,
          type: search.type,
          accountName: search.account,
          note: search.note,
          detectionId: search.detection,
        }}
      />
    </PageShell>
  );
}

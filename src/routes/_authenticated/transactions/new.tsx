import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/app/AppShell";
import { TransactionForm } from "@/components/app/TransactionForm";

export const Route = createFileRoute("/_authenticated/transactions/new")({
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
  return (
    <PageShell title="Add transaction">
      <TransactionForm />
    </PageShell>
  );
}

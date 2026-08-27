import { createFileRoute, useParams } from "@tanstack/react-router";
import { PageShell } from "@/components/app/AppShell";
import { TransactionForm } from "@/components/app/TransactionForm";
import { EmptyState } from "@/components/app/primitives";
import { useTransactions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/transactions/$transactionId")({
  head: () => ({
    meta: [
      { title: "Edit transaction — MyBudget" },
      { name: "description", content: "Update or delete a recorded expense or income." },
      { property: "og:title", content: "Edit transaction — MyBudget" },
      { property: "og:description", content: "Update or delete a recorded expense or income." },
    ],
  }),
  component: EditTransaction,
});

function EditTransaction() {
  const { transactionId } = useParams({ from: "/_authenticated/transactions/$transactionId" });
  const { data: transactions = [], isLoading } = useTransactions();
  const transaction = transactions.find((t) => t.id === transactionId);

  return (
    <PageShell title="Edit transaction">
      {transaction ? (
        <TransactionForm existing={transaction} />
      ) : (
        !isLoading && <EmptyState title="Transaction not found" />
      )}
    </PageShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellOff, Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/AppShell";
import { Card, EmptyState, IconBubble } from "@/components/app/primitives";
import { dateTimeLabel, formatMoney } from "@/lib/format";
import { useT, type TKey } from "@/lib/i18n";
import { useCategories, useCurrency } from "@/lib/data";
import {
  DETECTION_SOURCES,
  useDetectedTransactions,
  useResolveDetection,
  type DetectedTransaction,
} from "@/lib/detection";

export const Route = createFileRoute("/_authenticated/detections")({
  head: () => ({
    meta: [
      { title: "Detected transactions — MyBudget" },
      {
        name: "description",
        content: "Review deposits and withdrawals detected from your bank and mobile money notifications.",
      },
      { property: "og:title", content: "Detected transactions — MyBudget" },
      {
        property: "og:description",
        content: "Review deposits and withdrawals detected from your bank and mobile money notifications.",
      },
    ],
  }),
  component: DetectionsPage,
});

function DetectionsPage() {
  const navigate = useNavigate();
  const t = useT();
  const currency = useCurrency();
  const { data: detections = [], isLoading } = useDetectedTransactions();
  const { data: categories = [] } = useCategories();
  const resolve = useResolveDetection();

  function iconFor(sourceKey: string) {
    return DETECTION_SOURCES.find((s) => s.key === sourceKey)?.icon ?? "smartphone";
  }

  function confirm(d: DetectedTransaction) {
    navigate({
      to: "/transactions/new",
      search: {
        amount: String(d.amount),
        type: d.type,
        note: d.raw_text ?? d.app_name,
        detection: d.id,
      },
    });
  }

  async function dismiss(d: DetectedTransaction, action: "ignored" | "muted") {
    try {
      await resolve.mutateAsync({ detection: d, action });
      toast.success(action === "muted" ? t("detections.muted") : t("detections.ignored"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("detections.couldNotUpdate"));
    }
  }

  return (
    <PageShell title={t("detections.title")}>
      {!isLoading && detections.length === 0 ? (
        <EmptyState
          title={t("detections.empty")}
          description={t("detections.emptyDesc")}
          action={
            <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-muted-foreground">
              <Inbox size={28} />
            </span>
          }
        />
      ) : (
        <div className="space-y-3">
          {detections.map((d) => {
            const category = categories.find((c) => c.id === d.category_id);
            return (
              <Card key={d.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <IconBubble icon={iconFor(d.source_key)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {t(`detection.source.${d.source_key}` as TKey)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {category?.name ?? t("detections.uncategorized")} ·{" "}
                      {dateTimeLabel(d.detected_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${d.type === "income" ? "text-success" : "text-foreground"}`}
                  >
                    {d.type === "income" ? "+" : "−"}
                    {formatMoney(Number(d.amount), currency)}
                  </span>
                </div>

                {d.raw_text && (
                  <p className="line-clamp-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground">
                    {d.raw_text}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => confirm(d)}
                    className="gold-gradient inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    <Check size={14} /> {t("detections.confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void dismiss(d, "ignored")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground"
                  >
                    <X size={14} /> {t("detections.ignore")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void dismiss(d, "muted")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground"
                  >
                    <BellOff size={14} /> {t("detections.alwaysIgnore")}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

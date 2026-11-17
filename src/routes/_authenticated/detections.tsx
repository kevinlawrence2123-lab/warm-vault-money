import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BellOff, Check, ClipboardPaste, Inbox, MessageSquareText, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/AppShell";
import { Card, EmptyState, IconBubble } from "@/components/app/primitives";
import { dateTimeLabel, formatMoney } from "@/lib/format";
import { useT, type TKey } from "@/lib/i18n";
import { useAccounts, useCategories, useCurrency } from "@/lib/data";
import {
  DETECTION_SOURCES,
  useDetectedTransactions,
  useDetectionRules,
  useDetectionSettings,
  useImportMessages,
  useMutedPatterns,
  useResolveDetection,
  type DetectedTransaction,
} from "@/lib/detection";
import { splitMessages } from "@/lib/detection-parse";

interface DetectionsSearch {
  /** Text shared from another app (Android share target) or opened by an iPhone Shortcut. */
  text?: string;
}

export const Route = createFileRoute("/_authenticated/detections")({
  validateSearch: (search: Record<string, unknown>): DetectionsSearch => {
    const parts = [search["title"], search["text"], search["url"]].filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
    return parts.length ? { text: parts.join("\n").slice(0, 8000) } : {};
  },
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

function PasteSmsCard({ initialText }: { initialText?: string | undefined }) {
  const t = useT();
  const navigate = useNavigate();
  const [text, setText] = useState(initialText ?? "");
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useDetectionRules();
  const { data: muted = [] } = useMutedPatterns();
  const { data: settings } = useDetectionSettings();
  const importMessages = useImportMessages();
  const autoRan = useRef(false);

  async function run(source: string) {
    const messages = splitMessages(source);
    if (!messages.length) return;
    try {
      const r = await importMessages.mutateAsync({
        messages,
        accounts,
        categories,
        rules,
        muted,
        defaultAccountId: settings?.default_account_id ?? null,
      });
      if (r.added) toast.success(t("detections.paste.added", { n: r.added }));
      if (r.duplicates) toast.info(t("detections.paste.duplicates", { n: r.duplicates }));
      if (!r.added && !r.duplicates) toast.error(t("detections.paste.nothing"));
      setText("");
      if (initialText) navigate({ to: "/detections", search: {}, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("detections.couldNotUpdate"));
    }
  }

  // Shared text arrives through the URL: import it as soon as the reference data is loaded.
  const ready = accounts.length > 0 || categories.length > 0;
  useEffect(() => {
    if (!initialText || autoRan.current || !ready) return;
    autoRan.current = true;
    void run(initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText, ready]);

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText((x) => (x ? `${x}\n\n${clip}` : clip));
    } catch {
      /* clipboard permission refused: the user can paste manually */
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareText size={18} className="text-primary" />
        <p className="text-sm font-bold">{t("detections.paste.title")}</p>
      </div>
      <p className="text-xs text-muted-foreground">{t("detections.paste.desc")}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t("detections.paste.placeholder")}
        className="w-full resize-y rounded-2xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void pasteFromClipboard()}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold"
        >
          <ClipboardPaste size={15} /> {t("detections.paste.clipboard")}
        </button>
        <button
          type="button"
          disabled={!text.trim() || importMessages.isPending}
          onClick={() => void run(text)}
          className="gold-gradient inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          <Wand2 size={15} /> {t("detections.paste.analyse")}
        </button>
      </div>
    </Card>
  );
}

function DetectionsPage() {
  const navigate = useNavigate();
  const t = useT();
  const search = Route.useSearch();
  const currency = useCurrency();
  const { data: detections = [], isLoading } = useDetectedTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const resolve = useResolveDetection();

  function sourceLabel(d: DetectedTransaction) {
    const known = DETECTION_SOURCES.some((s) => s.key === d.source_key);
    const base = known ? t(`detection.source.${d.source_key}` as TKey) : d.app_name;
    // Show the actual operator (Airtel, Wave…) when it is more precise than the source group
    return known && d.app_name && !["SMS", "Bank app"].includes(d.app_name) && !base.toLowerCase().includes(d.app_name.toLowerCase())
      ? `${base} · ${d.app_name}`
      : base;
  }

  function iconFor(sourceKey: string) {
    return DETECTION_SOURCES.find((s) => s.key === sourceKey)?.icon ?? "smartphone";
  }

  function confirm(d: DetectedTransaction) {
    navigate({
      to: "/transactions/new",
      search: {
        amount: String(d.amount),
        type: d.type,
        note: d.merchant ?? d.raw_text ?? d.app_name,
        detection: d.id,
        ...(d.category_id ? { category: d.category_id } : {}),
        ...(d.account_id ? { accountId: d.account_id } : {}),
        date: d.detected_at.slice(0, 10),
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
      <div className="space-y-4">
        <PasteSmsCard initialText={search.text} />

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
              const account = accounts.find((a) => a.id === d.account_id);
              return (
                <Card key={d.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IconBubble icon={iconFor(d.source_key)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{d.merchant ?? sourceLabel(d)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sourceLabel(d)} · {category?.name ?? t("detections.uncategorized")}
                        {account ? ` · ${account.name}` : ""} · {dateTimeLabel(d.detected_at)}
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
      </div>
    </PageShell>
  );
}

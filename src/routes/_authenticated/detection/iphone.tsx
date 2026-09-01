import { createFileRoute } from "@tanstack/react-router";
import { Copy, Link2, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/AppShell";
import { Card } from "@/components/app/primitives";
import { useT, type TKey } from "@/lib/i18n";

const SHORTCUT_LINK = "https://www.icloud.com/shortcuts/mybudget-quick-add";

const STEP_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

export const Route = createFileRoute("/_authenticated/detection/iphone")({
  head: () => ({
    meta: [
      { title: "iPhone setup — MyBudget" },
      {
        name: "description",
        content:
          "Step-by-step guide to auto-fill MyBudget transactions from bank notifications with an iOS Shortcuts automation.",
      },
      { property: "og:title", content: "iPhone setup — MyBudget" },
      {
        property: "og:description",
        content:
          "Step-by-step guide to auto-fill MyBudget transactions from bank notifications with an iOS Shortcuts automation.",
      },
    ],
  }),
  component: IphoneSetupPage,
});

function IphoneSetupPage() {
  const t = useT();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SHORTCUT_LINK);
      toast.success(t("iphone.copied"));
    } catch {
      toast.error(t("iphone.copyFailed"));
    }
  }

  return (
    <PageShell title={t("iphone.title")}>
      <Card className="space-y-2" wavy>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-primary">
          <Zap size={20} />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("iphone.intro")}
        </p>
      </Card>

      <ol className="space-y-3">
        {STEP_KEYS.map((step, i) => (
          <li key={step}>
            <Card className="flex gap-3">
              <span className="gold-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold">{t(`iphone.${step}.title` as TKey)}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(`iphone.${step}.body` as TKey)}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <button
          type="button"
          onClick={copyLink}
          className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground"
        >
          <Copy size={16} /> {t("iphone.copyLink")}
        </button>
        <a
          href="myapp://quick-add?amount=10&type=expense"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-card py-3.5 text-sm font-semibold"
        >
          <Link2 size={15} /> {t("iphone.testLink")}
        </a>
        <p className="text-center text-[11px] text-muted-foreground">
          {t("iphone.placeholderNote")}
        </p>
      </div>
    </PageShell>
  );
}

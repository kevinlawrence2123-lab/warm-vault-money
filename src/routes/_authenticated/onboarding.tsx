import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, Chip, IconBubble } from "@/components/app/primitives";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { GOAL_ICON_CHOICES } from "@/lib/icons";
import { useInvalidateAll, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your MyBudget" },
      { name: "description", content: "Choose your currency and create your first savings goal." },
      { property: "og:title", content: "Set up your MyBudget" },
      { property: "og:description", content: "Choose your currency and create your first savings goal." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const t = useT();
  const invalidate = useInvalidateAll();
  const { data: profile } = useProfile();
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState(profile?.currency ?? DEFAULT_CURRENCY);
  const [goalName, setGoalName] = useState("");
  const [goalIcon, setGoalIcon] = useState("target");
  const [goalTarget, setGoalTarget] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish(withGoal: boolean) {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user!.id;
      const { error } = await supabase
        .from("profiles")
        .update({ currency, onboarded: true })
        .eq("id", uid);
      if (error) throw error;

      if (withGoal && goalName && Number(goalTarget) > 0) {
        const { error: gErr } = await supabase.from("savings_goals").insert({
          user_id: uid,
          name: goalName,
          icon: goalIcon,
          target_amount: Number(goalTarget),
        });
        if (gErr) throw gErr;
      }
      invalidate();
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.couldNotSave"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg space-y-6 px-5 py-12">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {t("onboarding.step", { n: step + 1 })}
        </p>
        <h1 className="amount-xl mt-2 text-3xl">
          {step === 0 ? t("onboarding.pickCurrency") : t("onboarding.firstGoal")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 0 ? t("onboarding.currencyHint") : t("onboarding.goalHint")}
        </p>
      </div>

      {step === 0 ? (
        <>
          <div className="grid gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`flex items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors ${
                  currency === c.code
                    ? "gold-gradient text-primary-foreground"
                    : "surface-card"
                }`}
              >
                <span className="font-semibold">{c.label}</span>
                <span className="text-sm font-bold opacity-80">{c.code}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground"
          >
            {t("common.continue")} <ArrowRight size={17} />
          </button>
        </>
      ) : (
        <>
          <Card className="space-y-4">
            <input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder={t("onboarding.goalNamePlaceholder")}
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
            />
            <input
              value={goalTarget}
              inputMode="decimal"
              onChange={(e) => setGoalTarget(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={t("onboarding.targetAmount")}
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
            />
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {GOAL_ICON_CHOICES.map((i) => (
                <button key={i} type="button" onClick={() => setGoalIcon(i)}>
                  <IconBubble icon={i} active={goalIcon === i} />
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => finish(true)}
              className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {t("onboarding.createFinish")}
            </button>
            <Chip className="w-full py-3" onClick={() => finish(false)}>
              {t("onboarding.skip")}
            </Chip>
          </div>
        </>
      )}
    </div>
  );
}

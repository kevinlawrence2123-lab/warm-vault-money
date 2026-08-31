import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Card, Chip, EmptyState, IconBubble, ProgressBar } from "@/components/app/primitives";
import { formatMoney, daysUntil } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { GOAL_ICON_CHOICES } from "@/lib/icons";
import { useCurrency, useGoals, useInvalidateAll } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/goals/")({
  head: () => ({
    meta: [
      { title: "Savings goals — MyBudget" },
      { name: "description", content: "Set savings targets and watch your progress grow every month." },
      { property: "og:title", content: "Savings goals — MyBudget" },
      { property: "og:description", content: "Set savings targets and watch your progress grow every month." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const t = useT();
  const currency = useCurrency();
  const invalidate = useInvalidateAll();
  const { data: goals = [] } = useGoals();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("target");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name || Number(target) <= 0) {
      toast.error(t("goals.needNameTarget"));
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("savings_goals").insert({
      user_id: userData.user!.id,
      name,
      icon,
      target_amount: Number(target),
      target_date: date || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
    setOpen(false);
    setName("");
    setTarget("");
    setDate("");
    toast.success(t("goals.created"));
  }

  return (
    <AppShell title={t("goals.title")}>
      {open && (
        <Card className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("goals.namePlaceholder")}
            className="w-full bg-transparent font-semibold outline-none placeholder:text-muted-foreground"
          />
          <input
            value={target}
            inputMode="decimal"
            onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder={t("goals.targetAmount")}
            className="w-full bg-transparent font-semibold outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("goals.targetDate")}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none"
            />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {GOAL_ICON_CHOICES.map((i) => (
              <button key={i} type="button" onClick={() => setIcon(i)}>
                <IconBubble icon={i} active={icon === i} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={create}
              disabled={busy}
              className="gold-gradient flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />} {t("goals.create")}
            </button>
            <Chip onClick={() => setOpen(false)}>{t("common.cancel")}</Chip>
          </div>
        </Card>
      )}

      {goals.length === 0 && !open ? (
        <EmptyState
          title={t("goals.none")}
          description={t("goals.noneDesc")}
          action={<Chip active onClick={() => setOpen(true)}>{t("goals.createOne")}</Chip>}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = g.target_amount ? (g.current_amount / g.target_amount) * 100 : 0;
            const days = daysUntil(g.target_date);
            return (
              <Link key={g.id} to="/goals/$goalId" params={{ goalId: g.id }}>
                <Card className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IconBubble icon={g.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.status === "completed"
                          ? t("goals.completed")
                          : days !== null
                            ? t("goals.daysLeft", { n: days })
                            : t("goals.noDeadline")}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">{Math.round(pct)}%</p>
                  </div>
                  <ProgressBar value={pct} tone={g.status === "completed" ? "gold" : "gold"} />
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(g.current_amount, currency)} {t("common.of")}{" "}
                    {formatMoney(g.target_amount, currency)}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-label={t("goals.newGoal")}
        onClick={() => setOpen((v) => !v)}
        className="gold-gradient fixed right-5 bottom-28 z-40 grid h-14 w-14 place-items-center rounded-full text-primary-foreground shadow-lg"
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>
    </AppShell>
  );
}

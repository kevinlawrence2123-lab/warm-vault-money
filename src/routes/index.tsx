import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, PieChart, Target, Wallet } from "lucide-react";
import { useSession } from "@/lib/data";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyBudget — Track spending, budgets and savings goals" },
      {
        name: "description",
        content:
          "MyBudget is a mobile-first personal finance app to track expenses and income, follow monthly budgets and reach your savings goals.",
      },
      { property: "og:title", content: "MyBudget — Personal finance, beautifully simple" },
      {
        property: "og:description",
        content:
          "Track every expense, organise by category, set monthly budgets and grow your savings goals in one place.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const t = useT();
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-between px-6 py-12">
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="text-sm font-bold tracking-[0.2em] uppercase">MyBudget</span>
        </div>

        <div className="space-y-4">
          <h1 className="amount-xl text-5xl">
            {t("landing.tagline1")}
            <br />
            <span className="text-primary">{t("landing.tagline2")}</span>
          </h1>
          <p className="text-base text-muted-foreground">
            {t("landing.intro")}
          </p>
        </div>

        <div className="grid gap-3">
          {[
            { icon: Wallet, title: t("landing.f1.title"), text: t("landing.f1.text") },
            { icon: PieChart, title: t("landing.f2.title"), text: t("landing.f2.text") },
            { icon: Target, title: t("landing.f3.title"), text: t("landing.f3.text") },
          ].map((f) => (
            <div key={f.title} className="surface-card flex items-start gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-primary">
                <f.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/auth"
        className="gold-gradient mt-10 flex items-center justify-center gap-2 rounded-full py-4 text-base font-bold text-primary-foreground"
      >
        {t("landing.cta")} <ArrowRight size={18} />
      </Link>
    </div>
  );
}

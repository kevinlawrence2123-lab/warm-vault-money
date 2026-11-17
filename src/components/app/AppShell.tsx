import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Home,
  ListOrdered,
  PieChart,
  Search,
  Target,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassIconButton } from "./primitives";
import { useProfile } from "@/lib/data";
import { useDetectedTransactions } from "@/lib/detection";
import { useT, type TKey } from "@/lib/i18n";

const TABS = [
  { to: "/home", labelKey: "nav.home", icon: Home },
  { to: "/transactions", labelKey: "nav.records", icon: ListOrdered },
  { to: "/goals", labelKey: "nav.goals", icon: Target },
  { to: "/budget", labelKey: "nav.budget", icon: PieChart },
  { to: "/profile", labelKey: "nav.profile", icon: User },
] as const;

export function TopBar({ title }: { title: string }) {
  const t = useT();
  const { data: profile } = useProfile();
  const { data: detections = [] } = useDetectedTransactions();
  const navigate = useNavigate();
  const initial = (profile?.name || profile?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 pb-2">
      <div className="glass-button grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-full py-2 pr-2 pl-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GlassIconButton
            label={t("nav.searchTransactions")}
            onClick={() => navigate({ to: "/transactions" })}
          >
            <Search size={17} />
          </GlassIconButton>
          <div className="relative">
            <GlassIconButton
              label={t("nav.detectedTransactions")}
              onClick={() => navigate({ to: "/detections" })}
            >
              <Bell size={17} />
            </GlassIconButton>
            {detections.length > 0 && (
              <span className="gold-gradient absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-primary-foreground">
                {detections.length > 9 ? "9+" : detections.length}
              </span>
            )}
          </div>

          <Link
            to="/profile"
            aria-label={t("nav.profile")}
            className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface text-sm font-bold"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = TABS.findIndex((tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-3 pb-3">
      <div className="glass-button rounded-3xl px-2 py-2">
        <div className="relative flex items-center justify-between">
          {/* Sliding indicator (Skiper-style animated menu) */}
          {active >= 0 && (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-2xl bg-primary/12 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${100 / TABS.length}%`, transform: `translateX(${active * 100}%)` }}
            >
              <span className="gold-gradient absolute top-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full" />
            </span>
          )}
          {TABS.map((tab, i) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-colors duration-300",
                i === active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon
                size={19}
                strokeWidth={2.2}
                className={cn("transition-transform duration-500", i === active && "-translate-y-0.5 scale-110")}
              />
              {t(tab.labelKey as TKey)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function AppShell({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-background">
      <TopBar title={title} />
      <main className={cn("page-in space-y-6 px-4 pt-2 pb-32", className)}>{children}</main>
      <BottomNav />
    </div>
  );
}

export function PageShell({
  title,
  children,
  onBack,
}: {
  title: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  const t = useT();
  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 pb-2">
        <GlassIconButton
          label={t("common.goBack")}
          onClick={() => (onBack ? onBack() : navigate({ to: "/home" }))}
        >
          <Wallet size={17} className="hidden" />
          <span aria-hidden>←</span>
        </GlassIconButton>
        <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
      </header>
      <main className="page-in space-y-6 px-4 pt-2 pb-32">{children}</main>
    </div>
  );
}

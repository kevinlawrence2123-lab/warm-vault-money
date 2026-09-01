import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  Download,
  Fingerprint,
  Landmark,
  LogOut,
  Moon,
  Radar,
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Card, Chip } from "@/components/app/primitives";
import { CURRENCIES, DEFAULT_CURRENCY, LANGUAGES } from "@/lib/format";
import { useI18n, type Lang } from "@/lib/i18n";
import { useInvalidateAll, useProfile, useTransactions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — MyBudget" },
      { name: "description", content: "Manage your profile, currency, security and data preferences." },
      { property: "og:title", content: "Profile & settings — MyBudget" },
      { property: "og:description", content: "Manage your profile, currency, security and data preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { t, setLang } = useI18n();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAll();
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [language, setLanguage] = useState("en");
  const [pinLock, setPinLock] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setCurrency(profile.currency ?? DEFAULT_CURRENCY);
    setLanguage(profile.language ?? "en");
    setPinLock(Boolean(profile.pin_enabled));
    setNotifications(profile.notifications_enabled ?? true);
  }, [profile]);

  async function save(patch: Partial<{ name: string; currency: string; language: string; notifications_enabled: boolean; pin_enabled: boolean }>) {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
    toast.success(t("common.saved"));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mybudget-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell title={t("profile.title")}>
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-xl font-bold">
            {(profile?.name || profile?.email || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{profile?.name || t("profile.yourName")}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== profile?.name && save({ name })}
          placeholder={t("profile.displayName")}
          className="w-full rounded-full bg-surface px-4 py-3 text-sm font-semibold outline-none placeholder:text-muted-foreground"
        />
      </Card>

      <Card className="space-y-4">
        <p className="font-bold">{t("profile.preferences")}</p>
        <Row label={t("profile.currency")}>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              void save({ currency: e.target.value });
            }}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-card">
                {c.code}
              </option>
            ))}
          </select>
        </Row>
        <Row label={t("profile.language")}>
          <select
            value={language}
            onChange={(e) => {
              const next = e.target.value as Lang;
              setLanguage(next);
              setLang(next);
              void save({ language: next });
            }}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-card">
                {l.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label={<Inline icon={<Bell size={15} />}>{t("profile.notifications")}</Inline>}>
          <Toggle
            on={notifications}
            onChange={(v) => {
              setNotifications(v);
              void save({ notifications_enabled: v });
            }}
          />
        </Row>
        <Row label={<Inline icon={<Fingerprint size={15} />}>{t("profile.pinLock")}</Inline>}>
          <Toggle
            on={pinLock}
            onChange={(v) => {
              setPinLock(v);
              void save({ pin_enabled: v });
            }}
          />
        </Row>
        <Row label={<Inline icon={<Moon size={15} />}>{t("profile.darkTheme")}</Inline>}>
          <span className="text-xs text-muted-foreground">{t("profile.alwaysOn")}</span>
        </Row>
      </Card>

      <Link to="/accounts">
        <Card className="flex items-center gap-3">
          <Wallet size={17} className="text-primary" />
          <p className="flex-1 font-semibold">{t("profile.accounts")}</p>
          <ChevronRight size={17} className="text-muted-foreground" />
        </Card>
      </Link>

      <Card className="space-y-3">
        <p className="font-bold">{t("profile.connectData")}</p>
        <p className="text-xs text-muted-foreground">
          {t("profile.connectHint")}
        </p>
        <div className="space-y-2">
          <Link to="/detection" className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-3">
            <Radar size={16} className="text-primary" />
            <span className="flex-1 text-sm font-semibold">{t("profile.autoDetection")}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
          <Link
            to="/detection/iphone"
            className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-3"
          >
            <Smartphone size={16} className="text-primary" />
            <span className="flex-1 text-sm font-semibold">{t("profile.iphoneSetup")}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
          {[t("profile.bankAccount"), t("profile.mobileBanking"), "Nita", "Amana"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              {label === t("profile.bankAccount") ? (
                <Landmark size={16} className="text-muted-foreground" />
              ) : (
                <Smartphone size={16} className="text-muted-foreground" />
              )}
              <span className="flex-1 text-sm">{label}</span>
              <Chip
                className="text-xs opacity-60"
                onClick={() =>
                  toast(t("common.comingSoon"), {
                    description: t("profile.comingSoonDesc", { label }),
                  })
                }
              >
                {t("common.connect")}
              </Chip>
            </div>
          ))}
        </div>
      </Card>


      <Card className="space-y-3">
        <Chip className="inline-flex items-center gap-2" onClick={exportData}>
          <Download size={14} /> {t("profile.exportData")}
        </Chip>
        <Chip className="inline-flex items-center gap-2 text-destructive" onClick={signOut}>
          <LogOut size={14} /> {t("profile.logOut")}
        </Chip>
      </Card>
    </AppShell>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Inline({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {children}
    </span>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`h-6 w-11 rounded-full p-0.5 transition-colors ${on ? "gold-gradient" : "bg-surface"}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

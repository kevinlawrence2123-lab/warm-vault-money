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
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Card, Chip } from "@/components/app/primitives";
import { CURRENCIES, LANGUAGES } from "@/lib/format";
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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAll();
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  const [pinLock, setPinLock] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setCurrency(profile.currency ?? "USD");
    setLanguage(profile.language ?? "en");
    setPinLock(Boolean(profile.pin_lock_enabled));
    setNotifications(profile.notifications_enabled ?? true);
  }, [profile]);

  async function save(patch: Record<string, unknown>) {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
    toast.success("Saved");
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
    <AppShell title="Profile">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-xl font-bold">
            {(profile?.name || profile?.email || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{profile?.name || "Your name"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== profile?.name && save({ name })}
          placeholder="Display name"
          className="w-full rounded-full bg-surface px-4 py-3 text-sm font-semibold outline-none placeholder:text-muted-foreground"
        />
      </Card>

      <Card className="space-y-4">
        <p className="font-bold">Preferences</p>
        <Row label="Currency">
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
        <Row label="Language">
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              void save({ language: e.target.value });
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
        <Row label={<Inline icon={<Bell size={15} />}>Notifications</Inline>}>
          <Toggle
            on={notifications}
            onChange={(v) => {
              setNotifications(v);
              void save({ notifications_enabled: v });
            }}
          />
        </Row>
        <Row label={<Inline icon={<Fingerprint size={15} />}>PIN / biometric lock</Inline>}>
          <Toggle
            on={pinLock}
            onChange={(v) => {
              setPinLock(v);
              void save({ pin_lock_enabled: v });
            }}
          />
        </Row>
        <Row label={<Inline icon={<Moon size={15} />}>Dark theme</Inline>}>
          <span className="text-xs text-muted-foreground">Always on</span>
        </Row>
      </Card>

      <Link to="/accounts">
        <Card className="flex items-center gap-3">
          <Wallet size={17} className="text-primary" />
          <p className="flex-1 font-semibold">Accounts</p>
          <ChevronRight size={17} className="text-muted-foreground" />
        </Card>
      </Link>

      <Card className="space-y-3">
        <p className="font-bold">Connect data</p>
        <p className="text-xs text-muted-foreground">
          Automatic synchronisation is coming soon.
        </p>
        <div className="space-y-2">
          {["Bank account", "Mobile banking", "Nita", "Amana"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              {label === "Bank account" ? (
                <Landmark size={16} className="text-muted-foreground" />
              ) : (
                <Smartphone size={16} className="text-muted-foreground" />
              )}
              <span className="flex-1 text-sm">{label}</span>
              <Chip
                className="text-xs opacity-60"
                onClick={() => toast("Coming soon", { description: `${label} sync isn't available yet.` })}
              >
                Connect
              </Chip>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <Chip className="inline-flex items-center gap-2" onClick={exportData}>
          <Download size={14} /> Export my data
        </Chip>
        <Chip className="inline-flex items-center gap-2 text-destructive" onClick={signOut}>
          <LogOut size={14} /> Log out
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

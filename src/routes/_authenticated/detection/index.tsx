import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Copy, Send, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAccounts, useCategories } from "@/lib/data";
import { PageShell } from "@/components/app/AppShell";
import { Card, IconBubble } from "@/components/app/primitives";
import {
  DETECTION_SOURCES,
  requestNotificationAccess,
  sourceStatus,
  useDetectionSettings,
  useDetectionSources,
  useSaveDetectionSettings,
  useToggleSource,
  useDetectionRules,
  useSaveDetectionRule,
  useDeleteDetectionRule,
  ingestEndpoint,
  type SourceStatus,
} from "@/lib/detection";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/detection/")({
  head: () => ({
    meta: [
      { title: "Automatic detection — MyBudget" },
      {
        name: "description",
        content:
          "Let MyBudget detect deposits and withdrawals from your bank and mobile money notifications on this device.",
      },
      { property: "og:title", content: "Automatic detection — MyBudget" },
      {
        property: "og:description",
        content:
          "Let MyBudget detect deposits and withdrawals from your bank and mobile money notifications on this device.",
      },
    ],
  }),
  component: DetectionSettingsPage,
});

function DetectionSettingsPage() {
  const t = useT();
  const { data: settings } = useDetectionSettings();
  const { data: sources = [] } = useDetectionSources();
  const saveSettings = useSaveDetectionSettings();
  const toggleSource = useToggleSource();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useDetectionRules();
  const addRule = useSaveDetectionRule();
  const deleteRule = useDeleteDetectionRule();

  const [showToken, setShowToken] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleAuto, setRuleAuto] = useState(false);
  const [testing, setTesting] = useState(false);

  const endpoint = ingestEndpoint();
  const token = settings?.ingest_token ?? "";
  const sampleBody = JSON.stringify(
    { token: token || "YOUR_KEY", app: "Bank app", text: "[notification]" },
    null,
    2,
  );

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("detection.forward.copied"));
    } catch {
      toast.error(t("detection.forward.testFailed"));
    }
  }

  async function regenerateToken() {
    const next = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await saveSettings.mutateAsync({ ingest_token: next });
    toast.success(t("detection.forward.regenerated"));
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          app: "Bank app",
          text: "Debit of XOF 12,500 at SUPERMARCHE CENTRAL. Ref TEST" + Date.now(),
        }),
      });
      const payload = (await res.json()) as { status?: string; error?: string };
      if (!res.ok) throw new Error(payload.error ?? String(res.status));
      toast.success(t("detection.forward.testSent", { status: payload.status ?? "ok" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("detection.forward.testFailed"));
    } finally {
      setTesting(false);
    }
  }

  async function submitRule() {
    if (!keyword.trim()) {
      toast.error(t("detection.rules.needKeyword"));
      return;
    }
    await addRule.mutateAsync({
      keyword: keyword.trim(),
      category_id: ruleCategory || null,
      auto_confirm: ruleAuto,
    });
    setKeyword("");
    setRuleCategory("");
    setRuleAuto(false);
  }

  const master = Boolean(settings?.enabled);
  const permission = Boolean(settings?.permission_granted);

  function enabledFor(key: string) {
    return sources.find((s) => s.key === key)?.enabled ?? false;
  }

  async function setMaster(on: boolean) {
    await saveSettings.mutateAsync({ enabled: on });
    if (on && !permission) {
      const opened = requestNotificationAccess();
      toast(opened ? t("detection.openingAndroid") : t("detection.grantToast"), {
        description: opened ? t("detection.openingDesc") : t("detection.grantToastDesc"),
      });
    }
  }

  return (
    <PageShell title={t("detection.title")}>
      <Card className="space-y-3" wavy>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-primary">
          <ShieldCheck size={20} />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("detection.intro")}
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">{t("detection.enable")}</p>
            <p className="text-xs text-muted-foreground">
              {master
                ? permission
                  ? t("detection.granted")
                  : t("detection.waiting")
                : t("detection.off")}
            </p>
          </div>
          <Toggle on={master} onChange={(v) => void setMaster(v)} />
        </div>

        {master && !permission && (
          <div className="space-y-3 rounded-2xl bg-surface p-4">
            <p className="text-sm font-bold">{t("detection.grantTitle")}</p>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li>{t("detection.step1")}</li>
              <li>{t("detection.step2")}</li>
              <li>{t("detection.step3")}</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const opened = requestNotificationAccess();
                  if (!opened) toast(t("detection.openHint"));
                }}
                className="gold-gradient rounded-full px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                {t("detection.openSettings")}
              </button>
              <button
                type="button"
                onClick={() => void saveSettings.mutateAsync({ permission_granted: true })}
                className="rounded-full bg-card px-4 py-2 text-sm font-semibold"
              >
                {t("detection.granted.btn")}
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <p className="font-bold">{t("detection.supportedApps")}</p>
        {DETECTION_SOURCES.map((src) => {
          const on = enabledFor(src.key);
          const status = sourceStatus(settings, on);
          return (
            <div key={src.key} className="flex items-center gap-3">
              <IconBubble icon={src.icon} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {t(`detection.source.${src.key}` as TKey)}
                </p>
                <StatusPill status={status} />
              </div>
              <Toggle
                on={on}
                onChange={(v) =>
                  void toggleSource.mutateAsync({
                    key: src.key,
                    label: src.label,
                    enabled: v,
                  })
                }
              />
            </div>
          );
        })}
      </Card>

      <Card className="space-y-4">
        <p className="font-bold">{t("detection.forward.title")}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("detection.forward.intro")}
        </p>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("detection.forward.endpoint")}
          </p>
          <div className="flex items-center gap-2 rounded-2xl bg-surface p-3">
            <code className="min-w-0 flex-1 truncate text-xs">{endpoint}</code>
            <button
              type="button"
              onClick={() => void copy(endpoint)}
              aria-label={t("detection.forward.copyEndpoint")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-primary"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("detection.forward.token")}
          </p>
          <div className="flex items-center gap-2 rounded-2xl bg-surface p-3">
            <code className="min-w-0 flex-1 truncate text-xs">
              {showToken ? token : "•".repeat(24)}
            </code>
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="shrink-0 rounded-full bg-card px-3 py-1 text-[11px] font-semibold"
            >
              {showToken ? t("detection.forward.hide") : t("detection.forward.reveal")}
            </button>
            <button
              type="button"
              onClick={() => void copy(token)}
              aria-label={t("detection.forward.copyToken")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-primary"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("detection.forward.keyWarning")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void regenerateToken()}
              className="rounded-full bg-card px-4 py-2 text-xs font-semibold"
            >
              {t("detection.forward.regenerate")}
            </button>
            <button
              type="button"
              onClick={() => void copy(sampleBody)}
              className="rounded-full bg-card px-4 py-2 text-xs font-semibold"
            >
              {t("detection.forward.copyBody")}
            </button>
            <button
              type="button"
              disabled={testing || !token}
              onClick={() => void sendTest()}
              className="gold-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              <Send size={13} /> {t("detection.forward.test")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {settings?.last_ingest_at
              ? t("detection.forward.lastSeen", {
                  when: new Date(settings.last_ingest_at).toLocaleString(),
                })
              : t("detection.forward.never")}
          </p>
        </div>

        <div className="space-y-1.5 rounded-2xl bg-surface p-4 text-xs text-muted-foreground">
          <p className="text-sm font-bold text-foreground">{t("detection.forward.howto")}</p>
          <p>{t("detection.forward.a1")}</p>
          <p>{t("detection.forward.a2")}</p>
          <p>{t("detection.forward.a3")}</p>
          <p>{t("detection.forward.a4")}</p>
          <p>{t("detection.forward.a5")}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">{t("detection.autoSave.title")}</p>
            <p className="text-xs text-muted-foreground">{t("detection.autoSave.desc")}</p>
          </div>
          <Toggle
            on={Boolean(settings?.auto_save)}
            onChange={(v) => void saveSettings.mutateAsync({ auto_save: v })}
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("detection.defaultAccount")}</span>
          <select
            value={settings?.default_account_id ?? ""}
            onChange={(e) =>
              void saveSettings.mutateAsync({ default_account_id: e.target.value || null })
            }
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Card className="space-y-4">
        <div>
          <p className="font-bold">{t("detection.rules.title")}</p>
          <p className="text-xs text-muted-foreground">{t("detection.rules.desc")}</p>
        </div>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("detection.rules.none")}</p>
        ) : (
          <ul className="space-y-2">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.keyword}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {categories.find((c) => c.id === r.category_id)?.name ??
                      t("detections.uncategorized")}
                    {r.auto_confirm ? ` · ${t("detection.rules.autoConfirm")}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteRule.mutateAsync(r.id)}
                  aria-label={r.keyword}
                  className="grid h-8 w-8 place-items-center rounded-full bg-card text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("detection.rules.keyword")}
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
          />
          <select
            value={ruleCategory}
            onChange={(e) => setRuleCategory(e.target.value)}
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {t("detection.rules.autoConfirm")}
            </span>
            <Toggle on={ruleAuto} onChange={setRuleAuto} />
          </div>
          <button
            type="button"
            onClick={() => void submitRule()}
            className="gold-gradient w-full rounded-full py-3 text-sm font-bold text-primary-foreground"
          >
            {t("detection.rules.add")}
          </button>
        </div>
      </Card>

      <Link to="/detection/iphone">
        <Card className="flex items-center gap-3">
          <Smartphone size={17} className="text-primary" />
          <p className="flex-1 font-semibold">{t("detection.iphoneLink")}</p>
          <ChevronRight size={17} className="text-muted-foreground" />
        </Card>
      </Link>
    </PageShell>
  );
}

function StatusPill({ status }: { status: SourceStatus }) {
  const t = useT();
  const labelKey: TKey =
    status === "Active"
      ? "detection.status.active"
      : status === "Waiting for permission"
        ? "detection.status.waiting"
        : "detection.status.off";
  const tone =
    status === "Active"
      ? "text-success"
      : status === "Waiting for permission"
        ? "text-warning"
        : "text-muted-foreground";
  return <p className={`text-[11px] font-semibold ${tone}`}>{t(labelKey)}</p>;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${on ? "gold-gradient" : "bg-surface"}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

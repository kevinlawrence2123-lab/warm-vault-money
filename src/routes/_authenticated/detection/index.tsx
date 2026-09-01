import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
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

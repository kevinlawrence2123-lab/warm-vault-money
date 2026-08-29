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
      toast(opened ? "Opening Android settings…" : "Grant notification access", {
        description: opened
          ? "Enable MyBudget in the notification access list."
          : "Open Android Settings › Notifications › Notification access and allow MyBudget.",
      });
    }
  }

  return (
    <PageShell title="Automatic detection">
      <Card className="space-y-3" wavy>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-primary">
          <ShieldCheck size={20} />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          MyBudget can automatically detect deposits and withdrawals from your bank and
          mobile money apps by reading their notifications on this device. No notification
          content is sent to our servers — only the detected amount, type, and app name are
          saved.
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">Enable automatic detection</p>
            <p className="text-xs text-muted-foreground">
              {master
                ? permission
                  ? "Notification access granted."
                  : "Waiting for notification access."
                : "Turned off on this device."}
            </p>
          </div>
          <Toggle on={master} onChange={(v) => void setMaster(v)} />
        </div>

        {master && !permission && (
          <div className="space-y-3 rounded-2xl bg-surface p-4">
            <p className="text-sm font-bold">Grant notification access</p>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li>1. Open Android Settings › Notifications.</li>
              <li>2. Tap “Notification access” (or “Device &amp; app notifications”).</li>
              <li>3. Find MyBudget and turn it on, then confirm.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const opened = requestNotificationAccess();
                  if (!opened) toast("Open Android Settings › Notification access");
                }}
                className="gold-gradient rounded-full px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Open system settings
              </button>
              <button
                type="button"
                onClick={() => void saveSettings.mutateAsync({ permission_granted: true })}
                className="rounded-full bg-card px-4 py-2 text-sm font-semibold"
              >
                I've granted it
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <p className="font-bold">Supported apps</p>
        {DETECTION_SOURCES.map((src) => {
          const on = enabledFor(src.key);
          const status = sourceStatus(settings, on);
          return (
            <div key={src.key} className="flex items-center gap-3">
              <IconBubble icon={src.icon} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{src.label}</p>
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
          <p className="flex-1 font-semibold">Set up automatic detection on iPhone</p>
          <ChevronRight size={17} className="text-muted-foreground" />
        </Card>
      </Link>
    </PageShell>
  );
}

function StatusPill({ status }: { status: SourceStatus }) {
  const tone =
    status === "Active"
      ? "text-success"
      : status === "Waiting for permission"
        ? "text-warning"
        : "text-muted-foreground";
  return <p className={`text-[11px] font-semibold ${tone}`}>{status}</p>;
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

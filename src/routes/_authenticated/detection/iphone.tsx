import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Send, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/AppShell";
import { Card } from "@/components/app/primitives";
import { useT, type TKey } from "@/lib/i18n";
import { ingestEndpoint, useDetectionSettings } from "@/lib/detection";

/** SMS senders seen on the user's iPhone in Togo (one automation per sender). */
const SENDERS = ["ECOBANK", "MoovMoney", "Mixx Togo"];

/** Prompt for the optional Apple Intelligence "Use Model" action. */
const AI_PROMPT =
  "Voici un SMS de banque ou de mobile money. Donne uniquement le montant de l'opération " +
  "(pas le solde, pas les frais), le sens (income si de l'argent est reçu, expense s'il sort) " +
  "et le nom du bénéficiaire ou de l'expéditeur. Réponds seulement en JSON : " +
  '{"amount": nombre, "type": "income" ou "expense", "merchant": "texte"}. SMS : ';

const STEPS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export const Route = createFileRoute("/_authenticated/detection/iphone")({
  head: () => ({
    meta: [
      { title: "iPhone setup — MyBudget" },
      {
        name: "description",
        content: "Send your bank and mobile money SMS to MyBudget automatically with an iPhone Shortcuts automation.",
      },
      { property: "og:title", content: "iPhone setup — MyBudget" },
      {
        property: "og:description",
        content: "Send your bank and mobile money SMS to MyBudget automatically with an iPhone Shortcuts automation.",
      },
    ],
  }),
  component: IphoneSetupPage,
});

function CopyRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const t = useT();
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(!secret);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      toast.success(t("iphone2.copied"));
    } catch {
      toast.error(t("iphone.copyFailed"));
    }
  }
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
        <code className="min-w-0 flex-1 truncate text-xs" onClick={() => secret && setShow(!show)}>
          {show ? value : "•".repeat(24)}
        </code>
        <button type="button" onClick={() => void copy()} aria-label={t("iphone2.copy")} className="shrink-0 text-muted-foreground">
          {done ? <Check size={16} className="text-success" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function IphoneSetupPage() {
  const t = useT();
  const { data: settings } = useDetectionSettings();
  const endpoint = ingestEndpoint();
  const token = settings?.ingest_token ?? "";
  const [testing, setTesting] = useState(false);

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/public/detection-ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          sender: "MoovMoney",
          dry_run: true,
          text: "Transfert recu. Montant: 5 000,00 FCFA Expéditeur: 22890000000 Date: 21/09/2026 19:58:44. Nouveau solde Moov Money: 5 096,87 FCFA. Txn ID: 040886159476",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
        amount?: number;
        type?: string;
        provider?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? `HTTP ${res.status}`);
      if (payload.status === "detection_disabled") {
        toast.error(t("iphone2.testDisabled"));
        return;
      }
      toast.success(
        t("iphone2.testOk", {
          amount: payload.amount ?? "?",
          type: payload.type === "income" ? "+" : "−",
          provider: payload.provider ?? "",
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("detection.forward.testFailed"));
    } finally {
      setTesting(false);
    }
  }

  return (
    <PageShell title={t("iphone.title")}>
      <Card className="space-y-2" wavy>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-primary">
          <Zap size={20} />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("iphone2.intro")}</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-bold">{t("iphone2.yourValues")}</p>
        <CopyRow label={t("iphone2.url")} value={endpoint} />
        {token ? (
          <CopyRow label={t("iphone2.token")} value={token} secret />
        ) : (
          <p className="text-xs text-muted-foreground">{t("iphone2.noToken")}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {SENDERS.map((s) => (
            <span key={s} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold">
              {s}
            </span>
          ))}
        </div>
      </Card>

      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step}>
            <Card className="flex gap-3">
              <span className="gold-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold">{t(`iphone2.${step}.title` as TKey)}</p>
                <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                  {t(`iphone2.${step}.body` as TKey)}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Sparkles size={16} className="text-primary" /> {t("iphone2.ai.title")}
        </p>
        <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">{t("iphone2.ai.body")}</p>
        <CopyRow label={t("iphone2.ai.prompt")} value={AI_PROMPT} />
      </Card>

      <button
        type="button"
        disabled={!token || testing}
        onClick={() => void sendTest()}
        className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground disabled:opacity-40"
      >
        <Send size={16} /> {t("iphone2.test")}
      </button>
      <p className="text-center text-[11px] text-muted-foreground">{t("iphone2.testNote")}</p>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Copy, Link2, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/AppShell";
import { Card } from "@/components/app/primitives";

const SHORTCUT_LINK = "https://www.icloud.com/shortcuts/mybudget-quick-add";

const STEPS = [
  {
    title: "Open the Shortcuts app",
    body: "On your iPhone, open Shortcuts and go to the Automation tab.",
  },
  {
    title: "Create a personal automation",
    body: "Tap “+”, choose “App” or “Message/Notification” and select your bank or mobile money app.",
  },
  {
    title: "Add the “Get Text from Input” action",
    body: "This grabs the notification text so the amount can be extracted from it.",
  },
  {
    title: "Add “Match Text” to find the amount",
    body: "Use a pattern such as [0-9]+([.,][0-9]{2})? to capture the amount in the message.",
  },
  {
    title: "Add “Open URL”",
    body: "Point it at myapp://quick-add?amount=[matched amount]&type=expense and add &note= with the app name if you like.",
  },
  {
    title: "Turn off “Ask Before Running”",
    body: "MyBudget still asks you to confirm the transaction, so the automation can run silently.",
  },
  {
    title: "Confirm in MyBudget",
    body: "Each detection opens the add-transaction screen pre-filled — pick a category and save in one tap.",
  },
];

export const Route = createFileRoute("/_authenticated/detection/iphone")({
  head: () => ({
    meta: [
      { title: "iPhone setup — MyBudget" },
      {
        name: "description",
        content:
          "Step-by-step guide to auto-fill MyBudget transactions from bank notifications with an iOS Shortcuts automation.",
      },
      { property: "og:title", content: "iPhone setup — MyBudget" },
      {
        property: "og:description",
        content:
          "Step-by-step guide to auto-fill MyBudget transactions from bank notifications with an iOS Shortcuts automation.",
      },
    ],
  }),
  component: IphoneSetupPage,
});

function IphoneSetupPage() {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SHORTCUT_LINK);
      toast.success("Shortcut link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  return (
    <PageShell title="iPhone setup">
      <Card className="space-y-2" wavy>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-primary">
          <Zap size={20} />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          iOS doesn't let apps read notifications. Instead, you can create a personal
          Shortcuts automation that sends the detected amount straight into MyBudget. Nothing
          leaves your iPhone until you confirm the transaction.
        </p>
      </Card>

      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <Card className="flex gap-3">
              <span className="gold-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold">{step.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <button
          type="button"
          onClick={copyLink}
          className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground"
        >
          <Copy size={16} /> Copy Shortcut link
        </button>
        <a
          href="myapp://quick-add?amount=10&type=expense"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-card py-3.5 text-sm font-semibold"
        >
          <Link2 size={15} /> Test the quick-add link
        </a>
        <p className="text-center text-[11px] text-muted-foreground">
          The Shortcut link is a placeholder until the gallery shortcut is published.
        </p>
      </div>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { z } from "zod";
import {
  isMutedMessage,
  matchAccountByProvider,
  matchCategoryHint,
  parseNotification,
  resolveSourceKey,
} from "@/lib/detection-parse";

const payloadSchema = z.object({
  token: z.string().min(20).max(200),
  text: z.string().min(1).max(2000),
  app: z.string().max(120).optional(),
  title: z.string().max(200).optional(),
  reference: z.string().max(120).optional(),
  received_at: z.string().max(40).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function normalise(value: string) {
  return value.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/api/public/detection-ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const parsedBody = payloadSchema.safeParse(body);
        if (!parsedBody.success) return json({ error: "Invalid payload" }, 400);
        const { token, text, app, title, reference, received_at } = parsedBody.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: settings } = await supabaseAdmin
          .from("detection_settings")
          .select("user_id, enabled, auto_save, default_account_id")
          .eq("ingest_token", token)
          .maybeSingle();

        // Same response shape for unknown and valid tokens beyond this point,
        // so the endpoint can't be used to probe for live tokens.
        if (!settings) return json({ error: "Unauthorized" }, 401);
        if (!settings.enabled) return json({ status: "detection_disabled" }, 202);

        const userId = settings.user_id;
        // The operator is often only in the message body (SMS from "NITA", "AMANA"…)
        const sourceKey = resolveSourceKey(`${app ?? ""} ${title ?? ""} ${text}`);

        const { data: source } = await supabaseAdmin
          .from("detection_sources")
          .select("enabled")
          .eq("user_id", userId)
          .eq("key", sourceKey)
          .maybeSingle();
        if (source && !source.enabled) return json({ status: "source_disabled" }, 202);

        const haystack = `${title ?? ""} ${text}`;
        const parsed = parseNotification(haystack);
        if (!parsed) return json({ status: "no_amount_found" }, 202);

        const sourceLabel = app ?? title ?? parsed.provider ?? "Bank app";

        const { data: muted = [] } = await supabaseAdmin
          .from("detection_muted_patterns")
          .select("pattern")
          .eq("user_id", userId);
        if (isMutedMessage(haystack, (muted ?? []).map((m) => m.pattern ?? ""))) {
          return json({ status: "muted" }, 202);
        }
        const shape = normalise(haystack);

        const externalRef =
          reference ??
          parsed.reference ??
          createHash("sha256")
            .update(`${userId}|${sourceKey}|${parsed.amount}|${shape}|${(received_at ?? new Date().toISOString()).slice(0, 16)}`)
            .digest("hex")
            .slice(0, 40);

        const { data: existing } = await supabaseAdmin
          .from("detected_transactions")
          .select("id, status")
          .eq("user_id", userId)
          .eq("external_ref", externalRef)
          .maybeSingle();
        if (existing) return json({ status: "duplicate", detection_id: existing.id }, 200);

        // Keyword rules pick the category and can skip the review step.
        const { data: rules = [] } = await supabaseAdmin
          .from("detection_rules")
          .select("keyword, category_id, auto_confirm")
          .eq("user_id", userId);
        const lower = haystack.toLowerCase();
        const rule = (rules ?? []).find(
          (r) => r.keyword && lower.includes(r.keyword.toLowerCase()),
        );

        const detectedAt = (() => {
          if (!received_at) return new Date().toISOString();
          const d = new Date(received_at);
          return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        })();
        // Prefer the date written in the SMS (messages forwarded late keep their real date)
        const txDate = parsed.date ?? detectedAt.slice(0, 10);

        // Account: one named after the operator ("Nita" account for a Nita SMS), else the default one
        const [{ data: accounts = [] }, { data: categories = [] }] = await Promise.all([
          supabaseAdmin.from("accounts").select("id, name").eq("user_id", userId),
          supabaseAdmin.from("categories").select("id, name, type").eq("user_id", userId),
        ]);
        const accountId =
          matchAccountByProvider(parsed.provider, accounts ?? [])?.id ?? settings.default_account_id;
        const categoryId =
          rule?.category_id ?? matchCategoryHint(parsed.categoryHint, parsed.type, categories ?? [])?.id ?? null;

        const autoSave = Boolean(settings.auto_save || rule?.auto_confirm);
        const paymentMethod = sourceKey === "bank" ? "card" : "mobile_money";
        const label = parsed.label || parsed.merchant || sourceLabel;

        // One entry for the transaction, plus one for the fee when the SMS mentions one,
        // so that the account balance stays exact.
        const entries = [
          { amount: parsed.amount, type: parsed.type, note: label, category: categoryId, ref: externalRef, merchant: parsed.merchant },
          ...(parsed.fee > 0
            ? [{ amount: parsed.fee, type: "expense" as const, note: `Frais · ${label}`, category: null, ref: `${externalRef}_fee`, merchant: parsed.merchant }]
            : []),
        ];

        let transactionId: string | null = null;
        let detectionId: string | null = null;
        for (const [i, e] of entries.entries()) {
          let txId: string | null = null;
          if (autoSave) {
            const { data: tx, error: txError } = await supabaseAdmin
              .from("transactions")
              .insert({
                user_id: userId,
                account_id: accountId,
                category_id: e.category,
                amount: e.amount,
                type: e.type,
                date: txDate,
                note: e.note,
                payment_method: paymentMethod,
              })
              .select("id")
              .single();
            if (txError) return json({ error: "Could not save transaction" }, 500);
            txId = tx?.id ?? null;
          }

          const { data: detection, error } = await supabaseAdmin
            .from("detected_transactions")
            .insert({
              user_id: userId,
              source_key: sourceKey,
              app_name: sourceLabel,
              amount: e.amount,
              type: e.type,
              category_id: e.category,
              merchant: i === 0 ? e.merchant : `Frais · ${e.merchant ?? sourceLabel}`,
              account_id: accountId,
              raw_text: text.slice(0, 500),
              external_ref: e.ref,
              detected_at: detectedAt,
              transaction_id: txId,
              status: autoSave ? "confirmed" : "pending",
            })
            .select("id")
            .single();
          if (error) return json({ error: "Could not save detection" }, 500);
          if (i === 0) {
            transactionId = txId;
            detectionId = detection?.id ?? null;
          }
        }

        await supabaseAdmin
          .from("detection_settings")
          .update({ last_ingest_at: new Date().toISOString() })
          .eq("user_id", userId);

        return json({
          status: autoSave ? "saved" : "pending_review",
          detection_id: detectionId,
          transaction_id: transactionId,
          amount: parsed.amount,
          fee: parsed.fee,
          type: parsed.type,
          merchant: parsed.merchant,
          provider: parsed.provider,
          date: txDate,
        });
      },
    },
  },
});

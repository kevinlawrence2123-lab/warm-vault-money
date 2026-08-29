import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, Chip, IconBubble } from "./primitives";
import { PAYMENT_METHODS } from "@/lib/icons";
import {
  useAccounts,
  useCategories,
  useInvalidateAll,
  useProfile,
  type Transaction,
} from "@/lib/data";

export interface TransactionPrefill {
  amount?: string | undefined;
  type?: "expense" | "income" | undefined;
  accountName?: string | undefined;
  note?: string | undefined;
  detectionId?: string | undefined;
}

export function TransactionForm({
  existing,
  prefill,
}: {
  existing?: Transaction | undefined;
  prefill?: TransactionPrefill | undefined;
}) {
  const navigate = useNavigate();
  const invalidate = useInvalidateAll();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const [type, setType] = useState<"expense" | "income">(
    existing?.type ?? prefill?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    existing ? String(existing.amount) : (prefill?.amount ?? ""),
  );
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [accountId, setAccountId] = useState<string | null>(existing?.account_id ?? null);
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState(existing?.payment_method ?? "card");
  const [note, setNote] = useState(existing?.note ?? prefill?.note ?? "");
  const [receiptUrl, setReceiptUrl] = useState(existing?.receipt_url ?? "");

  const [busy, setBusy] = useState(false);

  const currency = profile?.currency ?? "USD";
  const visibleCategories = categories.filter((c) => c.type === type);

  async function uploadReceipt(file: File) {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const path = `${uid}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReceiptUrl(path);
    toast.success("Receipt attached");
  }

  async function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        user_id: userData.user!.id,
        amount: value,
        type,
        date,
        category_id: categoryId,
        account_id: accountId,
        payment_method: method,
        note: note || null,
        receipt_url: receiptUrl || null,
      };
      const { error } = existing
        ? await supabase.from("transactions").update(payload).eq("id", existing.id)
        : await supabase.from("transactions").insert(payload);
      if (error) throw error;
      invalidate();
      toast.success(existing ? "Transaction updated" : "Transaction saved");
      navigate({ to: "/transactions" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    const { error } = await supabase.from("transactions").delete().eq("id", existing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
    navigate({ to: "/transactions" });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-card p-1.5">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategoryId(null);
            }}
            className={`rounded-full py-2.5 text-sm font-bold capitalize transition-colors ${
              type === t ? "gold-gradient text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="py-4 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {currency}
        </p>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className="amount-xl w-full bg-transparent text-center text-5xl outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      <section>
        <p className="mb-2 text-sm font-bold">Category</p>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {visibleCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <IconBubble icon={c.icon} color={c.color} active={categoryId === c.id} />
              <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <Card className="space-y-4">
        <Row label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-semibold outline-none"
          />
        </Row>
        <Row label="Account">
          <select
            value={accountId ?? ""}
            onChange={(e) => setAccountId(e.target.value || null)}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">None</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-card">
                {a.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Payment method">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value} className="bg-card">
                {m.label}
              </option>
            ))}
          </select>
        </Row>
      </Card>

      <Card className="space-y-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note…"
          rows={2}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <Chip className="inline-flex items-center gap-1.5" active={!!receiptUrl}>
              <Camera size={14} />
              {receiptUrl ? "Receipt attached" : "Receipt"}
            </Chip>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadReceipt(f);
              }}
            />
          </label>
        </div>
      </Card>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
        {existing ? "Update transaction" : "Save transaction"}
      </button>

      {existing && (
        <button
          type="button"
          onClick={remove}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-destructive"
        >
          <Trash2 size={15} /> Delete transaction
        </button>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/app/AppShell";
import { Card, Chip, IconBubble } from "@/components/app/primitives";
import { formatMoney } from "@/lib/format";
import { ACCOUNT_TYPES } from "@/lib/icons";
import { useT, type TKey } from "@/lib/i18n";
import {
  accountBalance,
  useAccounts,
  useCurrency,
  useInvalidateAll,
  useTransactions,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — MyBudget" },
      { name: "description", content: "Manage your bank, cash, mobile money and savings accounts in one place." },
      { property: "og:title", content: "Accounts — MyBudget" },
      { property: "og:description", content: "Manage your bank, cash, mobile money and savings accounts in one place." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const t = useT();
  const currency = useCurrency();
  const invalidate = useInvalidateAll();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [balance, setBalance] = useState("");

  async function create() {
    if (!name) {
      toast.error(t("accounts.needName"));
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("accounts").insert({
      user_id: userData.user!.id,
      name,
      type,
      balance: Number(balance) || 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setBalance("");
    setOpen(false);
    invalidate();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  return (
    <PageShell title={t("accounts.title")}>
      <div className="space-y-3">
        {accounts.map((a) => (
          <Card key={a.id} className="flex items-center gap-3">
            <IconBubble icon={a.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{a.name}</p>
              <p className="text-xs text-muted-foreground">
                {t(`accounts.type.${a.type}` as TKey)}
              </p>
            </div>
            <p className="amount-xl text-lg">
              {formatMoney(accountBalance(a, transactions), currency)}
            </p>
            <button type="button" aria-label={`Delete ${a.name}`} onClick={() => remove(a.id)}>
              <Trash2 size={16} className="text-muted-foreground" />
            </button>
          </Card>
        ))}
      </div>

      {open ? (
        <Card className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("accounts.namePlaceholder")}
            className="w-full bg-transparent font-semibold outline-none placeholder:text-muted-foreground"
          />
          <input
            value={balance}
            inputMode="decimal"
            onChange={(e) => setBalance(e.target.value.replace(/[^0-9.-]/g, ""))}
            placeholder={t("accounts.startingBalance")}
            className="w-full bg-transparent font-semibold outline-none placeholder:text-muted-foreground"
          />
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {ACCOUNT_TYPES.map((a) => (
              <Chip key={a.value} active={type === a.value} onClick={() => setType(a.value)}>
                {t(`accounts.type.${a.value}` as TKey)}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={create}
              className="gold-gradient flex-1 rounded-full py-3 font-bold text-primary-foreground"
            >
              {t("accounts.add")}
            </button>
            <Chip onClick={() => setOpen(false)}>{t("common.cancel")}</Chip>
          </div>
        </Card>
      ) : (
        <Chip className="inline-flex items-center gap-2" active onClick={() => setOpen(true)}>
          <Plus size={15} /> {t("accounts.add")}
        </Chip>
      )}

      <Card className="space-y-2 opacity-70">
        <div className="flex items-center gap-2">
          <Landmark size={16} className="text-muted-foreground" />
          <p className="font-bold">{t("accounts.autoSync")}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("accounts.autoSyncText")}
        </p>
      </Card>
    </PageShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/data";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  // Rendered in the browser only: server rendering of this page produced a hydration
  // mismatch that rebuilt the form (wiping what was typed) and, on some phones,
  // ended on the "This page didn't load — try refreshing" error screen.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — MyBudget" },
      {
        name: "description",
        content: "Sign in or create your MyBudget account to track expenses, budgets and savings goals.",
      },
      { property: "og:title", content: "Sign in — MyBudget" },
      {
        property: "og:description",
        content: "Access your MyBudget dashboard: expenses, income, budgets and savings goals.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot" | "reset";

/** Turns Supabase auth errors into clear, translated messages. */
function authErrorKey(err: unknown): TKey | null {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) return "auth.err.invalid";
  if (msg.includes("email not confirmed")) return "auth.err.unconfirmed";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "auth.err.exists";
  if (msg.includes("password") && (msg.includes("at least") || msg.includes("weak") || msg.includes("short")))
    return "auth.err.weak";
  if (msg.includes("not allowed") || msg.includes("invalid email")) return "auth.err.email";
  if (msg.includes("rate limit") || msg.includes("too many")) return "auth.err.rate";
  if (msg.includes("failed to fetch") || msg.includes("network")) return "auth.err.network";
  return null;
}

function AuthPage() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<TKey | null>(null);
  const { session, loading } = useSession();
  const navigate = useNavigate();

  // Coming back from the "reset password" email: Supabase signs the user in with a
  // recovery session; show the "choose a new password" form instead of leaving.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setMode("reset");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && session && mode !== "reset") navigate({ to: "/home", replace: true });
  }, [loading, session, navigate, mode]);

  function fail(err: unknown) {
    const key = authErrorKey(err);
    setLastError(key);
    toast.error(key ? t(key) : err instanceof Error ? err.message : t("common.somethingWrong"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLastError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success(t("auth.checkEmail"));
          return;
        }
        navigate({ to: "/onboarding" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success(t("auth.resetSent"));
        setMode("login");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success(t("auth.passwordUpdated"));
        if (typeof window !== "undefined") history.replaceState(null, "", "/auth");
        navigate({ to: "/home", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!email.trim()) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) fail(error);
    else toast.success(t("auth.checkEmail"));
  }

  const title =
    mode === "login"
      ? t("auth.welcomeBack")
      : mode === "signup"
        ? t("auth.createAccount")
        : mode === "forgot"
          ? t("auth.forgotTitle")
          : t("auth.resetTitle");
  const subtitle =
    mode === "login"
      ? t("auth.subtitleLogin")
      : mode === "signup"
        ? t("auth.subtitleSignup")
        : mode === "forgot"
          ? t("auth.forgotSubtitle")
          : t("auth.resetSubtitle");
  const submitLabel =
    mode === "login"
      ? t("auth.signIn")
      : mode === "signup"
        ? t("auth.createAccount")
        : mode === "forgot"
          ? t("auth.sendResetLink")
          : t("auth.savePassword");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="text-sm font-bold tracking-[0.2em] uppercase">MyBudget</span>
        </div>
        <h1 className="amount-xl text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <Field
            label={t("auth.fullName")}
            value={name}
            onChange={setName}
            type="text"
            placeholder="Alex Carter"
            autoComplete="name"
          />
        )}
        {mode !== "reset" && (
          <Field
            label={t("auth.email")}
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        )}
        {mode !== "forgot" && (
          <Field
            label={mode === "reset" ? t("auth.newPassword") : t("auth.password")}
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "login" ? undefined : 6}
          />
        )}

        <button
          type="submit"
          disabled={busy}
          className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </form>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => setMode("forgot")}
          className="mt-4 text-center text-sm font-semibold text-muted-foreground"
        >
          {t("auth.forgot")}
        </button>
      )}

      {lastError === "auth.err.unconfirmed" && mode === "login" && (
        <button
          type="button"
          onClick={() => void resendConfirmation()}
          className="mt-3 text-center text-sm font-semibold text-primary"
        >
          {t("auth.resendConfirm")}
        </button>
      )}

      {mode !== "reset" && (
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setLastError(null);
          }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          {mode === "login" ? (
            <>
              {t("auth.newHere")} <span className="font-semibold text-primary">{t("auth.createOne")}</span>
            </>
          ) : (
            <>
              {t("auth.haveAccount")} <span className="font-semibold text-primary">{t("auth.signIn")}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number | undefined;
}) {
  return (
    <label className="surface-card block px-5 py-3">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <input
        className="w-full bg-transparent pt-1 text-base font-medium outline-none placeholder:text-muted-foreground/60"
        value={value}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

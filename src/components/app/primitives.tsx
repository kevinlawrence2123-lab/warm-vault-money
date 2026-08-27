import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { iconFor } from "@/lib/icons";
import { splitMoney } from "@/lib/format";

export function Card({
  children,
  className,
  wavy = false,
}: {
  children: ReactNode;
  className?: string | undefined;
  wavy?: boolean | undefined;
}) {
  return (
    <div
      className={cn(
        "surface-card p-5",
        wavy && "wavy-bottom pb-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function IconBubble({
  icon,
  color,
  size = "md",
  active = false,
}: {
  icon?: string | null | undefined;
  color?: string | null | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  active?: boolean | undefined;
}) {
  const Icon = iconFor(icon);
  const dims = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const isz = size === "sm" ? 16 : size === "lg" ? 24 : 19;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        dims,
        active ? "gold-gradient text-primary-foreground" : "bg-surface",
      )}
      style={!active && color ? { color } : undefined}
    >
      <Icon size={isz} strokeWidth={2.2} />
    </span>
  );
}

export function Amount({
  value,
  currency,
  className,
  centsClassName,
}: {
  value: number;
  currency: string;
  className?: string | undefined;
  centsClassName?: string | undefined;
}) {
  const { main, cents } = splitMoney(value, currency);
  return (
    <span className={cn("amount-xl", className)}>
      {main}
      {cents && (
        <span className={cn("text-[0.58em] font-bold", centsClassName)}>{cents}</span>
      )}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "gold",
  className,
}: {
  value: number;
  tone?: "gold" | "danger" | "warning" | "muted" | undefined;
  className?: string | undefined;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "gold" && "gold-gradient",
          tone === "danger" && "bg-destructive",
          tone === "warning" && "bg-warning",
          tone === "muted" && "bg-muted-foreground",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean | undefined;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "gold-gradient text-primary-foreground"
          : "bg-surface text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GlassIconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: (() => void) | undefined;
  label: string;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "glass-button grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground transition-transform active:scale-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

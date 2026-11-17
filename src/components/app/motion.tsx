/**
 * Small animation kit, inspired by React Bits (reactbits.dev) and Skiper UI.
 * No extra dependency: CSS animations + requestAnimationFrame.
 * Every effect respects "reduce motion" on the phone.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Animated number (React Bits "CountUp"). Re-animates from the previous value. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0);
  const from = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = origin + (target - origin) * eased;
      setValue(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Soft moving light blobs behind a hero (React Bits "Aurora", CSS only). */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <span className="aurora-blob aurora-a" />
      <span className="aurora-blob aurora-b" />
      <span className="aurora-blob aurora-c" />
    </div>
  );
}

/** Light that follows the finger / cursor on a card (React Bits "SpotlightCard"). */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      el.style.setProperty("--spot-o", "1");
    };
    const leave = () => el.style.setProperty("--spot-o", "0");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerup", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerup", leave);
    };
  }, []);
  return ref;
}

/** Children fade and rise one after the other (React Bits "AnimatedList"). */
export function Reveal({
  children,
  index = 0,
  step = 60,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  index?: number;
  step?: number;
  className?: string | undefined;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag className={cn("reveal", className)} style={{ "--reveal-delay": `${index * step}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Gold text with a light sweeping across (React Bits "ShinyText"). */
export function Shiny({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("shiny-text", className)}>{children}</span>;
}

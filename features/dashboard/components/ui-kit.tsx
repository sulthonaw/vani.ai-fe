"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/libs/utils";
import type { CaseStatus, ConversationStatus, Priority } from "../types";
import { CONVERSATION_META, PRIORITY_META, STATUS_LABEL } from "../logic/constants";

export function Panel({
  icon,
  title,
  subtitle,
  actions,
  footer,
  className,
  bodyClassName,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: { label: string; href?: string; onClick?: () => void };
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-2xl border border-steel-100 bg-white", className)}>
      <header className="flex items-start gap-3 border-b border-steel-100 px-5 py-4">
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-steel-100 text-steel-500 [&_svg]:size-[18px]">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-navy-900">{title}</h2>
          {subtitle && <p className="truncate text-xs text-steel-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
      {footer &&
        (footer.href ? (
          <Link
            href={footer.href}
            className="flex items-center justify-between border-t border-steel-100 bg-surface/70 px-5 py-3 text-xs font-medium text-steel-500 transition hover:text-brand-700"
          >
            {footer.label}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <button
            onClick={footer.onClick}
            className="flex items-center justify-between border-t border-steel-100 bg-surface/70 px-5 py-3 text-left text-xs font-medium text-steel-500 transition hover:text-brand-700"
          >
            {footer.label}
            <ArrowRight className="size-4" />
          </button>
        ))}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-steel-100 bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium text-steel-500 transition",
            value === o.value && "bg-white text-navy-900 shadow-[0_1px_2px_rgba(8,24,50,0.12)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-steel-100 bg-white px-3 py-1 text-xs font-medium text-navy-800", className)}>
      {children}
    </span>
  );
}

export function ConversationBadge({ status }: { status: ConversationStatus }) {
  const m = CONVERSATION_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: m.soft, color: m.color }}>
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "normal") return <span className="text-xs text-steel-300">—</span>;
  const m = PRIORITY_META[priority];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: m.color }}>
      <span className="size-2 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const tone =
    status === "closed" || status === "controlled"
      ? "bg-[#E3F5EC] text-[#1B7F55]"
      : status === "no_show"
        ? "bg-[#FDEBDD] text-[#C25E1C]"
        : status === "new"
          ? "bg-surface text-steel-500"
          : "bg-tint text-brand-700";
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold", tone)}>{STATUS_LABEL[status]}</span>;
}

export function Initials({ name, className, tone = "brand" }: { name: string; className?: string; tone?: "brand" | "soft" }) {
  const initials = name
    .replace(/^(Dr\.|Nurse)\s+/i, "")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
        tone === "brand" ? "bg-brand-700 text-white" : "bg-tint text-brand-700",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function SyntheticTag() {
  return <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-steel-300">Synthetic demo data</span>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-steel-200 p-6 text-center text-sm text-steel-500">{children}</div>;
}

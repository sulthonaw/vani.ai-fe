"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/libs/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CaseStatus, ConversationStatus, Priority } from "../types";
import { CONVERSATION_META, PRIORITY_META, STATUS_LABEL } from "../logic/constants";

/* Design language: neutral surfaces, one brand colour (navy) for primary actions,
   colour only as small status dots. Fewer borders, no decorative icon boxes. */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-950">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-steel-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  footer,
  className,
  bodyClassName,
  children,
}: {
  /** Kept for API compatibility; icons are no longer shown in card headers. */
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: { label: string; href?: string; onClick?: () => void };
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const link =
    footer &&
    (footer.href ? (
      <Link href={footer.href} className="inline-flex items-center gap-1 text-xs font-medium text-steel-500 transition hover:text-navy-900">
        {footer.label}
        <ArrowRight className="size-3.5" />
      </Link>
    ) : (
      <button onClick={footer.onClick} className="inline-flex items-center gap-1 text-xs font-medium text-steel-500 transition hover:text-navy-900">
        {footer.label}
        <ArrowRight className="size-3.5" />
      </button>
    ));
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-xl border border-[#E8EBF1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)}>
      <header className="flex items-start gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-navy-950">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-steel-500">{subtitle}</p>}
        </div>
        {(actions || link) && (
          <div className="flex shrink-0 items-center gap-3">
            {actions}
            {link}
          </div>
        )}
      </header>
      <div className={cn("flex-1 px-5 pb-5", bodyClassName)}>{children}</div>
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
    <div className="inline-flex rounded-lg bg-[#F1F3F7] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 rounded-md px-2.5 text-xs font-medium text-steel-500 transition hover:text-navy-900",
            value === o.value && "bg-white text-navy-950 shadow-[0_1px_2px_rgba(16,24,40,0.08)]",
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
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-[#F1F3F7] px-2 py-1 text-xs font-medium text-navy-800", className)}>
      {children}
    </span>
  );
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block size-1.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

export function ConversationBadge({ status }: { status: ConversationStatus }) {
  const m = CONVERSATION_META[status];
  return (
    <Badge variant="outline" className="h-6 gap-1.5 rounded-md border-[#E8EBF1] bg-white px-2 text-xs font-medium text-navy-800">
      <Dot color={m.color} />
      {m.label}
    </Badge>
  );
}

/** shadcn Select wrapper for compact filters; `items` lets the trigger show the label, not the raw value. */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  /** Short name shown inside the trigger so it is clear what the select controls. */
  label?: string;
  className?: string;
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v !== null && onChange(v as T)}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn("h-8 gap-2 rounded-lg border-[#E8EBF1] bg-white pr-2.5 pl-3 text-xs font-medium text-navy-800 hover:bg-[#F7F8FA]", className)}
      >
        {label && <span className="font-normal text-steel-300">{label}</span>}
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" sideOffset={6} className="min-w-44 p-1">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="rounded-md py-1.5 pr-8 pl-2.5 text-[13px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "normal") return <span className="text-xs text-steel-300">—</span>;
  const m = PRIORITY_META[priority];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-800">
      <Dot color={m.color} className="size-2" />
      {m.label}
    </span>
  );
}

const STATUS_DOT: Record<CaseStatus, string> = {
  new: "#97A0B7",
  contacted: "#3D6FD9",
  scheduled: "#3D6FD9",
  no_show: "#F07B2B",
  visited: "#294167",
  in_treatment: "#294167",
  controlled: "#22A06B",
  closed: "#22A06B",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Badge variant="secondary" className="h-6 gap-1.5 rounded-md bg-[#F1F3F7] px-2 text-xs font-medium text-navy-800">
      <Dot color={STATUS_DOT[status]} />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function Initials({
  name,
  className,
  tone = "brand",
  avatarUrl,
}: {
  name: string;
  className?: string;
  tone?: "brand" | "soft";
  avatarUrl?: string;
}) {
  if (avatarUrl) {
    return (
      <span
        className={cn(
          "relative inline-block size-8 shrink-0 overflow-hidden rounded-full border border-black/5 bg-slate-100",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} className="size-full object-cover" />
      </span>
    );
  }

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
        "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
        tone === "brand" ? "bg-navy-900 text-white" : "bg-[#EEF1F6] text-navy-800",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function SyntheticTag() {
  return <span className="text-[11px] text-steel-300">Demo data</span>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-[#E1E5EC] p-6 text-center text-sm text-steel-500">{children}</div>;
}

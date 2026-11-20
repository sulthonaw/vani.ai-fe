"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/libs/utils";
import { PRIORITY_META, REASON_META, STATUS_LABEL, formatDay, weekdayOf } from "../logic/constants";
import { dayCount } from "../logic/engine";
import { funnel, needsToday, performance, returnsPerDay, statusCounts, vaniActivity } from "../logic/metrics";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { Dot, Initials, PageHeader, Panel, Segmented, SyntheticTag } from "./ui-kit";

/* ---------------------------------------------------------------- */
/* KPI strip                                                          */
/* ---------------------------------------------------------------- */

function KpiStrip({ items }: { items: { label: string; value: number; hint: string; dot?: string; href: string }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#E8EBF1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:grid-cols-4">
      {items.map((k, i) => (
        <Link
          key={k.label}
          href={k.href}
          className={cn(
            "group flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-[#FAFBFC]",
            i > 0 && "border-[#EEF0F4] lg:border-l",
            i % 2 === 1 && "border-l border-[#EEF0F4]",
            i >= 2 && "border-t border-[#EEF0F4] lg:border-t-0",
          )}
        >
          <span className="flex items-center gap-1.5 text-xs text-steel-500">
            {k.dot && <Dot color={k.dot} />}
            {k.label}
          </span>
          <span className="text-[26px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-navy-950">{k.value}</span>
          <span className="flex items-center gap-1 text-xs text-steel-300 group-hover:text-steel-500">
            {k.hint}
            <ChevronRight className="size-3 opacity-0 transition group-hover:opacity-100" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Needs you today                                                    */
/* ---------------------------------------------------------------- */

function NeedsYou() {
  const { state } = useDemoStore();
  const router = useRouter();
  const account = useActiveAccount();
  const list = needsToday(state, account.id).slice(0, 7);
  return (
    <Panel title="Needs you today" subtitle="Sorted by urgency. Vani handles everything else." footer={{ label: "All cases", href: "/dashboard/cases" }} bodyClassName="px-0 pb-1">
      {list.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-steel-500">Nothing needs you right now.</p>
      ) : (
        <ul>
          {list.map(({ c, p }) => {
            const patient = state.patients.find((x) => x.id === c.patientId)!;
            const meta = PRIORITY_META[p];
            return (
              <li key={c.id}>
                <button
                  onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                  className="group flex w-full items-center gap-3 border-t border-[#F1F3F6] px-5 py-3 text-left transition-colors hover:bg-[#FAFBFC]"
                >
                  <Initials name={patient.name} tone="soft" className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[13px] font-medium text-navy-950">
                      {patient.name}
                      {c.unread && <span className="size-1.5 rounded-full bg-brand-500" />}
                    </p>
                    <p className="truncate text-xs text-steel-500">
                      BP {c.systolic}/{c.diastolic} · day {dayCount(c, state.day)}
                      {c.handoverNote ? ` · ${c.handoverNote}` : ""}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-navy-800">
                    <Dot color={meta.color} className="size-2" />
                    {meta.label}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-steel-300 transition group-hover:translate-x-0.5 group-hover:text-navy-900" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------------------- */
/* Returns per day                                                    */
/* ---------------------------------------------------------------- */

function ReturnsChart() {
  const { state } = useDemoStore();
  const [range, setRange] = React.useState<"7" | "14">("14");
  const data = returnsPerDay(state, Number(range)).map((d) => ({ ...d, label: `${weekdayOf(d.day).slice(0, 2)} ${d.day}` }));
  const perf = performance(state);
  const rate = perf.total ? Math.round((perf.returned / perf.total) * 100) : 0;

  return (
    <Panel
      title="Follow-up visits"
      subtitle="Visits recorded after an abnormal screening result"
      actions={
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "7d" },
            { value: "14", label: "14d" },
          ]}
        />
      }
    >
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold tracking-[-0.02em] text-navy-950">{rate}%</span>
        <span className="text-xs text-steel-500">
          of cases returned · {perf.returned} of {perf.total}
        </span>
        <span className="ml-auto">
          <SyntheticTag />
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 192 }}>
          <BarChart data={data} margin={{ left: -28, right: 0, top: 4 }}>
            <CartesianGrid vertical={false} stroke="#F1F3F6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#97A0B7", fontSize: 11 }} interval={range === "14" ? 1 : 0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#97A0B7", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "#F4F5F8" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border border-[#E8EBF1] bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium text-navy-950">
                      {formatDay(d.day)} · {d.visits} visit{d.visits === 1 ? "" : "s"}
                    </p>
                    {Object.entries(d.byReason).map(([r, n]) => (
                      <p key={r} className="text-steel-500">
                        {n} · {r === "NONE" ? "No barrier reported" : REASON_META[r as keyof typeof REASON_META].label}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="visits" radius={[4, 4, 0, 0]} maxBarSize={22}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.day === state.day ? "#294167" : "#C8D3E6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- */
/* Right column                                                       */
/* ---------------------------------------------------------------- */

function ClosureProgress() {
  const { state } = useDemoStore();
  const f = funnel(state);
  const total = state.cases.length || 1;
  const closed = f[f.length - 1].count;
  const pct = Math.round((closed / total) * 100);
  return (
    <Panel title="Closing the loop" subtitle="Share of cases at each step" footer={{ label: "Insights", href: "/dashboard/insights" }}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[26px] font-semibold tracking-[-0.02em] text-navy-950">{pct}%</span>
        <span className="text-xs text-steel-500">closed with evidence</span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#EEF1F6]">
        <div className="h-full rounded-full bg-navy-900" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2.5">
        {f.slice(1).map((s) => (
          <li key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-3 text-[13px]">
            <div>
              <div className="mb-1 flex justify-between">
                <span className="text-navy-800">{s.label}</span>
                <span className="tabular-nums text-steel-500">{s.count}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[#F1F3F6]">
                <div className="h-full rounded-full bg-[#7F93B5]" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "#C8CFE0",
  contacted: "#9DB2D8",
  scheduled: "#6F8FC7",
  no_show: "#F07B2B",
  visited: "#4A6491",
  in_treatment: "#294167",
  controlled: "#22A06B",
  closed: "#1B7F55",
};

function StatusOverview() {
  const { state } = useDemoStore();
  const counts = statusCounts(state).filter((s) => s.count > 0);
  const total = counts.reduce((a, b) => a + b.count, 0);
  return (
    <Panel title="Case status" subtitle={`${total} cases at this facility`}>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {counts.map((s) => (
          <span key={s.status} style={{ flex: s.count, background: STATUS_COLORS[s.status] }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        {counts.map((s) => (
          <li key={s.status} className="flex items-center gap-2 text-[13px]">
            <Dot color={STATUS_COLORS[s.status]} className="size-2" />
            <span className="flex-1 text-steel-500">{STATUS_LABEL[s.status]}</span>
            <span className="font-medium tabular-nums text-navy-950">{s.count}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function VaniActivity() {
  const { state } = useDemoStore();
  const [range, setRange] = React.useState<"1" | "7" | "30">("7");
  const a = vaniActivity(state, Number(range));
  const rows = [
    { label: "Messages sent", value: a.sent },
    { label: "Replies received", value: a.replied },
    { label: "Handed to staff", value: a.handedOver },
  ];
  return (
    <Panel
      title="Vani activity"
      actions={
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "1", label: "1d" },
            { value: "7", label: "7d" },
            { value: "30", label: "30d" },
          ]}
        />
      }
      footer={{ label: "Map", href: "/dashboard/map" }}
    >
      <div className="grid grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg bg-[#F7F8FA] px-3 py-2.5">
            <p className="text-[11px] text-steel-500">{r.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-navy-950">{r.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- */
/* Page                                                               */
/* ---------------------------------------------------------------- */

export function TodayView() {
  const { state } = useDemoStore();
  const account = useActiveAccount();
  const perf = performance(state);
  const mine = needsToday(state, account.id);
  const handedToMe = state.cases.filter((c) => c.status !== "closed" && c.conversation === "handed_over" && (c.coordinatorId === account.id || c.takeoverBy === account.id)).length;
  const isManager = account.role === "manager";
  const vaniActive = state.cases.filter((c) => c.ownerType === "vani" && c.conversation !== "idle" && c.status !== "closed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "Overview" : "Today"}
        description={
          isManager
            ? "Aggregated view. Patient names and messages are hidden for this role."
            : `${formatDay(state.day)} · Vani is handling ${vaniActive} conversation${vaniActive === 1 ? "" : "s"}`
        }
        actions={
          !isManager && (
            <Link
              href="/dashboard/cases"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-navy-900 px-3 text-xs font-medium text-white transition hover:bg-navy-800"
            >
              Open cases <ArrowRight className="size-3.5" />
            </Link>
          )
        }
      />

      <KpiStrip
        items={[
          { label: isManager ? "Open cases" : "Needs you", value: isManager ? perf.open : mine.length, hint: isManager ? "Not yet closed" : "Urgent, handed over, overdue", href: "/dashboard/cases" },
          { label: isManager ? "With staff" : "Handed to you", value: isManager ? perf.handedOver : handedToMe, hint: "Vani paused", dot: "#F07B2B", href: "/dashboard/cases" },
          { label: "Urgent", value: perf.urgent, hint: "Doctor review", dot: "#E5484D", href: "/dashboard/cases" },
          { label: "Overdue", value: perf.overdue, hint: "Day 15+, no visit", dot: "#E5A50A", href: "/dashboard/cases" },
        ]}
      />

      {isManager ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ClosureProgress />
          <StatusOverview />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <NeedsYou />
            <ReturnsChart />
          </div>
          <div className="space-y-6">
            <ClosureProgress />
            <StatusOverview />
            <VaniActivity />
          </div>
        </div>
      )}
    </div>
  );
}

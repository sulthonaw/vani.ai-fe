"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowDownRight, ArrowUpRight, BellRing, ChartNoAxesColumn, ListChecks, Target, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/libs/utils";
import { CONVERSATION_META, PRIORITY_META, REASON_META, STATUS_LABEL, weekdayOf } from "../logic/constants";
import { dayCount } from "../logic/engine";
import { funnel, needsToday, performance, returnsPerDay, statusCounts, vaniActivity } from "../logic/metrics";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { Initials, Panel, Pill, Segmented, SyntheticTag } from "./ui-kit";

function StatCard({ label, value, href, tone }: { label: string; value: number; href: string; tone: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-steel-100 bg-white p-4 transition hover:border-steel-200">
      <p className="flex items-center gap-1.5 text-xs font-medium text-steel-500">
        <span className="size-2 rounded-full" style={{ background: tone }} />
        {label}
      </p>
      <p className="mt-2 text-[28px] font-semibold leading-none tabular-nums text-navy-950">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-steel-300 group-hover:text-brand-500">View cases →</p>
    </Link>
  );
}

function ReturnsChart() {
  const { state } = useDemoStore();
  const [range, setRange] = React.useState<"7" | "14">("7");
  const data = returnsPerDay(state, Number(range)).map((d) => ({ ...d, label: `${weekdayOf(d.day)} ${d.day}` }));
  const perf = performance(state);
  const rate = perf.total ? Math.round((perf.returned / perf.total) * 100) : 0;
  const maxIdx = data.reduce((best, d, i) => (d.visits > data[best].visits ? i : best), 0);

  return (
    <Panel
      icon={<ChartNoAxesColumn />}
      title="Returns per day"
      subtitle="Follow-up visits recorded after an abnormal result"
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
      footer={{ label: "View insights", href: "/dashboard/insights" }}
    >
      <div className="mb-3 flex items-end gap-3">
        <p className="text-[34px] font-semibold leading-none tracking-tight text-navy-950">
          {rate}
          <span className="text-lg text-steel-500">% returned</span>
        </p>
        <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-status-active">
          <ArrowUpRight className="size-3.5" /> {perf.returned} of {perf.total} cases
        </span>
        <span className="mb-1 ml-auto">
          <SyntheticTag />
        </span>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -24, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} stroke="#E1E6F1" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#97A0B7", fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#97A0B7", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "#EAF0FB" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-xl bg-navy-950 px-3 py-2 text-xs text-white shadow-lg">
                    <p className="font-semibold">
                      Day {d.day}: {d.visits} visit(s)
                    </p>
                    {Object.entries(d.byReason).map(([r, n]) => (
                      <p key={r} className="text-white/70">
                        {n} · {r === "NONE" ? "No barrier reported" : REASON_META[r as keyof typeof REASON_META].label}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="visits" radius={[8, 8, 8, 8]} maxBarSize={36}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === maxIdx ? "#294167" : "#C8CFE0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function ClosureProgress() {
  const { state } = useDemoStore();
  const f = funnel(state);
  const total = state.cases.length;
  const closed = f[f.length - 1].count;
  const pct = total ? Math.round((closed / total) * 100) : 0;
  const stripes = 48;
  return (
    <Panel icon={<Target />} title="Closure progress" subtitle="Cases closed or controlled with evidence" actions={<Pill>All conditions</Pill>} footer={{ label: "View cases", href: "/dashboard/cases" }}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 flex-1 gap-[3px]">
          {Array.from({ length: stripes }).map((_, i) => (
            <span key={i} className={cn("flex-1 rounded-full", i / stripes < pct / 100 ? "bg-brand-700" : "bg-steel-100")} />
          ))}
        </div>
        <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-brand-700">{pct}% closed</span>
      </div>
      <ul className="mt-4 space-y-2">
        {f.slice(1).map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[13px]">
            <span className="size-1.5 rounded-full bg-steel-300" />
            <span className="flex-1 text-navy-800">{s.label}</span>
            <span className="tabular-nums text-steel-500">
              {s.count} <span className="text-steel-300">({s.pct}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "#C8CFE0",
  contacted: "#7FA3E8",
  scheduled: "#3D6FD9",
  no_show: "#F07B2B",
  visited: "#354E75",
  in_treatment: "#294167",
  controlled: "#22A06B",
  closed: "#1B7F55",
};

function StatusOverview() {
  const { state } = useDemoStore();
  const counts = statusCounts(state).filter((s) => s.count > 0);
  const total = counts.reduce((a, b) => a + b.count, 0);
  return (
    <Panel icon={<ListChecks />} title="Case status overview" subtitle="Spread of all cases by status" footer={{ label: "View cases", href: "/dashboard/cases" }}>
      <p className="mb-3 text-sm font-semibold text-navy-900">
        Cases <span className="font-normal text-steel-300">({total})</span>
      </p>
      <div className="flex h-3 gap-1">
        {counts.map((s) => (
          <span key={s.status} className="rounded-full" style={{ flex: s.count, background: STATUS_COLORS[s.status] }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {counts.map((s) => (
          <li key={s.status} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-sm" style={{ background: STATUS_COLORS[s.status] }} />
            <span className="flex-1 text-navy-800">{STATUS_LABEL[s.status]}</span>
            <span className="font-semibold tabular-nums text-navy-900">{s.count}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Ring({ r, value, max, color }: { r: number; value: number; max: number; color: string }) {
  const c = 2 * Math.PI * r;
  const frac = max ? Math.min(1, value / max) : 0;
  return (
    <>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EEF1F6" strokeWidth="8" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 60 60)" />
    </>
  );
}

function VaniActivity() {
  const { state } = useDemoStore();
  const [range, setRange] = React.useState<"1" | "7" | "30">("7");
  const a = vaniActivity(state, Number(range));
  const max = Math.max(a.sent, 1);
  const rows = [
    { label: "Messages sent by Vani", value: a.sent, color: "#294167" },
    { label: "Replies from patients & family", value: a.replied, color: "#3D6FD9" },
    { label: "Handed over to staff", value: a.handedOver, color: "#F07B2B" },
  ];
  return (
    <Panel
      icon={<Zap />}
      title="Vani activity"
      subtitle="What the agent did in this period"
      actions={
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "1", label: "1d" },
            { value: "7", label: "7d" },
            { value: "30", label: "1m" },
          ]}
        />
      }
      footer={{ label: "Open Vani Map", href: "/dashboard/map" }}
    >
      <div className="flex items-center gap-4">
        <ul className="flex-1 space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="border-l-2 pl-2.5" style={{ borderColor: r.color }}>
              <p className="text-xs text-steel-500">{r.label}</p>
              <p className="text-xl font-semibold tabular-nums text-navy-950">
                {r.value}
                {r.label.startsWith("Replies") && <span className="text-sm text-steel-300">/{a.sent}</span>}
              </p>
            </li>
          ))}
        </ul>
        <svg viewBox="0 0 120 120" className="size-32 shrink-0">
          <Ring r={52} value={a.sent} max={max} color="#294167" />
          <Ring r={40} value={a.replied} max={max} color="#3D6FD9" />
          <Ring r={28} value={a.handedOver} max={max} color="#F07B2B" />
        </svg>
      </div>
    </Panel>
  );
}

function NeedsYou() {
  const { state } = useDemoStore();
  const router = useRouter();
  const account = useActiveAccount();
  const list = needsToday(state, account.id).slice(0, 8);
  return (
    <Panel icon={<BellRing />} title="Needs you today" subtitle="Urgent → handed over → overdue → unassigned" footer={{ label: "View all cases", href: "/dashboard/cases" }} bodyClassName="p-0">
      <ul className="divide-y divide-steel-100">
        {list.length === 0 && <li className="px-5 py-8 text-center text-sm text-steel-500">Nothing needs you right now. Vani is on it.</li>}
        {list.map(({ c, p }) => {
          const patient = state.patients.find((x) => x.id === c.patientId)!;
          const meta = PRIORITY_META[p];
          return (
            <li key={c.id}>
              <button onClick={() => router.push(`/dashboard/cases/${c.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-tint/50">
                <Initials name={patient.name} tone="soft" className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-navy-900">
                    {patient.name}
                    {c.unread && <span className="size-1.5 rounded-full bg-brand-500" />}
                  </p>
                  <p className="truncate text-xs text-steel-500">
                    BP {c.systolic}/{c.diastolic} · day {dayCount(c, state.day)}
                    {c.handoverNote ? ` · ${c.handoverNote}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: meta.color, background: `${meta.color}1A` }}>
                  {meta.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function TodayView() {
  const { state } = useDemoStore();
  const account = useActiveAccount();
  const perf = performance(state);
  const mine = needsToday(state, account.id);
  const handedToMe = state.cases.filter((c) => c.status !== "closed" && c.conversation === "handed_over" && (c.coordinatorId === account.id || c.takeoverBy === account.id)).length;
  const isManager = account.role === "manager";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
            {isManager ? "Facility overview" : `Good morning, ${account.name.replace(/^(Nurse|Dr\.)\s+/, "")}`}
          </h1>
          <p className="text-sm text-steel-500">
            {isManager ? "Aggregated view — no patient names or messages are shown for this role." : "Here is what needs a person today. Vani handles the rest."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-steel-500">
          <Activity className="size-4 text-status-active" /> Vani is active on {state.cases.filter((c) => c.ownerType === "vani" && c.conversation !== "idle" && c.status !== "closed").length} conversations
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={isManager ? "Open cases" : "Needs action today"} value={isManager ? perf.open : mine.length} href="/dashboard/cases" tone="#294167" />
        <StatCard label={isManager ? "Handed over to staff" : "Handed over to me"} value={isManager ? perf.handedOver : handedToMe} href="/dashboard/cases" tone={CONVERSATION_META.handed_over.color} />
        <StatCard label="Urgent" value={perf.urgent} href="/dashboard/cases" tone={CONVERSATION_META.urgent.color} />
        <StatCard label="Overdue (day 15+)" value={perf.overdue} href="/dashboard/cases" tone={CONVERSATION_META.awaiting.color} />
      </div>

      {isManager ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <ClosureProgress />
          <StatusOverview />
          <div className="lg:col-span-2">
            <Link href="/dashboard/insights" className="flex items-center justify-between rounded-2xl border border-steel-100 bg-white px-5 py-4 text-sm font-semibold text-brand-700 hover:bg-tint">
              Open Insights for funnel, reasons and performance <ArrowDownRight className="size-4 -rotate-90" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <ReturnsChart />
            <NeedsYou />
          </div>
          <div className="space-y-5">
            <ClosureProgress />
            <StatusOverview />
            <VaniActivity />
          </div>
        </div>
      )}
    </div>
  );
}

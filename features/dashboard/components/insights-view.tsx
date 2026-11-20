"use client";

import * as React from "react";
import { ChartColumnBig, Filter, Gauge, MapPinned, MessageCircleQuestion, Users } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { REASON_META } from "../logic/constants";
import { byArea, familyStats, funnel, performance, reasonCounts } from "../logic/metrics";
import { useDemoStore } from "../hooks/use-demo-store";
import { Panel, SyntheticTag } from "./ui-kit";

function Metric({ label, value, hint, good }: { label: string; value: string | number; hint?: string; good?: boolean }) {
  return (
    <div className="rounded-lg bg-[#F7F8FA] p-4">
      <p className="text-xs text-steel-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${good ? "text-status-active" : "text-navy-950"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-steel-300">{hint}</p>}
    </div>
  );
}

export function InsightsView() {
  const { state } = useDemoStore();
  const f = funnel(state);
  const reasons = reasonCounts(state).map((r) => ({ ...r, label: REASON_META[r.code].label, path: REASON_META[r.code].path }));
  const perf = performance(state);
  const fam = familyStats(state);
  const areas = byArea(state);
  const max = f[0].count || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-950">Insights</h1>
          <p className="mt-0.5 text-[13px] text-steel-500">Where patients drop off, why, and how fast the team closes the loop. No patient names or messages.</p>
        </div>
        <SyntheticTag />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel icon={<Filter />} title="Case funnel" subtitle="How far each abnormal result has progressed">
          <ul className="space-y-3">
            {f.map((s, i) => (
              <li key={s.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-navy-800">
                    {i + 1}. {s.label}
                  </span>
                  <span className="tabular-nums text-steel-500">
                    <b className="text-navy-900">{s.count}</b> · {s.pct}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-surface">
                  <div className="h-full rounded-full" style={{ width: `${(s.count / max) * 100}%`, background: i === f.length - 1 ? "#22A06B" : i < 2 ? "#294167" : "#3D6FD9" }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel icon={<MessageCircleQuestion />} title="Reasons for not returning" subtitle="Recorded from patient buttons and Simulated AI">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasons} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="label" width={170} tickLine={false} axisLine={false} tick={{ fill: "#556A8B", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "#EAF0FB" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof reasons)[number];
                    return (
                      <div className="max-w-56 rounded-xl bg-navy-950 px-3 py-2 text-xs text-white">
                        <p className="font-semibold">
                          {d.label}: {d.count}
                        </p>
                        <p className="text-white/70">Vani path: {d.path}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" fill="#294167" radius={[0, 6, 6, 0]} maxBarSize={16} label={{ position: "right", fill: "#081832", fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel icon={<Gauge />} title="Performance" subtitle="Closing the loop, with a clear owner">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Avg. days to first contact" value={perf.avgFirstContact} hint="from result to first message" />
          <Metric label="Avg. days to first visit" value={perf.avgToVisit} hint="from result to recorded visit" />
          <Metric label="Overdue (day 15+, no visit)" value={perf.overdue} />
          <Metric label="Unassigned cases" value={perf.unassigned} hint="target: 0" />
          <Metric label="Handed over to staff" value={perf.handedOver} />
          <Metric label="Urgent (doctor)" value={perf.urgent} />
          <Metric label="Closed or controlled" value={perf.closed} />
          <Metric label="Closed without evidence" value={perf.closedWithoutEvidence} hint="blocked by design" good />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel icon={<Users />} title="Family channel" subtitle="Only with patient consent">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Patients who consented" value={`${fam.consentPct}%`} hint={`${fam.consentCount} patients`} />
            <Metric label="Reached via family" value={fam.reachedViaFamily} hint="after no reply" />
            <Metric label="Family will accompany" value={fam.escorts} />
          </div>
        </Panel>

        <Panel icon={<MapPinned />} title="By area" subtitle="Top reason per district (fictional)">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wide text-steel-300">
              <tr>
                <th className="pb-2 font-semibold">District</th>
                <th className="pb-2 font-semibold">Cases</th>
                <th className="pb-2 font-semibold">Returned</th>
                <th className="pb-2 font-semibold">Top reason</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.area} className="border-t border-steel-100">
                  <td className="py-2 font-medium text-navy-900">{a.area}</td>
                  <td className="py-2 tabular-nums">{a.cases}</td>
                  <td className="py-2 tabular-nums">{a.returnedPct}%</td>
                  <td className="py-2 text-steel-500">{a.top ? `${REASON_META[a.top].label} (${a.topCount})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-steel-300">
        <ChartColumnBig className="size-3.5" /> All figures are computed live from the synthetic demo cases.
      </p>
    </div>
  );
}

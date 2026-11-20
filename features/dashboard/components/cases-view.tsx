"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Search, UserPlus } from "lucide-react";
import { cn } from "@/libs/utils";
import type { CaseStatus, ReasonCode } from "../types";
import { REASON_CODES, REASON_META, STATUS_LABEL, formatDay } from "../logic/constants";
import { accountById, dayCount, isOverdue, priorityOf } from "../logic/engine";
import { PRIORITY_META } from "../logic/constants";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { CaseStatusBadge, ConversationBadge, Initials, Panel, PriorityBadge, Segmented } from "./ui-kit";

type OwnerFilter = "mine" | "vani" | "all";

const selectCls = "h-8 rounded-full border border-steel-100 bg-white px-3 text-xs font-medium text-navy-800 outline-none focus:border-brand-500";

export function CasesView() {
  const { state, dispatch } = useDemoStore();
  const router = useRouter();
  const account = useActiveAccount();
  const [owner, setOwner] = React.useState<OwnerFilter>(account.role === "coordinator" ? "mine" : "all");
  const [status, setStatus] = React.useState<CaseStatus | "open" | "any">("open");
  const [priority, setPriority] = React.useState<string>("any");
  const [reason, setReason] = React.useState<ReasonCode | "any">("any");
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [q, setQ] = React.useState("");

  // Reset the owner filter when the active account changes (derived-state pattern, no effect).
  const [prevAccount, setPrevAccount] = React.useState(account.id);
  if (prevAccount !== account.id) {
    setPrevAccount(account.id);
    setOwner(account.role === "coordinator" ? "mine" : "all");
  }

  const rows = React.useMemo(() => {
    return state.cases
      .map((c) => ({ c, p: state.patients.find((p) => p.id === c.patientId)!, prio: priorityOf(c, state.day) }))
      .filter(({ c, p, prio }) => {
        if (owner === "mine" && !(c.coordinatorId === account.id || c.takeoverBy === account.id || !c.coordinatorId)) return false;
        if (owner === "vani" && (c.ownerType !== "vani" || c.status === "closed")) return false;
        if (status === "open" && c.status === "closed") return false;
        if (status !== "open" && status !== "any" && c.status !== status) return false;
        if (priority !== "any" && prio !== priority) return false;
        if (reason !== "any" && !c.reasons.some((r) => r.code === reason)) return false;
        if (overdueOnly && !isOverdue(c, state.day)) return false;
        if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => PRIORITY_META[a.prio].rank - PRIORITY_META[b.prio].rank || dayCount(b.c, state.day) - dayCount(a.c, state.day));
  }, [state, owner, status, priority, reason, overdueOnly, q, account.id]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Cases</h1>
        <p className="text-sm text-steel-500">Every abnormal screening result is a case with an owner, until it is closed with evidence.</p>
      </div>

      <Panel
        icon={<ClipboardList />}
        title={`${rows.length} cases`}
        subtitle={owner === "mine" ? `Assigned to ${account.name} (plus unassigned)` : owner === "vani" ? "Currently handled by Vani" : "All cases at this facility"}
        actions={
          <Segmented<OwnerFilter>
            value={owner}
            onChange={setOwner}
            options={[
              { value: "mine", label: "My cases" },
              { value: "vani", label: "Vani" },
              { value: "all", label: "All" },
            ]}
          />
        }
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-steel-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-steel-300" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient" className={cn(selectCls, "w-48 pl-8")} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectCls}>
            <option value="open">Status: open</option>
            <option value="any">Status: any</option>
            {(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
            <option value="any">Priority: any</option>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select value={reason} onChange={(e) => setReason(e.target.value as ReasonCode | "any")} className={selectCls}>
            <option value="any">Reason: any</option>
            {REASON_CODES.map((r) => (
              <option key={r} value={r}>
                {REASON_META[r].label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs font-medium text-steel-500">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="accent-[#294167]" /> Overdue only
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead className="bg-surface/70 text-[11px] font-semibold uppercase tracking-wide text-steel-300">
              <tr>
                {["Priority", "Patient", "Finding", "Status", "Conversation", "Owner", "Day", "Last contact", "Reason", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, p, prio }) => {
                const lastMsg = [...state.messages].reverse().find((m) => m.caseId === c.id);
                const ownerName = c.takeoverBy
                  ? accountById(c.takeoverBy)?.name
                  : c.ownerType === "vani"
                    ? "Vani"
                    : c.ownerType === "doctor"
                      ? "Dr. Yoga"
                      : (accountById(c.coordinatorId)?.name ?? "Unassigned");
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                    className="cursor-pointer border-t border-steel-100 transition hover:bg-tint/50"
                  >
                    <td className="px-4 py-3">
                      <PriorityBadge priority={prio} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Initials name={p.name} tone="soft" className="size-7 text-[10px]" />
                        <div>
                          <p className="flex items-center gap-1.5 font-semibold text-navy-900">
                            {p.name}
                            {c.unread && <span className="size-1.5 rounded-full bg-brand-500" title="Unread reply" />}
                          </p>
                          <p className="text-[11px] text-steel-500">
                            {p.age} · {p.sex} · {p.area}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-800">
                      BP {c.systolic}/{c.diastolic}
                    </td>
                    <td className="px-4 py-3">
                      <CaseStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">{c.conversation !== "idle" ? <ConversationBadge status={c.conversation} /> : <span className="text-xs text-steel-300">—</span>}</td>
                    <td className="px-4 py-3 text-navy-800">
                      {ownerName}
                      {!c.coordinatorId && c.status !== "closed" && <span className="ml-1.5 rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-steel-500">No coordinator</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {dayCount(c, state.day)}
                      {isOverdue(c, state.day) && <span className="ml-1.5 text-[11px] font-semibold text-status-awaiting">Overdue</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-steel-500">{lastMsg ? `${formatDay(lastMsg.day)} · WhatsApp` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-navy-800">{c.reasons.length ? REASON_META[c.reasons[c.reasons.length - 1].code].label : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {!c.coordinatorId && account.role === "coordinator" && c.status !== "closed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: "ASSIGN_TO_ME", caseId: c.id });
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-steel-100 px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-tint"
                        >
                          <UserPlus className="size-3" /> Assign to me
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-steel-500">
                    No cases match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

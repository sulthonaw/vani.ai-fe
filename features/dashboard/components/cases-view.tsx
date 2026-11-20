"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CaseStatus, ReasonCode } from "../types";
import { REASON_CODES, REASON_META, STATUS_LABEL, formatDay } from "../logic/constants";
import { accountById, dayCount, isOverdue, priorityOf } from "../logic/engine";
import { PRIORITY_META } from "../logic/constants";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { CaseStatusBadge, ConversationBadge, FilterSelect, Initials, Panel, PriorityBadge, Segmented } from "./ui-kit";

type OwnerFilter = "mine" | "vani" | "all";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-950">Cases</h1>
        <p className="mt-0.5 text-[13px] text-steel-500">Every abnormal screening result is a case with an owner, until it is closed with evidence.</p>
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
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-steel-300" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient" className="h-8 w-52 border-steel-100 bg-white pl-8 text-xs" />
          </div>
          <FilterSelect<CaseStatus | "open" | "any">
            value={status}
            onChange={setStatus}
            options={[
              { value: "open", label: "Status: open" },
              { value: "any", label: "Status: any" },
              ...(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
          />
          <FilterSelect<string>
            value={priority}
            onChange={setPriority}
            options={[{ value: "any", label: "Priority: any" }, ...Object.entries(PRIORITY_META).map(([k, v]) => ({ value: k, label: v.label }))]}
          />
          <FilterSelect<ReasonCode | "any">
            value={reason}
            onChange={setReason}
            options={[{ value: "any", label: "Reason: any" }, ...REASON_CODES.map((r) => ({ value: r, label: REASON_META[r].label }))]}
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-steel-500">
            <Checkbox checked={overdueOnly} onCheckedChange={(v) => setOverdueOnly(!!v)} /> Overdue only
          </label>
        </div>

        <Table className="min-w-[980px] text-[13px]">
          <TableHeader className="bg-surface/70">
            <TableRow className="hover:bg-transparent">
              {["Priority", "Patient", "Finding", "Status", "Conversation", "Owner", "Day", "Last contact", "Reason", ""].map((h) => (
                <TableHead key={h} className="h-9 px-4 text-[11px] font-semibold uppercase tracking-wide text-steel-300">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
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
                <TableRow key={c.id} onClick={() => router.push(`/dashboard/cases/${c.id}`)} className="cursor-pointer border-steel-100 hover:bg-tint/50">
                  <TableCell className="px-4 py-3">
                    <PriorityBadge priority={prio} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-navy-800">
                    BP {c.systolic}/{c.diastolic}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <CaseStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {c.conversation !== "idle" ? <ConversationBadge status={c.conversation} /> : <span className="text-xs text-steel-300">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-navy-800">
                    {ownerName}
                    {!c.coordinatorId && c.status !== "closed" && (
                      <Badge variant="outline" className="ml-1.5 border-steel-100 text-[10px] text-steel-500">
                        No coordinator
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {dayCount(c, state.day)}
                    {isOverdue(c, state.day) && (
                      <Badge variant="outline" className="ml-1.5 border-transparent bg-[#FDF4DC] text-[10px] font-semibold text-[#9A6B00]">
                        Overdue
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-steel-500">{lastMsg ? `${formatDay(lastMsg.day)} · WhatsApp` : "—"}</TableCell>
                  <TableCell className="px-4 py-3 text-xs text-navy-800">{c.reasons.length ? REASON_META[c.reasons[c.reasons.length - 1].code].label : "—"}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {!c.coordinatorId && account.role === "coordinator" && c.status !== "closed" && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: "ASSIGN_TO_ME", caseId: c.id });
                        }}
                        className="border-steel-100 text-brand-700"
                      >
                        <UserPlus /> Assign to me
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="px-4 py-10 text-center text-sm text-steel-500">
                  No cases match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

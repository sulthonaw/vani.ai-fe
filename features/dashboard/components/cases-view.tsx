"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Columns3, RotateCcw, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/libs/utils";
import type { CaseRecord, CaseStatus, Patient, Priority, ReasonCode } from "../types";
import { PRIORITY_META, REASON_CODES, REASON_META, STATUS_LABEL, formatDay, getPatientAvatar } from "../logic/constants";
import { accountById, dayCount, doctorById, isOverdue, priorityOf } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { CaseStatusBadge, ConversationBadge, FilterSelect, Initials, PageHeader, Panel, PriorityBadge, Segmented } from "./ui-kit";

type OwnerFilter = "mine" | "vani" | "all";

type Row = { c: CaseRecord; p: Patient; prio: Priority };

type ColumnId = "priority" | "finding" | "status" | "owner" | "day" | "conversation" | "reason" | "lastContact";

type Column = {
  id: ColumnId;
  label: string;
  /** Shown by default: only what a coordinator needs to decide the next step. */
  essential: boolean;
  className?: string;
  render: (row: Row, ctx: { day: number; lastContact?: number }) => React.ReactNode;
};

function ownerName(c: CaseRecord) {
  if (c.takeoverBy) return accountById(c.takeoverBy)?.name ?? "Staff";
  if (c.ownerType === "vani") return "Vani";
  if (c.ownerType === "doctor" || c.escalated) return doctorById(c.assignedDoctorId)?.name ?? "Dr. Yoga";
  return accountById(c.coordinatorId)?.name ?? "Unassigned";
}

const COLUMNS: Column[] = [
  { id: "priority", label: "Priority", essential: true, render: ({ prio }) => <PriorityBadge priority={prio} /> },
  {
    id: "finding",
    label: "Finding",
    essential: true,
    className: "tabular-nums",
    render: ({ c }) => (
      <span className="font-medium text-navy-900">
        {c.systolic}/{c.diastolic} <span className="font-normal text-steel-300">mmHg</span>
      </span>
    ),
  },
  { id: "status", label: "Status", essential: true, render: ({ c }) => <CaseStatusBadge status={c.status} /> },
  {
    id: "owner",
    label: "Owner",
    essential: true,
    render: ({ c }) => (
      <span className={cn("text-navy-800", !c.coordinatorId && c.status !== "closed" && c.ownerType !== "doctor" && "text-steel-500")}>
        {ownerName(c)}
        {!c.coordinatorId && c.status !== "closed" && <span className="ml-1.5 text-[11px] text-steel-300">· no coordinator</span>}
      </span>
    ),
  },
  {
    id: "day",
    label: "Day",
    essential: true,
    className: "tabular-nums",
    render: ({ c }, { day }) => (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-navy-900">{dayCount(c, day)}</span>
        {isOverdue(c, day) && <span className="rounded bg-[#FDF4DC] px-1.5 py-0.5 text-[10px] font-medium text-[#9A6B00]">Overdue</span>}
      </span>
    ),
  },
  {
    id: "conversation",
    label: "Conversation",
    essential: false,
    render: ({ c }) => (c.conversation !== "idle" ? <ConversationBadge status={c.conversation} /> : <span className="text-steel-300">—</span>),
  },
  {
    id: "reason",
    label: "Reason",
    essential: false,
    render: ({ c }) => <span className="text-navy-800">{c.reasons.length ? REASON_META[c.reasons[c.reasons.length - 1].code].label : <span className="text-steel-300">—</span>}</span>,
  },
  {
    id: "lastContact",
    label: "Last contact",
    essential: false,
    render: (_, { lastContact }) => <span className="text-steel-500">{lastContact !== undefined ? formatDay(lastContact) : "—"}</span>,
  },
];

const DEFAULT_VISIBLE = new Set<ColumnId>(COLUMNS.filter((c) => c.essential).map((c) => c.id));

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
  const [visible, setVisible] = React.useState<Set<ColumnId>>(DEFAULT_VISIBLE);

  // Reset the owner filter when the active account changes (derived-state pattern, no effect).
  const [prevAccount, setPrevAccount] = React.useState(account.id);
  if (prevAccount !== account.id) {
    setPrevAccount(account.id);
    setOwner(account.role === "coordinator" ? "mine" : "all");
  }

  const rows = React.useMemo<Row[]>(() => {
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

  const lastContact = React.useMemo(() => {
    const m = new Map<string, number>();
    state.messages.forEach((msg) => m.set(msg.caseId, msg.day));
    return m;
  }, [state.messages]);

  const columns = COLUMNS.filter((col) => visible.has(col.id));
  const toggleColumn = (id: ColumnId, on: boolean) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const filtersActive = status !== "open" || priority !== "any" || reason !== "any" || overdueOnly || q !== "";

  return (
    <div className="space-y-6">
      <PageHeader title="Cases" description="Every abnormal screening result is a case with an owner, until it is closed with evidence." />

      <Panel
        title={`${rows.length} case${rows.length === 1 ? "" : "s"}`}
        subtitle={owner === "mine" ? `Assigned to ${account.name}, plus unassigned` : owner === "vani" ? "Currently handled by Vani" : "All cases at this facility"}
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
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-y border-[#EEF0F4] px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-steel-300" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient" aria-label="Search patient" className="h-8 w-52 border-[#E8EBF1] bg-white pl-8 text-xs" />
          </div>
          <FilterSelect<CaseStatus | "open" | "any">
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "open", label: "Open" },
              { value: "any", label: "Any" },
              ...(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
          />
          <FilterSelect<string>
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[{ value: "any", label: "Any" }, ...Object.entries(PRIORITY_META).map(([k, v]) => ({ value: k, label: v.label }))]}
          />
          <FilterSelect<ReasonCode | "any">
            label="Reason"
            value={reason}
            onChange={setReason}
            options={[{ value: "any", label: "Any" }, ...REASON_CODES.map((r) => ({ value: r, label: REASON_META[r].label }))]}
          />
          <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-[#E8EBF1] bg-white px-3 text-xs font-medium text-navy-800 hover:bg-[#F7F8FA]">
            <Checkbox checked={overdueOnly} onCheckedChange={(v) => setOverdueOnly(!!v)} /> Overdue only
          </label>
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("open");
                setPriority("any");
                setReason("any");
                setOverdueOnly(false);
                setQ("");
              }}
              className="h-8 gap-1.5 text-xs text-steel-500"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          )}

          <span className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-[#E8EBF1] text-xs font-medium text-navy-800">
                  <Columns3 className="size-3.5" /> Columns
                  <span className="rounded bg-[#F1F3F7] px-1.5 text-[10px] tabular-nums text-steel-500">{columns.length + 1}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px]">Show columns</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked disabled className="py-1.5 pl-2 text-[13px]">
                  Patient
                </DropdownMenuCheckboxItem>
                {COLUMNS.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={visible.has(col.id)}
                    onCheckedChange={(v) => toggleColumn(col.id, !!v)}
                    className="py-1.5 pl-2 text-[13px]"
                  >
                    {col.label}
                    {!col.essential && <span className="ml-auto pr-1 text-[10px] text-steel-300">extra</span>}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setVisible(new Set(DEFAULT_VISIBLE))} className="py-1.5 pl-2 text-[13px] text-steel-500">
                Reset to essentials
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="border-[#EEF0F4] hover:bg-transparent">
              <TableHead className="h-10 pl-5 text-xs font-medium text-steel-500">Patient</TableHead>
              {columns.map((col) => (
                <TableHead key={col.id} className="h-10 px-4 text-xs font-medium text-steel-500">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="h-10 w-px pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const { c, p } = row;
              const ctx = { day: state.day, lastContact: lastContact.get(c.id) };
              return (
                <TableRow
                  key={c.id}
                  onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                  className="group cursor-pointer border-[#F1F3F6] hover:bg-[#FAFBFC]"
                >
                  <TableCell className="py-3 pl-5">
                    <div className="flex items-center gap-2.5">
                      <Initials name={p.name} avatarUrl={getPatientAvatar(p)} tone="soft" className="size-7 text-[10px]" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-navy-950">
                          {p.name}
                          {c.unread && <span className="size-1.5 rounded-full bg-brand-500" title="Unread reply" />}
                        </p>
                        <p className="text-xs text-steel-500">
                          {p.age} · {p.sex === "F" ? "Female" : "Male"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cn("px-4 py-3", col.className)}>
                      {col.render(row, ctx)}
                    </TableCell>
                  ))}
                  <TableCell className="py-3 pr-5 text-right">
                    {!c.coordinatorId && account.role === "coordinator" && c.status !== "closed" ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: "ASSIGN_TO_ME", caseId: c.id });
                        }}
                        className="border-[#E8EBF1] text-navy-800"
                      >
                        <UserPlus /> Assign to me
                      </Button>
                    ) : (
                      <ChevronRight className="ml-auto size-4 text-steel-300 transition group-hover:translate-x-0.5 group-hover:text-navy-900" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="px-5 py-10 text-center text-sm text-steel-500">
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

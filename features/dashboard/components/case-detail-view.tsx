"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Hand,
  MessagesSquare,
  Send,
  ShieldAlert,
  Stethoscope,
  Undo2,
  UserPlus,
  Users,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/libs/utils";
import type { CaseRecord, ClosureType, DemoState, Message } from "../types";
import { CLOSURE_LABEL, CONSENT_LABEL, REASON_META, formatDay, nextWeekday } from "../logic/constants";
import { accountById, canClose, dayCount, familyOf, isOverdue, priorityOf } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { CaseStatusBadge, ConversationBadge, EmptyState, Initials, Panel, PriorityBadge } from "./ui-kit";

const KIND_DOT: Record<string, string> = {
  result: "#294167",
  message: "#3D6FD9",
  reason: "#E5A50A",
  handover: "#F07B2B",
  schedule: "#22A06B",
  visit: "#22A06B",
  closure: "#1B7F55",
  family: "#7FA3E8",
  clinical: "#E5484D",
  system: "#97A0B7",
};

function MessageBubble({ m }: { m: Message }) {
  const outgoing = m.from === "vani" || m.from === "staff";
  const label =
    m.from === "vani" ? "Vani (digital assistant)" : m.from === "staff" ? m.senderName : m.from === "family" ? `${m.senderName} · family` : m.senderName;
  return (
    <div className={cn("flex flex-col gap-1", outgoing ? "items-end" : "items-start")}>
      <span className="flex items-center gap-1 px-1 text-[10px] font-medium text-steel-300">
        {m.from === "vani" && <Bot className="size-3" />}
        {label}
        {m.to === "family" && m.from !== "family" && " → family"} · Day {m.day} {m.time}
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
          m.from === "vani" && "bg-tint text-navy-900",
          m.from === "staff" && "bg-brand-700 text-white",
          m.from === "patient" && "border border-steel-100 bg-white text-navy-900",
          m.from === "family" && "border border-[#D6E2F8] bg-[#F5F8FE] text-navy-900",
          outgoing ? "rounded-br-md" : "rounded-bl-md",
        )}
      >
        {m.text}
      </div>
    </div>
  );
}

function ScheduleForm({ state, c, onDone }: { state: DemoState; c: CaseRecord; onDone: () => void }) {
  const { dispatch } = useDemoStore();
  const options = [
    { label: `Tomorrow (${formatDay(state.day + 1)})`, day: state.day + 1 },
    { label: `Saturday (${formatDay(nextWeekday(state.day, 6))})`, day: nextWeekday(state.day, 6) },
    { label: `Next Monday (${formatDay(nextWeekday(state.day, 1))})`, day: nextWeekday(state.day, 1) },
  ];
  const [day, setDay] = React.useState(options[1].day);
  const [time, setTime] = React.useState("08:00");
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-steel-100 bg-surface p-3">
      <label className="flex flex-col gap-1 text-[11px] font-medium text-steel-500">
        Day
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="h-8 rounded-lg border border-steel-100 bg-white px-2 text-xs text-navy-900">
          {options.map((o) => (
            <option key={o.day} value={o.day}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-steel-500">
        Time
        <select value={time} onChange={(e) => setTime(e.target.value)} className="h-8 rounded-lg border border-steel-100 bg-white px-2 text-xs text-navy-900">
          {["07:30", "08:00", "09:00", "10:30", "13:00"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <button
        onClick={() => {
          dispatch({ type: "SCHEDULE", caseId: c.id, day, time });
          toast.success("Visit scheduled", { description: `${formatDay(day)} at ${time}. Vani will send reminders.` });
          onDone();
        }}
        className="h-8 rounded-lg bg-brand-700 px-3 text-xs font-semibold text-white hover:bg-brand-600"
      >
        Confirm
      </button>
    </div>
  );
}

function CloseDialog({ c, open, onOpenChange }: { c: CaseRecord; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { dispatch } = useDemoStore();
  const account = useActiveAccount();
  const [type, setType] = React.useState<ClosureType>("controlled");
  const [note, setNote] = React.useState("");
  const error = canClose(c, type, note, account.role);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close case with evidence</DialogTitle>
          <DialogDescription>A case can only be closed when the evidence is documented.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {(Object.keys(CLOSURE_LABEL) as ClosureType[]).map((t) => (
            <label key={t} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm", type === t ? "border-brand-500 bg-tint" : "border-steel-100")}>
              <input type="radio" checked={type === t} onChange={() => setType(t)} className="accent-[#294167]" />
              {CLOSURE_LABEL[t]}
            </label>
          ))}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Evidence / note (e.g. two in-target readings on day 20 and 34)"
            className="h-20 w-full resize-none rounded-lg border border-steel-100 p-2 text-sm outline-none focus:border-brand-500"
          />
          <p className="text-xs text-steel-500">
            In-target visits recorded: <b>{c.visitsInTarget}</b> / 2
          </p>
          {error && <p className="text-xs font-medium text-status-urgent">{error}</p>}
        </div>
        <DialogFooter>
          <button
            disabled={!!error}
            onClick={() => {
              dispatch({ type: "CLOSE_CASE", caseId: c.id, closure: type, note });
              toast.success("Case closed with evidence");
              onOpenChange(false);
            }}
            className="h-9 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Close case
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  tone = "default",
  disabled,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3.5",
        tone === "primary" && "border-brand-700 bg-brand-700 text-white hover:bg-brand-600",
        tone === "danger" && "border-[#F6CACB] bg-[#FDF0F0] text-status-urgent hover:bg-[#FCE4E4]",
        tone === "default" && "border-steel-100 bg-white text-navy-800 hover:bg-surface",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function CaseBreadcrumb({ name }: { name?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard/cases" />}>Cases</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-navy-900">{name ?? "Case not found"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function CaseDetailView({ caseId }: { caseId: string }) {
  const { state, dispatch } = useDemoStore();
  const account = useActiveAccount();
  const c = state.cases.find((x) => x.id === caseId);
  const [showSchedule, setShowSchedule] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [clinicalNote, setClinicalNote] = React.useState("");
  const chatEnd = React.useRef<HTMLDivElement>(null);

  const messages = React.useMemo(() => (c ? state.messages.filter((m) => m.caseId === c.id) : []), [state.messages, c]);
  const timeline = React.useMemo(() => (c ? state.timeline.filter((t) => t.caseId === c.id) : []), [state.timeline, c]);

  React.useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  React.useEffect(() => {
    if (c?.unread) dispatch({ type: "MARK_READ", caseId: c.id });
  }, [c?.unread, c?.id, dispatch]);

  if (!c) {
    return (
      <div className="space-y-4">
        <CaseBreadcrumb />
        <EmptyState>
          This case does not exist in the demo data. <Link href="/dashboard/cases" className="font-semibold text-brand-700">Back to cases</Link>
        </EmptyState>
      </div>
    );
  }

  const patient = state.patients.find((p) => p.id === c.patientId)!;
  const fam = familyOf(state, c.patientId);
  const famAny = state.families.find((f) => f.patientId === c.patientId);
  const takenByMe = c.takeoverBy === account.id;
  const takenByOther = !!c.takeoverBy && !takenByMe;
  const closed = c.status === "closed";
  const prio = priorityOf(c, state.day);

  return (
    <div className="space-y-4">
      <CaseBreadcrumb name={patient.name} />

      {/* Header */}
      <section className="rounded-2xl border border-steel-100 bg-white">
        <div className="flex flex-wrap items-start gap-4 px-5 py-4">
          <Initials name={patient.name} className="size-12 text-sm" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-navy-950">
              {patient.name}, {patient.age}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-steel-500">
              <span className="font-semibold text-navy-800">
                BP {c.systolic}/{c.diastolic}
              </span>
              <span>· Hypertension (screening)</span>
              <span>· Day {dayCount(c, state.day)}</span>
              {isOverdue(c, state.day) && <span className="font-semibold text-status-awaiting">· Overdue</span>}
              <CaseStatusBadge status={c.status} />
              {c.conversation !== "idle" && <ConversationBadge status={c.conversation} />}
              {prio === "unassigned" && <PriorityBadge priority={prio} />}
            </div>
            <p className="mt-1.5 text-xs text-steel-500">
              Owner:{" "}
              <b className="text-navy-800">
                {c.takeoverBy
                  ? `${accountById(c.takeoverBy)?.name} (took over)`
                  : c.ownerType === "vani"
                    ? "Vani"
                    : c.ownerType === "doctor"
                      ? "Doctor (Dr. Yoga)"
                      : (accountById(c.coordinatorId)?.name ?? "Unassigned")}
              </b>{" "}
              · Coordinator: {accountById(c.coordinatorId)?.name ?? "Unassigned"} · Registered at {patient.registeredClinic} · Insurance {patient.insuranceStatus}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!closed && !c.takeoverBy && (
              <ActionButton icon={<Hand />} tone="primary" onClick={() => dispatch({ type: "TAKE_OVER", caseId: c.id })}>
                Take over
              </ActionButton>
            )}
            {!closed && takenByMe && (
              <ActionButton icon={<Undo2 />} tone="primary" onClick={() => dispatch({ type: "RETURN_TO_VANI", caseId: c.id })}>
                Return to Vani
              </ActionButton>
            )}
          </div>
        </div>

        {!closed && (c.handoverNote || c.conversation === "urgent") && (
          <div
            className={cn(
              "flex items-center gap-2 border-t px-5 py-2 text-xs font-medium",
              c.conversation === "urgent" ? "border-[#F6CACB] bg-[#FCE4E4] text-status-urgent" : "border-[#F8D6BD] bg-[#FDEBDD] text-[#B4561A]",
            )}
          >
            <ShieldAlert className="size-4" /> {c.handoverNote ?? "Danger sign detected by rule — doctor review needed."}
          </div>
        )}

        {!closed && (
          <div className="space-y-2 border-t border-steel-100 px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {!c.coordinatorId && account.role === "coordinator" && (
                <ActionButton icon={<UserPlus />} onClick={() => dispatch({ type: "ASSIGN_TO_ME", caseId: c.id })}>
                  Assign to me
                </ActionButton>
              )}
              <ActionButton icon={<CalendarPlus />} onClick={() => setShowSchedule((v) => !v)}>
                Schedule visit
              </ActionButton>
              <ActionButton
                icon={<CheckCircle2 />}
                onClick={() => {
                  dispatch({ type: "RECORD_VISIT", caseId: c.id, inTarget: false });
                  toast.success("Visit recorded", { description: "Status → In treatment" });
                }}
              >
                Record visit
              </ActionButton>
              <ActionButton
                icon={<CheckCircle2 />}
                onClick={() => {
                  dispatch({ type: "RECORD_VISIT", caseId: c.id, inTarget: true });
                  toast.success("Visit recorded · BP in target");
                }}
              >
                Record visit (BP in target)
              </ActionButton>
              {!c.escalated && c.conversation !== "urgent" && (
                <ActionButton
                  icon={<Stethoscope />}
                  tone="danger"
                  onClick={() => {
                    dispatch({ type: "ESCALATE", caseId: c.id, note: "Needs clinical review" });
                    toast("Escalated to doctor");
                  }}
                >
                  Escalate to doctor
                </ActionButton>
              )}
              <span className="flex-1" />
              <ActionButton icon={<ClipboardCheck />} onClick={() => setCloseOpen(true)}>
                Close case…
              </ActionButton>
            </div>
            {showSchedule && <ScheduleForm state={state} c={c} onDone={() => setShowSchedule(false)} />}
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Panel icon={<History />} title="Case timeline" subtitle="Every step, with who did it and when">
            <ol className="relative space-y-3 border-l border-steel-100 pl-4">
              {timeline.map((t) => (
                <li key={t.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-white" style={{ background: KIND_DOT[t.kind] }} />
                  <p className="text-[13px] text-navy-900">{t.label}</p>
                  <p className="text-[11px] text-steel-300">
                    Day {t.day} · {formatDay(t.day, false)} · {t.actor}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel icon={<Users />} title="Reasons & family" subtitle="What makes it hard to come, and who can help">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-300">Reasons</h3>
            <div className="flex flex-wrap gap-1.5">
              {c.reasons.length === 0 && <span className="text-xs text-steel-300">No reason recorded yet</span>}
              {c.reasons.map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DC] px-2.5 py-1 text-[11px] font-semibold text-[#9A6B00]">
                  {REASON_META[r.code].label}
                  {r.source === "simulated-ai" && (
                    <span className="rounded-full bg-white px-1.5 text-[10px] text-brand-700">Simulated AI · {Math.round((r.confidence ?? 0) * 100)}%</span>
                  )}
                </span>
              ))}
            </div>

            <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-steel-300">Family</h3>
            {famAny ? (
              <div className="flex items-center gap-3 rounded-xl border border-steel-100 p-3">
                <Users className="size-4 text-steel-500" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-navy-900">
                    {famAny.name} ({famAny.relation})
                  </p>
                  <p className="text-steel-500">{famAny.revoked ? "Access revoked" : `${CONSENT_LABEL[famAny.consentLevel]} · consent day ${famAny.consentDay}`}</p>
                </div>
                {fam && !closed && (
                  <button onClick={() => dispatch({ type: "REVOKE_FAMILY", caseId: c.id })} className="text-[11px] font-semibold text-steel-500 hover:text-status-urgent">
                    Revoke
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-steel-300">No family contact shared by the patient</p>
            )}

            {c.closure && (
              <div className="mt-5 rounded-xl border border-[#BFE6D3] bg-[#EEF9F3] p-3 text-xs text-[#1B7F55]">
                <p className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" /> Closed: {CLOSURE_LABEL[c.closure.type]}
                </p>
                <p className="mt-1 text-navy-800">{c.closure.note}</p>
                <p className="mt-1 text-steel-500">
                  by {c.closure.by} · Day {c.closure.day}
                </p>
              </div>
            )}
          </Panel>

          {account.role === "doctor" && !closed && (
            <Panel icon={<Stethoscope />} title="Clinical decision" subtitle="Only doctors make medical decisions">
              <textarea
                value={clinicalNote}
                onChange={(e) => setClinicalNote(e.target.value)}
                placeholder="e.g. Called patient; referred to ED. Recheck BP in 3 days."
                className="h-20 w-full resize-none rounded-lg border border-steel-100 p-2 text-xs outline-none focus:border-brand-500"
              />
              <div className="mt-2 flex gap-2">
                <ActionButton
                  icon={<ClipboardCheck />}
                  disabled={clinicalNote.trim().length < 3}
                  onClick={() => {
                    dispatch({ type: "CLINICAL_DECISION", caseId: c.id, note: clinicalNote, returnToCoordinator: false });
                    setClinicalNote("");
                    toast.success("Clinical decision recorded");
                  }}
                >
                  Record
                </ActionButton>
                <ActionButton
                  icon={<Undo2 />}
                  disabled={clinicalNote.trim().length < 3}
                  onClick={() => {
                    dispatch({ type: "CLINICAL_DECISION", caseId: c.id, note: clinicalNote, returnToCoordinator: true });
                    setClinicalNote("");
                    toast.success("Returned to care coordinator");
                  }}
                >
                  Record & return to coordinator
                </ActionButton>
              </div>
            </Panel>
          )}
        </div>

        <Panel icon={<MessagesSquare />} title="Conversation" subtitle="WhatsApp (simulated) · Vani, staff, patient and family" bodyClassName="flex flex-col p-0">
          <div className="max-h-[640px] min-h-[360px] flex-1 space-y-3 overflow-y-auto bg-surface/60 px-5 py-4">
            {messages.length === 0 && <p className="pt-10 text-center text-xs text-steel-300">No messages yet.</p>}
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="border-t border-steel-100 p-3">
            {closed ? (
              <p className="text-center text-xs text-steel-300">Case closed</p>
            ) : takenByMe ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  dispatch({ type: "STAFF_MESSAGE", caseId: c.id, text: draft.trim() });
                  setDraft("");
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message as ${account.name}…`}
                  className="h-9 flex-1 rounded-lg border border-steel-100 px-3 text-sm outline-none focus:border-brand-500"
                />
                <button className="grid size-9 place-items-center rounded-lg bg-brand-700 text-white hover:bg-brand-600" aria-label="Send">
                  <Send className="size-4" />
                </button>
              </form>
            ) : takenByOther ? (
              <p className="text-center text-xs text-steel-500">{accountById(c.takeoverBy)?.name} is handling this conversation.</p>
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-steel-500">
                <Bot className="size-3.5" /> Vani is handling this conversation. Take over to reply yourself.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <CloseDialog c={c} open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}

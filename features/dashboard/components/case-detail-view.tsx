"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Hand,
  Search,
  ShieldAlert,
  Sparkles,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import type { CaseRecord, ClosureType, DemoState } from "../types";
import { CLOSURE_LABEL, CONSENT_LABEL, DOCTORS, REASON_META, formatDay, getPatientAvatar, nextWeekday } from "../logic/constants";
import { accountById, canClose, dayCount, doctorById, familyOf, isOverdue, priorityOf } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { CaseStatusBadge, ConversationBadge, EmptyState, FilterSelect, Initials, Panel, PriorityBadge } from "./ui-kit";
import { WhatsAppChat } from "./whatsapp-chat";

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

function ScheduleForm({ state, c, onDone }: { state: DemoState; c: CaseRecord; onDone: () => void }) {
  const { dispatch } = useDemoStore();
  const options = [
    { label: `Tomorrow (${formatDay(state.day + 1)})`, day: state.day + 1 },
    { label: `Saturday (${formatDay(nextWeekday(state.day, 6))})`, day: nextWeekday(state.day, 6) },
    { label: `Next Monday (${formatDay(nextWeekday(state.day, 1))})`, day: nextWeekday(state.day, 1) },
  ];
  const [day, setDay] = React.useState(String(options[1].day));
  const [time, setTime] = React.useState("08:00");
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-steel-100 bg-surface p-3">
      <div className="flex flex-col gap-1 text-[11px] font-medium text-steel-500">
        Day
        <FilterSelect value={day} onChange={setDay} options={options.map((o) => ({ value: String(o.day), label: o.label }))} className="w-60" />
      </div>
      <div className="flex flex-col gap-1 text-[11px] font-medium text-steel-500">
        Time
        <FilterSelect value={time} onChange={setTime} options={["07:30", "08:00", "09:00", "10:30", "13:00"].map((t) => ({ value: t, label: t }))} className="w-24" />
      </div>
      <Button
        size="sm"
        onClick={() => {
          dispatch({ type: "SCHEDULE", caseId: c.id, day: Number(day), time });
          toast.success("Visit scheduled", { description: `${formatDay(Number(day))} at ${time}. Vani will send reminders.` });
          onDone();
        }}
        className="h-8 rounded-lg px-3 text-xs font-semibold"
      >
        Confirm
      </Button>
    </div>
  );
}

function EscalateDoctorDialog({
  c,
  open,
  onOpenChange,
}: {
  c: CaseRecord;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { state, dispatch } = useDemoStore();
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"recommendation" | "patients" | "name">("recommendation");
  const [note, setNote] = React.useState("Needs clinical review");

  const doctorStats = React.useMemo(() => {
    const activeCasesByDoctor = new Map<string, number>();
    state.cases.forEach((item) => {
      if (item.status !== "closed" && (item.escalated || item.ownerType === "doctor")) {
        const docId = item.assignedDoctorId ?? "yoga";
        activeCasesByDoctor.set(docId, (activeCasesByDoctor.get(docId) ?? 0) + 1);
      }
    });

    const list = DOCTORS.map((doc) => ({
      ...doc,
      patientCount: doc.basePatients + (activeCasesByDoctor.get(doc.id) ?? 0),
    }));

    // Determine the top recommended doctor (available with fewest patients)
    const availableSorted = [...list].filter((d) => d.available).sort((a, b) => a.patientCount - b.patientCount);
    const topRecommendedId = availableSorted[0]?.id;

    return list.map((d) => ({
      ...d,
      isRecommended: d.id === topRecommendedId,
    }));
  }, [state.cases]);

  const filteredDoctors = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = doctorStats.filter(
      (d) => !q || d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q),
    );
    return [...list].sort((a, b) => {
      if (sortBy === "recommendation") {
        if (a.available !== b.available) return a.available ? -1 : 1;
        return a.patientCount - b.patientCount;
      }
      if (sortBy === "patients") {
        return a.patientCount - b.patientCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [doctorStats, search, sortBy]);

  const defaultSelected = React.useMemo(
    () => doctorStats.find((d) => d.isRecommended)?.id ?? doctorStats.find((d) => d.available)?.id ?? "",
    [doctorStats],
  );
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>(defaultSelected);

  // Preselect the recommended doctor each time the dialog opens (or the recommendation changes while open).
  // Adjusting state during render avoids an extra effect pass (react.dev: "You might not need an effect").
  const [syncedFor, setSyncedFor] = React.useState<string | null>(null);
  const syncKey = open ? defaultSelected : null;
  if (syncKey !== syncedFor) {
    setSyncedFor(syncKey);
    if (syncKey !== null) setSelectedDoctorId(syncKey);
  }

  const selectedDoc = doctorStats.find((d) => d.id === selectedDoctorId && d.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="size-4 text-brand-700" />
            Escalate to Doctor
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select an available doctor to assign this case. Recommended doctors are ranked by availability and lowest active caseload.
          </DialogDescription>
        </DialogHeader>

        {/* Search & Sort Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-steel-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor name or specialty…"
              className="h-8 rounded-lg border-steel-100 pl-8 text-xs shadow-none"
            />
          </div>
          <FilterSelect
            value={sortBy}
            onChange={(v) => setSortBy(v as "recommendation" | "patients" | "name")}
            options={[
              { value: "recommendation", label: "Sort: Recommendation" },
              { value: "patients", label: "Sort: Fewest patients" },
              { value: "name", label: "Sort: Name A–Z" },
            ]}
            className="h-8 w-full shrink-0 text-xs sm:w-48"
          />
        </div>

        {/* Doctor List */}
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {filteredDoctors.length === 0 && (
            <p className="rounded-lg border border-dashed border-steel-100 py-6 text-center text-xs text-steel-500">
              No doctors match &ldquo;{search}&rdquo;.
            </p>
          )}
          {filteredDoctors.map((doc) => {
            const isSelected = selectedDoctorId === doc.id && doc.available;
            return (
              <label
                key={doc.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition",
                  !doc.available
                    ? "cursor-not-allowed border-steel-100 bg-slate-50/80 opacity-60"
                    : isSelected
                      ? "cursor-pointer border-brand-500 bg-tint/60 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                      : "cursor-pointer border-steel-100 bg-white hover:bg-surface",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={!doc.available}
                  onCheckedChange={() => {
                    if (doc.available) setSelectedDoctorId(doc.id);
                  }}
                  className="mt-1 shrink-0 rounded-full"
                />
                <Initials name={doc.name} avatarUrl={doc.avatar} className="size-9 shrink-0 text-xs" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="line-clamp-1 text-[13px] font-semibold text-navy-950">{doc.name}</span>
                      {doc.isRecommended && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          <Sparkles className="size-2.5" /> Recommended
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        doc.available ? "bg-[#E3F5EC] text-[#1B7F55]" : "bg-[#FDECEC] text-[#C9373C]",
                      )}
                    >
                      {doc.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-[11.5px] text-steel-500">{doc.specialty}</p>
                  <div className="flex min-w-0 items-center gap-1.5 pt-0.5 text-[11px]">
                    <span className="shrink-0 font-medium text-navy-800">
                      {doc.patientCount} active {doc.patientCount === 1 ? "patient" : "patients"}
                    </span>
                    {!doc.available && doc.unavailableReason && (
                      <span className="line-clamp-1 text-[#C9373C]">· {doc.unavailableReason}</span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Escalation Note */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-steel-500">Note for doctor</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Brief clinical handover note…"
            className="min-h-16 resize-none border-steel-100 text-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedDoc}
            onClick={() => {
              if (!selectedDoc) return;
              dispatch({
                type: "ESCALATE",
                caseId: c.id,
                doctorId: selectedDoc.id,
                note: note.trim() || "Needs clinical review",
              });
              toast.success(`Escalated to ${selectedDoc.name}`);
              onOpenChange(false);
            }}
            className="h-8 bg-brand-700 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
          >
            Escalate & Assign{selectedDoc ? ` (${selectedDoc.name})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordVisitDialog({ c, open, onOpenChange }: { c: CaseRecord; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { dispatch } = useDemoStore();
  const [inTarget, setInTarget] = React.useState(true);
  const options = [
    {
      value: true,
      title: "Record visit (BP in target)",
      description: `Counts toward the 2 in-target visits needed for Controlled (${c.visitsInTarget}/2 recorded).`,
    },
    {
      value: false,
      title: "Record visit (BP above target)",
      description: "Logs attendance and keeps the case in treatment.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record clinic visit</DialogTitle>
          <DialogDescription>Select the patient&apos;s blood pressure reading for this visit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = inTarget === opt.value;
            return (
              <label
                key={String(opt.value)}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition",
                  selected ? "border-brand-500 bg-tint" : "border-steel-100 hover:bg-surface",
                )}
              >
                <Checkbox checked={selected} onCheckedChange={() => setInTarget(opt.value)} className="mt-0.5 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy-950">{opt.title}</p>
                  <p className="text-xs text-steel-500">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              dispatch({ type: "RECORD_VISIT", caseId: c.id, inTarget });
              if (inTarget) {
                toast.success("Visit recorded · BP in target");
              } else {
                toast.success("Visit recorded", { description: "Status → In treatment" });
              }
              onOpenChange(false);
            }}
            className="h-8 bg-brand-700 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Record visit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
              <Checkbox checked={type === t} onCheckedChange={() => setType(t)} className="rounded-full" />
              {CLOSURE_LABEL[t]}
            </label>
          ))}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Evidence / note (e.g. two in-target readings on day 20 and 34)"
            className="min-h-20 resize-none border-steel-100 text-sm"
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
  const [takeOverOpen, setTakeOverOpen] = React.useState(false);
  const [returnToVaniOpen, setReturnToVaniOpen] = React.useState(false);
  const [recordVisitOpen, setRecordVisitOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [escalateOpen, setEscalateOpen] = React.useState(false);
  const [clinicalNote, setClinicalNote] = React.useState("");

  const timeline = React.useMemo(() => (c ? state.timeline.filter((t) => t.caseId === c.id) : []), [state.timeline, c]);

  React.useEffect(() => {
    if (c?.unread) dispatch({ type: "MARK_READ", caseId: c.id });
  }, [c?.unread, c?.id, dispatch]);

  if (!c) {
    return (
      <div className="space-y-6">
        <CaseBreadcrumb />
        <EmptyState>
          This case does not exist in the demo data. <Link href="/dashboard/cases" className="font-semibold text-brand-700">Back to cases</Link>
        </EmptyState>
      </div>
    );
  }

  const patient = state.patients.find((p) => p.id === c.patientId)!;
  const patientAvatar = getPatientAvatar(patient);
  const fam = familyOf(state, c.patientId);
  const famAny = state.families.find((f) => f.patientId === c.patientId);
  const takenByMe = c.takeoverBy === account.id;
  const closed = c.status === "closed";
  const prio = priorityOf(c, state.day);

  return (
    <div>
      {/* 70% Left (Breadcrumb + Compact Header + Scrollable Panels) : 30% Right (Sticky WhatsApp Chat aligned with Breadcrumb) */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
        {/* Left 70%: Scrollable Case Information */}
        <div className="min-w-0 space-y-3.5">
          <CaseBreadcrumb name={patient.name} />

          {/* Compact Header */}
          <section data-tour="case-header" className="rounded-xl border border-[#E8EBF1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-start gap-3 px-4 py-3">
              <Initials name={patient.name} avatarUrl={patientAvatar} className="size-10 text-xs" />
              <div className="min-w-0 flex-1">
                <h1 className="text-[17px] font-semibold leading-tight tracking-tight text-navy-950">
                  {patient.name}, {patient.age}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-steel-500">
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
                <p className="mt-1 text-[11.5px] text-steel-500">
                  Owner:{" "}
                  <b className="text-navy-800">
                    {c.takeoverBy
                      ? `${accountById(c.takeoverBy)?.name} (took over)`
                      : c.ownerType === "vani"
                        ? "Vani"
                        : c.ownerType === "doctor" || c.escalated
                          ? `Doctor (${doctorById(c.assignedDoctorId)?.name ?? "Dr. Yoga"})`
                          : (accountById(c.coordinatorId)?.name ?? "Unassigned")}
                  </b>{" "}
                  · Coordinator: {accountById(c.coordinatorId)?.name ?? "Unassigned"} · Registered at {patient.registeredClinic} · Insurance {patient.insuranceStatus}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!closed && !c.takeoverBy && (
                  <ActionButton icon={<Hand />} tone="primary" onClick={() => setTakeOverOpen(true)}>
                    Take over
                  </ActionButton>
                )}
                {!closed && takenByMe && (
                  <ActionButton
                    icon={<Image src="/images/vani-icon.png" alt="Vani" width={123} height={91} className="h-3 w-auto brightness-0 invert" />}
                    tone="primary"
                    onClick={() => setReturnToVaniOpen(true)}
                  >
                    Return to Vani
                  </ActionButton>
                )}
              </div>
            </div>

            {!closed && (c.handoverNote || c.conversation === "urgent") && (
              <div
                className={cn(
                  "flex items-center gap-2 border-t px-4 py-1.5 text-[11.5px] font-medium",
                  c.conversation === "urgent" ? "border-[#F6CACB] bg-[#FCE4E4] text-status-urgent" : "border-[#F8D6BD] bg-[#FDEBDD] text-[#B4561A]",
                )}
              >
                <ShieldAlert className="size-3.5 shrink-0" /> {c.handoverNote ?? "Danger sign detected by rule — doctor review needed."}
              </div>
            )}

            {!closed && (
              <div className="space-y-2 border-t border-steel-100 px-4 py-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {!c.coordinatorId && account.role === "coordinator" && (
                    <ActionButton icon={<UserPlus />} onClick={() => dispatch({ type: "ASSIGN_TO_ME", caseId: c.id })}>
                      Assign to me
                    </ActionButton>
                  )}
                  <ActionButton icon={<CalendarPlus />} onClick={() => setShowSchedule((v) => !v)}>
                    Schedule visit
                  </ActionButton>
                  <ActionButton icon={<CheckCircle2 />} onClick={() => setRecordVisitOpen(true)}>
                    Record visit…
                  </ActionButton>
                  {!c.escalated && c.conversation !== "urgent" && (
                    <ActionButton
                      icon={<Stethoscope />}
                      tone="danger"
                      onClick={() => setEscalateOpen(true)}
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

          <Panel tourId="timeline" icon={<History />} title="Case timeline" subtitle="Every step, with who did it and when">
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
              <Textarea
                value={clinicalNote}
                onChange={(e) => setClinicalNote(e.target.value)}
                placeholder="e.g. Called patient; referred to ED. Recheck BP in 3 days."
                className="min-h-20 resize-none border-steel-100 text-xs"
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

        {/* Right 30%: Sticky WhatsApp Chat (Aligned with Breadcrumb & Fit to Viewport) */}
        <div data-tour="chat" className="lg:sticky lg:top-[4.75rem] lg:self-start">
          <WhatsAppChat c={c} patientName={patient.name} className="h-[calc(100vh-6rem)] min-h-[480px]" />
        </div>
      </div>

      <AlertDialog open={takeOverOpen} onOpenChange={setTakeOverOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take over conversation from Vani?</AlertDialogTitle>
            <AlertDialogDescription>
              Vani&apos;s automated follow-up messages for {patient.name} will be paused while you handle this case directly. You can return control to Vani at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch({ type: "TAKE_OVER", caseId: c.id });
                toast.success("You took over from Vani", {
                  description: "Automated reminders are paused until you return the case.",
                });
                setTakeOverOpen(false);
              }}
            >
              Take over
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={returnToVaniOpen} onOpenChange={setReturnToVaniOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return conversation to Vani?</AlertDialogTitle>
            <AlertDialogDescription>
              Vani will resume automated follow-up reminders and message handling for {patient.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch({ type: "RETURN_TO_VANI", caseId: c.id });
                toast.success("Returned to Vani", {
                  description: "Automated reminders have resumed for this patient.",
                });
                setReturnToVaniOpen(false);
              }}
            >
              Return to Vani
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <RecordVisitDialog c={c} open={recordVisitOpen} onOpenChange={setRecordVisitOpen} />
      <EscalateDoctorDialog c={c} open={escalateOpen} onOpenChange={setEscalateOpen} />
      <CloseDialog c={c} open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}

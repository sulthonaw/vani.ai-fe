import type {
  CaseStatus,
  ClosureType,
  ConsentLevel,
  ConversationStatus,
  DemoAccount,
  Priority,
  ReasonCode,
  Role,
} from "../types";

export const FACILITY = {
  name: "Riverside Community Health Center",
  short: "Riverside CHC",
  rulePack: "Public Health Insurance (demo rule pack)",
};

export const ACCOUNTS: DemoAccount[] = [
  { id: "rina", name: "Nurse Rina", role: "coordinator", initials: "RN", title: "Care Coordinator", avatar: "/images/avatars/nurse.png" },
  { id: "dewi", name: "Nurse Dewi", role: "coordinator", initials: "DW", title: "Care Coordinator", avatar: "/images/avatars/nurse.png" },
  { id: "yoga", name: "Dr. Yoga", role: "doctor", initials: "DY", title: "Doctor", avatar: "/images/avatars/dokter.png" },
  { id: "hadi", name: "Hadi", role: "manager", initials: "HD", title: "Facility Manager", avatar: "/images/avatars/manager.png" },
];

export const ROLE_HOME: Record<Role, string> = {
  coordinator: "/dashboard",
  doctor: "/dashboard",
  manager: "/dashboard/insights",
};

export function getPatientAvatar(patient?: { sex?: "F" | "M"; age?: number } | null): string {
  if (!patient) return "/images/avatars/pasien.png";
  if (patient.sex === "F") return "/images/avatars/pasien-ibu.png";
  if ((patient.age ?? 0) >= 50) return "/images/avatars/pasien-bapak.png";
  return "/images/avatars/pasien.png";
}

export const RULES = {
  createCaseSystolic: 140,
  createCaseDiastolic: 90,
  urgentSystolic: 180,
  urgentDiastolic: 120,
  firstContactDay: 1,
  medsRunningOutDay: 12,
  overdueDay: 15,
  familyAfterNoReplyDays: 3,
  handoverAfterNoReplyDays: 7,
  minConfidence: 0.7,
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "New",
  contacted: "Contacted",
  scheduled: "Scheduled",
  no_show: "No-show",
  visited: "Visited",
  in_treatment: "In treatment",
  controlled: "Controlled",
  closed: "Closed",
};

export const STATUS_ORDER: CaseStatus[] = [
  "new",
  "contacted",
  "scheduled",
  "visited",
  "in_treatment",
  "controlled",
  "closed",
];

export const CONVERSATION_META: Record<
  ConversationStatus,
  { label: string; color: string; soft: string }
> = {
  active: { label: "Active", color: "#22A06B", soft: "#E3F5EC" },
  awaiting: { label: "Awaiting reply", color: "#E5A50A", soft: "#FDF4DC" },
  no_response: { label: "No response", color: "#97A0B7", soft: "#EEF0F5" },
  handed_over: { label: "Handed over", color: "#F07B2B", soft: "#FDEBDD" },
  urgent: { label: "Urgent", color: "#E5484D", soft: "#FCE4E4" },
  idle: { label: "Idle", color: "#C8CFE0", soft: "#F4F6FA" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; rank: number }> = {
  urgent: { label: "Urgent", color: "#E5484D", rank: 0 },
  handed_over: { label: "Handed over", color: "#F07B2B", rank: 1 },
  overdue: { label: "Overdue", color: "#E5A50A", rank: 2 },
  unassigned: { label: "Unassigned", color: "#556A8B", rank: 3 },
  normal: { label: "Normal", color: "#97A0B7", rank: 4 },
};

export const REASON_META: Record<ReasonCode, { label: string; path: string; button: string }> = {
  FEEL_WELL: { label: "Feels healthy", path: "Plain-language risk explanation", button: "I feel fine" },
  NO_TIME: { label: "No time / work hours", path: "Early or weekend slot; family can collect meds", button: "No time / work" },
  OTHER_CLINIC: { label: "Registered at another clinic", path: "Clinic transfer guide → nurse if it fails", button: "Registered at another clinic" },
  FEAR_MEDS: { label: "Worried about medication", path: "Doctor-approved content; offer doctor talk", button: "Worried about the medicine" },
  INSURANCE: { label: "Insurance inactive / unclear", path: "Status check → nurse", button: "Insurance problem" },
  DONT_KNOW_HOW: { label: "Doesn't know how / app error", path: "Step-by-step help → nurse if it fails", button: "Don't know how" },
  NO_ESCORT: { label: "No one to accompany", path: "Involve family (with consent)", button: "No one to take me" },
  OTHER: { label: "Other (free text)", path: "Simulated AI groups it; low confidence → nurse", button: "Something else" },
};

export const REASON_CODES = Object.keys(REASON_META) as ReasonCode[];

export const CONSENT_LABEL: Record<ConsentLevel, string> = {
  schedule: "Schedule only",
  attendance: "Schedule + attendance",
  full: "Schedule, attendance + condition",
};

export const CLOSURE_LABEL: Record<ClosureType, string> = {
  controlled: "Controlled (2 in-target visits)",
  transferred: "Transferred to another facility",
  declined: "Declined after doctor explanation",
  other: "Other (doctor approval)",
};

/** Demo calendar: day 0 = Monday 3 Nov 2026 (UTC) */
const BASE = Date.UTC(2026, 10, 3);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayDate(day: number) {
  return new Date(BASE + day * 86400000);
}

export function formatDay(day: number, withWeekday = true) {
  const d = dayDate(day);
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return withWeekday ? `${DAYS[d.getUTCDay()]}, ${base}` : base;
}

export function weekdayOf(day: number) {
  return DAYS[dayDate(day).getUTCDay()];
}

export function nextWeekday(fromDay: number, weekday: number) {
  for (let i = 1; i <= 7; i++) {
    if (dayDate(fromDay + i).getUTCDay() === weekday) return fromDay + i;
  }
  return fromDay + 1;
}

import type {
  CaseRecord,
  ClosureType,
  DemoState,
  FamilyContact,
  Message,
  Priority,
  ReasonCode,
  Role,
  TimelineEvent,
} from "../types";
import {
  ACCOUNTS,
  FACILITY,
  REASON_CODES,
  REASON_META,
  RULES,
  formatDay,
  nextWeekday,
  weekdayOf,
} from "./constants";
import { classifyFreeText, detectUrgent } from "./simulated-ai";

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function dayCount(c: CaseRecord, today: number) {
  return Math.max(0, today - c.resultDay);
}

export function isOpen(c: CaseRecord) {
  return c.status !== "closed";
}

export function isOverdue(c: CaseRecord, today: number) {
  return isOpen(c) && c.visits === 0 && dayCount(c, today) >= RULES.overdueDay;
}

export function priorityOf(c: CaseRecord, today: number): Priority {
  if (!isOpen(c)) return "normal";
  if (c.conversation === "urgent") return "urgent";
  if (c.conversation === "handed_over") return "handed_over";
  if (isOverdue(c, today)) return "overdue";
  if (!c.coordinatorId) return "unassigned";
  return "normal";
}

export function familyOf(state: DemoState, patientId: string): FamilyContact | undefined {
  return state.families.find((f) => f.patientId === patientId && !f.revoked);
}

export function accountById(id?: string) {
  return ACCOUNTS.find((a) => a.id === id);
}

export function canSeePatients(role: Role) {
  return role !== "manager";
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type Action =
  | { type: "LOAD"; state: DemoState }
  | { type: "RESET"; state: DemoState }
  | { type: "ADVANCE_DAY"; days?: number }
  | { type: "SWITCH_ACCOUNT"; id: string }
  | { type: "OPEN_CASE"; id?: string }
  | { type: "SET_PHONE"; open?: boolean; caseId?: string; tab?: "patient" | "family" }
  | { type: "PATIENT_REPLY"; caseId: string; text: string }
  | { type: "FAMILY_REPLY"; caseId: string; text: string }
  | { type: "STAFF_MESSAGE"; caseId: string; text: string }
  | { type: "TAKE_OVER"; caseId: string }
  | { type: "RETURN_TO_VANI"; caseId: string }
  | { type: "ASSIGN_TO_ME"; caseId: string }
  | { type: "SCHEDULE"; caseId: string; day: number; time: string }
  | { type: "RECORD_VISIT"; caseId: string; inTarget: boolean }
  | { type: "ESCALATE"; caseId: string; note: string }
  | { type: "CLINICAL_DECISION"; caseId: string; note: string; returnToCoordinator: boolean }
  | { type: "CLOSE_CASE"; caseId: string; closure: ClosureType; note: string }
  | { type: "REVOKE_FAMILY"; caseId: string }
  | { type: "MARK_READ"; caseId: string };

/* ------------------------------------------------------------------ */
/* Helpers (mutate a draft copy)                                       */
/* ------------------------------------------------------------------ */

type Draft = DemoState;

function clone(state: DemoState): Draft {
  return {
    ...state,
    cases: state.cases.map((c) => ({ ...c, reasons: [...c.reasons], appointment: c.appointment ? { ...c.appointment } : undefined })),
    families: state.families.map((f) => ({ ...f })),
    messages: [...state.messages],
    timeline: [...state.timeline],
  };
}

function nextId(d: Draft, prefix: string) {
  d.seq += 1;
  return `${prefix}-${d.seq}`;
}

function clockTime(d: Draft) {
  const h = 8 + (d.seq % 10);
  const m = (d.seq * 7) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMessage(d: Draft, m: Omit<Message, "id" | "day" | "time"> & { time?: string }) {
  d.messages.push({ id: nextId(d, "m"), day: d.day, time: m.time ?? clockTime(d), ...m });
}

function addEvent(d: Draft, e: Omit<TimelineEvent, "id" | "day">) {
  d.timeline.push({ id: nextId(d, "t"), day: d.day, ...e });
}

function actorName(d: Draft) {
  return accountById(d.activeAccountId)?.name ?? "Staff";
}

function patientOf(d: Draft, c: CaseRecord) {
  return d.patients.find((p) => p.id === c.patientId)!;
}

function first(d: Draft, c: CaseRecord) {
  return patientOf(d, c).name.split(" ")[0];
}

function pronoun(d: Draft, c: CaseRecord) {
  return patientOf(d, c).sex === "F" ? "her" : "him";
}

function vani(d: Draft, c: CaseRecord, text: string, buttons?: string[], to: "patient" | "family" = "patient") {
  addMessage(d, { caseId: c.id, from: "vani", to, senderName: "Vani", text, buttons });
}

function slotOptions(d: Draft) {
  const tomorrow = d.day + 1;
  const saturday = nextWeekday(d.day, 6);
  const opts = [
    { day: tomorrow, time: "07:30" },
    { day: saturday === tomorrow ? saturday + 7 : saturday, time: "08:00" },
  ];
  return opts.map((o) => ({ ...o, label: `${formatDay(o.day)} · ${o.time}` }));
}

function handover(d: Draft, c: CaseRecord, note: string) {
  c.conversation = "handed_over";
  c.ownerType = "coordinator";
  c.handoverNote = note;
  c.unread = true;
  c.flow = "none";
  const coord = accountById(c.coordinatorId)?.name ?? "the care team (unassigned)";
  addEvent(d, { caseId: c.id, kind: "handover", label: `Handed over to ${coord}: ${note}`, actor: "Vani" });
  vani(d, c, "I'm passing this to our nurse, who will message you here shortly.");
}

function escalateUrgent(d: Draft, c: CaseRecord, terms: string[]) {
  c.conversation = "urgent";
  c.ownerType = "doctor";
  c.escalated = true;
  c.urgentSince = d.day;
  c.unread = true;
  c.flow = "none";
  addEvent(d, { caseId: c.id, kind: "handover", label: `Danger sign detected (rule: ${terms.join(", ")}) → escalated to doctor`, actor: "Rules engine" });
  vani(d, c, "These can be warning signs. Please go to the nearest emergency department now or call your local emergency number. A doctor from our team has been alerted and will call you.");
}

function offerBooking(d: Draft, c: CaseRecord, intro: string, extra: string[] = ["Talk to a nurse"]) {
  c.flow = "book";
  c.conversation = "active";
  vani(d, c, intro, ["Book a visit", ...extra]);
}

function respondToReason(d: Draft, c: CaseRecord, code: ReasonCode, aiNote?: string) {
  const fam = familyOf(d, c.patientId);
  switch (code) {
    case "FEEL_WELL":
      return offerBooking(d, c, "Many people with high blood pressure feel completely fine. That's why a quick check matters: it protects your heart, brain and kidneys. The visit takes about 15 minutes.");
    case "NO_TIME":
      return offerBooking(d, c, "We can see you early (07:30) before work, or on Saturday morning. A family member can also collect your medicine for you.");
    case "OTHER_CLINIC":
      c.flow = "transfer_guide";
      c.conversation = "active";
      return vani(
        d,
        c,
        `You can move your registered clinic to ${FACILITY.short} in your insurance app: 1) Open the app → Profile. 2) Tap "Change clinic". 3) Choose ${FACILITY.short}. Or our front desk can help you on your visit.`,
        ["Done, book a visit", "It didn't work"],
      );
    case "FEAR_MEDS":
      return offerBooking(
        d,
        c,
        "That's a common worry. This medicine is widely used, and we check your kidneys with a simple blood test at follow-up. High blood pressure that isn't treated is itself a common cause of kidney damage. (Content approved by Dr. Yoga)",
        ["Talk to a doctor"],
      );
    case "INSURANCE":
      return handover(d, c, aiNote ?? "Insurance inactive or unclear — needs a status check");
    case "DONT_KNOW_HOW":
      return handover(d, c, aiNote ?? "Needs step-by-step help (app or process)");
    case "NO_ESCORT":
      if (fam) {
        c.flow = "book";
        c.conversation = "active";
        return vani(d, c, `Would you like us to remind ${fam.name} so they can accompany you?`, ["Yes, remind them", "Book a visit"]);
      }
      return offerBooking(d, c, "We can book a time that suits whoever can accompany you. Would you like to choose a time?");
    case "OTHER":
      return handover(d, c, aiNote ?? "Reason unclear — needs a person");
  }
}

function recordReason(d: Draft, c: CaseRecord, code: ReasonCode, source: "button" | "simulated-ai", confidence?: number) {
  c.reasons.push({ code, source, confidence, day: d.day });
  const conf = confidence !== undefined ? ` (Simulated AI · ${Math.round(confidence * 100)}%)` : "";
  addEvent(d, { caseId: c.id, kind: "reason", label: `Reason recorded: ${REASON_META[code].label}${conf}`, actor: source === "button" ? first(d, c) : "Simulated AI" });
}

function familyReminder(d: Draft, c: CaseRecord, fam: FamilyContact, when: string) {
  const name = first(d, c);
  addMessage(d, {
    caseId: c.id,
    from: "vani",
    to: "family",
    senderName: "Vani",
    text: `Hello ${fam.name}, this is a reminder from ${FACILITY.short}. ${name} has a follow-up visit ${when}. Can you help remind or accompany ${pronoun(d, c)}?`,
    buttons: [`I can take ${pronoun(d, c)}`, "I'll remind", "Need to reschedule"],
  });
  addEvent(d, { caseId: c.id, kind: "family", label: `Family reminder sent to ${fam.name}`, actor: "Vani" });
}

function bookVisit(d: Draft, c: CaseRecord, day: number, time: string, by: string) {
  c.appointment = { day, time, status: "booked" };
  if (c.status === "new" || c.status === "contacted" || c.status === "no_show") c.status = "scheduled";
  c.flow = "none";
  c.awaitingSince = undefined;
  addEvent(d, { caseId: c.id, kind: "schedule", label: `Visit scheduled: ${formatDay(day)} at ${time}`, actor: by });
  vani(d, c, `Your visit is booked for ${formatDay(day)} at ${time} at ${FACILITY.short}. I'll remind you the day before. Please bring your ID and any remaining medicine.`);
}

/* ------------------------------------------------------------------ */
/* Patient / family replies                                            */
/* ------------------------------------------------------------------ */

function patientReply(d: Draft, c: CaseRecord, text: string) {
  addMessage(d, { caseId: c.id, from: "patient", senderName: first(d, c), text });
  c.awaitingSince = undefined;

  if (c.takeoverBy || c.conversation === "handed_over") {
    c.unread = true;
    return;
  }

  const urgent = detectUrgent(text);
  if (urgent.length) return escalateUrgent(d, c, urgent);

  const t = text.trim().toLowerCase();
  const slots = slotOptions(d);
  const slot = slots.find((s) => s.label.toLowerCase() === t);
  if (slot) return bookVisit(d, c, slot.day, slot.time, "Vani (patient choice)");

  if (["yes, book a visit", "book a visit", "done, book a visit"].includes(t)) {
    c.flow = "slots";
    c.conversation = "active";
    return vani(d, c, "Here are the next available times:", slots.map((s) => s.label));
  }
  if (t === "i have a question" || t === "talk to a nurse") return handover(d, c, "Patient asked to talk to a person");
  if (t === "talk to a doctor") {
    c.escalated = true;
    return handover(d, c, "Patient asked to talk to a doctor about medication");
  }
  if (t === "it didn't work") return handover(d, c, "Clinic transfer guide did not work");
  if (t === "yes, remind them") {
    const fam = familyOf(d, c.patientId);
    if (fam) {
      familyReminder(d, c, fam, "soon");
      c.familyContacted = true;
    }
    return offerBooking(d, c, "Done. Shall we pick a time now?", []);
  }
  if (t === "something else") {
    c.flow = "reason";
    c.conversation = "awaiting";
    c.awaitingSince = d.day;
    return vani(d, c, "Tell me in your own words what's making it hard. A nurse will read this too.");
  }

  const buttonCode = REASON_CODES.find((code) => REASON_META[code].button.toLowerCase() === t);
  if (buttonCode) {
    recordReason(d, c, buttonCode, "button");
    return respondToReason(d, c, buttonCode);
  }

  // Free text → simulated AI
  const ai = classifyFreeText(text);
  recordReason(d, c, ai.reason, "simulated-ai", ai.confidence);
  const pct = Math.round(ai.confidence * 100);
  if (ai.confidence < RULES.minConfidence) {
    return handover(d, c, `Simulated AI unsure (${pct}%) — needs a person`);
  }
  return respondToReason(d, c, ai.reason, `Simulated AI: ${REASON_META[ai.reason].label} (${pct}%) — needs a person`);
}

function familyReply(d: Draft, c: CaseRecord, text: string) {
  const fam = familyOf(d, c.patientId);
  addMessage(d, { caseId: c.id, from: "family", senderName: fam?.name ?? "Family", text });
  const t = text.toLowerCase();
  if (t.startsWith("i can take")) {
    addEvent(d, { caseId: c.id, kind: "family", label: `${fam?.name ?? "Family"} will accompany ${first(d, c)}`, actor: fam?.name ?? "Family" });
    vani(d, c, `Thank you, ${fam?.name ?? ""}! We'll see you both then.`, undefined, "family");
  } else if (t.startsWith("i'll remind")) {
    addEvent(d, { caseId: c.id, kind: "family", label: `${fam?.name ?? "Family"} will remind ${first(d, c)}`, actor: fam?.name ?? "Family" });
    vani(d, c, "Thank you for your help!", undefined, "family");
  } else if (t.startsWith("need to reschedule")) {
    addEvent(d, { caseId: c.id, kind: "family", label: "Family asked to reschedule", actor: fam?.name ?? "Family" });
    if (!c.takeoverBy) handover(d, c, "Family asked to reschedule");
  } else {
    c.unread = true;
    addEvent(d, { caseId: c.id, kind: "family", label: `Message from ${fam?.name ?? "family"}`, actor: fam?.name ?? "Family" });
  }
}

/* ------------------------------------------------------------------ */
/* Daily rules engine                                                  */
/* ------------------------------------------------------------------ */

function runDay(d: Draft) {
  const D = d.day;
  d.cases.forEach((c) => {
    if (!isOpen(c) || c.takeoverBy || c.conversation === "urgent" || c.conversation === "handed_over") return;
    const dc = D - c.resultDay;
    const name = first(d, c);
    const fam = familyOf(d, c.patientId);

    if (c.status === "new" && dc >= RULES.firstContactDay) {
      c.status = "contacted";
      c.conversation = "active";
      vani(d, c, `Hi ${name}, this is Vani, the digital assistant of ${FACILITY.short}. Your recent health check needs a follow-up visit. Can we help you plan it?`, ["Yes, book a visit", "I have a question"]);
      addEvent(d, { caseId: c.id, kind: "message", label: "First contact sent by Vani", actor: "Vani" });
      return;
    }

    if (c.visits === 0 && c.status === "contacted" && !c.appointment && dc === RULES.medsRunningOutDay) {
      vani(d, c, `Hi ${name}, your 15-day medicine will run out in about 3 days. Shall we book your follow-up visit?`, ["Yes, book a visit", "I have a question"]);
      addEvent(d, { caseId: c.id, kind: "message", label: "Reminder: medicine running out (day 12)", actor: "Vani" });
    }

    if (c.visits === 0 && c.status === "contacted" && !c.appointment && dc === RULES.overdueDay) {
      c.conversation = "awaiting";
      c.awaitingSince = D;
      c.flow = "reason";
      vani(d, c, `Hi ${name}, we haven't seen you for your follow-up yet. Is something making it hard to come?`, [
        "I feel fine",
        "No time / work",
        "Registered at another clinic",
        "Worried about the medicine",
        "No one to take me",
        "Something else",
      ]);
      addEvent(d, { caseId: c.id, kind: "message", label: "Overdue (day 15) → Vani asked for the reason", actor: "Rules engine" });
    }

    const appt = c.appointment;
    if (appt && appt.status === "booked") {
      if (appt.day === D + 1) {
        vani(d, c, `Reminder: your visit is tomorrow, ${formatDay(appt.day)}, at ${appt.time}.`);
        if (fam) familyReminder(d, c, fam, `tomorrow (${weekdayOf(appt.day)}) at ${appt.time}`);
      } else if (appt.day === D) {
        vani(d, c, `Good morning ${name}! See you today at ${appt.time}. Please bring your ID and remaining medicine.`);
        if (fam) addMessage(d, { caseId: c.id, from: "vani", to: "family", senderName: "Vani", text: `Good morning ${fam.name}, ${name}'s visit is today at ${appt.time}.` });
      } else if (appt.day < D) {
        appt.status = "missed";
        c.status = "no_show";
        c.conversation = "awaiting";
        c.awaitingSince = D;
        c.flow = "reason";
        addEvent(d, { caseId: c.id, kind: "visit", label: "No-show: visit was missed", actor: "Rules engine" });
        vani(d, c, `Hi ${name}, we missed you at your visit. Is something making it hard to come?`, ["No time / work", "No one to take me", "I feel fine", "Something else"]);
      }
    }

    if ((c.conversation === "awaiting" || c.conversation === "no_response") && c.awaitingSince !== undefined) {
      const since = D - c.awaitingSince;
      if (since >= RULES.handoverAfterNoReplyDays) {
        handover(d, c, `No response for ${since} days`);
      } else if (since >= RULES.familyAfterNoReplyDays && fam && !c.familyContacted) {
        c.familyContacted = true;
        c.conversation = "no_response";
        addMessage(d, {
          caseId: c.id,
          from: "vani",
          to: "family",
          senderName: "Vani",
          text: `Hello ${fam.name}, this is Vani from ${FACILITY.short}. ${name} has a follow-up visit we haven't been able to arrange. Could you help remind ${pronoun(d, c)}?`,
          buttons: ["I'll remind", `I can take ${pronoun(d, c)}`, "Need to reschedule"],
        });
        addEvent(d, { caseId: c.id, kind: "family", label: `No reply for ${since} days → family contacted (${fam.name})`, actor: "Rules engine" });
      } else if (since >= RULES.familyAfterNoReplyDays && c.conversation === "awaiting") {
        c.conversation = "no_response";
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "LOAD":
    case "RESET":
      return action.state;
    case "SWITCH_ACCOUNT":
      return { ...state, activeAccountId: action.id, openCaseId: accountById(action.id)?.role === "manager" ? undefined : state.openCaseId };
    case "OPEN_CASE":
      return {
        ...state,
        openCaseId: action.id,
        cases: action.id ? state.cases.map((c) => (c.id === action.id ? { ...c, unread: false } : c)) : state.cases,
      };
    case "SET_PHONE":
      return {
        ...state,
        phoneOpen: action.open ?? state.phoneOpen,
        phoneCaseId: action.caseId ?? state.phoneCaseId,
        phoneTab: action.tab ?? state.phoneTab,
      };
    case "MARK_READ":
      return { ...state, cases: state.cases.map((c) => (c.id === action.caseId ? { ...c, unread: false } : c)) };
  }

  const d = clone(state);

  if (action.type === "ADVANCE_DAY") {
    const n = action.days ?? 1;
    for (let i = 0; i < n; i++) {
      d.day += 1;
      runDay(d);
    }
    return d;
  }

  const c = d.cases.find((x) => x.id === action.caseId);
  if (!c) return state;
  const actor = actorName(d);
  const account = accountById(d.activeAccountId);

  switch (action.type) {
    case "PATIENT_REPLY":
      patientReply(d, c, action.text);
      break;
    case "FAMILY_REPLY":
      familyReply(d, c, action.text);
      break;
    case "STAFF_MESSAGE":
      addMessage(d, { caseId: c.id, from: "staff", to: "patient", senderName: actor, text: action.text });
      break;
    case "TAKE_OVER":
      c.takeoverBy = d.activeAccountId;
      c.ownerType = account?.role === "doctor" ? "doctor" : "coordinator";
      if (!c.coordinatorId && account?.role === "coordinator") c.coordinatorId = account.id;
      if (c.conversation !== "urgent") c.conversation = "handed_over";
      c.unread = false;
      c.flow = "none";
      addEvent(d, { caseId: c.id, kind: "handover", label: `${actor} took over the conversation · Vani paused`, actor });
      break;
    case "RETURN_TO_VANI":
      c.takeoverBy = undefined;
      c.ownerType = "vani";
      c.handoverNote = undefined;
      c.escalated = false;
      c.urgentSince = undefined;
      c.unread = false;
      c.conversation = c.appointment?.status === "booked" || c.visits > 0 ? "active" : "awaiting";
      if (c.conversation === "awaiting") c.awaitingSince = d.day;
      addEvent(d, { caseId: c.id, kind: "handover", label: "Returned to Vani · reminders resumed", actor });
      break;
    case "ASSIGN_TO_ME":
      c.coordinatorId = d.activeAccountId;
      addEvent(d, { caseId: c.id, kind: "system", label: `Assigned to ${actor}`, actor });
      break;
    case "SCHEDULE":
      bookVisit(d, c, action.day, action.time, actor);
      break;
    case "RECORD_VISIT": {
      if (c.appointment) c.appointment.status = "attended";
      c.visits += 1;
      if (action.inTarget) c.visitsInTarget += 1;
      addEvent(d, { caseId: c.id, kind: "visit", label: `Visit recorded · BP ${action.inTarget ? "in target" : "above target"}`, actor });
      c.status = c.visitsInTarget >= 2 ? "controlled" : "in_treatment";
      addEvent(d, { caseId: c.id, kind: "system", label: `Status → ${c.status === "controlled" ? "Controlled" : "In treatment"}`, actor: "Rules engine" });
      c.conversation = "idle";
      c.takeoverBy = undefined;
      c.ownerType = "vani";
      c.handoverNote = undefined;
      c.flow = "none";
      c.appointment = undefined;
      break;
    }
    case "ESCALATE":
      c.escalated = true;
      if (c.conversation !== "urgent") c.conversation = "handed_over";
      c.handoverNote = action.note || "Escalated for clinical review";
      addEvent(d, { caseId: c.id, kind: "clinical", label: `Escalated to doctor: ${c.handoverNote}`, actor });
      break;
    case "CLINICAL_DECISION":
      addEvent(d, { caseId: c.id, kind: "clinical", label: `Clinical decision: ${action.note}`, actor });
      if (action.returnToCoordinator) {
        c.escalated = false;
        c.urgentSince = undefined;
        c.ownerType = "coordinator";
        c.conversation = "handed_over";
        c.handoverNote = `Doctor note: ${action.note}`;
        addEvent(d, { caseId: c.id, kind: "handover", label: "Returned to care coordinator", actor });
      }
      break;
    case "CLOSE_CASE":
      c.status = "closed";
      c.conversation = "idle";
      c.takeoverBy = undefined;
      c.escalated = false;
      c.closure = { type: action.closure, note: action.note, by: actor, day: d.day };
      addEvent(d, { caseId: c.id, kind: "closure", label: `Case closed with evidence: ${action.closure} — ${action.note}`, actor });
      break;
    case "REVOKE_FAMILY": {
      const fam = d.families.find((f) => f.patientId === c.patientId && !f.revoked);
      if (fam) {
        fam.revoked = true;
        addEvent(d, { caseId: c.id, kind: "family", label: `Family access revoked (${fam.name})`, actor });
      }
      break;
    }
  }
  return d;
}

export function canClose(c: CaseRecord, type: ClosureType, note: string, role: Role) {
  if (note.trim().length < 5) return "Add a note (min. 5 characters).";
  if (type === "controlled" && c.visitsInTarget < 2) return "Needs 2 recorded in-target visits.";
  if (type === "other" && role !== "doctor") return "Requires doctor approval (switch to Dr. Yoga).";
  return null;
}

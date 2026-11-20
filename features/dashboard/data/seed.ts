import type {
  CaseRecord,
  CaseStatus,
  ClosureType,
  ConversationStatus,
  DemoState,
  FamilyContact,
  Message,
  Patient,
  ReasonCode,
  TimelineEvent,
} from "../types";
import { FACILITY, REASON_META } from "../logic/constants";

/** Demo "today": day 17 = Thu 20 Nov 2026 */
export const START_DAY = 17;
export const STATE_VERSION = 4;

type Spec = {
  name: string;
  age: number;
  sex: "F" | "M";
  area: Patient["area"];
  bp: [number, number];
  daysAgo: number;
  status: CaseStatus;
  conv: ConversationStatus;
  coord?: "rina" | "dewi";
  reason?: ReasonCode;
  awaitingDays?: number;
  owner?: CaseRecord["ownerType"];
  takeover?: "rina" | "dewi";
  visits?: number;
  inTarget?: number;
  apptIn?: number;
  closure?: ClosureType;
  family?: { name: string; relation: string; level: FamilyContact["consentLevel"]; contacted?: boolean };
  note?: string;
  urgentText?: string;
  insurance?: "active" | "inactive";
  otherClinic?: boolean;
};

const SPECS: Spec[] = [
  { name: "Andi Pratama", age: 38, sex: "M", area: "North", bp: [160, 100], daysAgo: 10, status: "contacted", conv: "active", coord: "rina", otherClinic: true, family: { name: "Sari", relation: "Wife", level: "schedule" } },
  { name: "Lastri Wahyuni", age: 57, sex: "F", area: "East", bp: [186, 112], daysAgo: 3, status: "contacted", conv: "urgent", coord: "rina", owner: "doctor", urgentText: "My head hurts badly since this morning and I have blurred vision." },
  { name: "Siti Rahma", age: 49, sex: "F", area: "South", bp: [150, 95], daysAgo: 9, status: "contacted", conv: "awaiting", coord: "rina", awaitingDays: 2 },
  { name: "Budi Santoso", age: 62, sex: "M", area: "West", bp: [148, 92], daysAgo: 6, status: "scheduled", conv: "active", coord: "dewi", apptIn: 2, reason: "NO_ESCORT", family: { name: "Ani", relation: "Daughter", level: "attendance" } },
  { name: "Wati Lestari", age: 54, sex: "F", area: "North", bp: [152, 96], daysAgo: 41, status: "closed", conv: "idle", coord: "rina", visits: 2, inTarget: 2, closure: "controlled", reason: "FEEL_WELL" },
  { name: "Joko Susilo", age: 45, sex: "M", area: "East", bp: [158, 98], daysAgo: 5, status: "contacted", conv: "active", coord: "dewi" },
  { name: "Rudi Hartono", age: 41, sex: "M", area: "South", bp: [146, 94], daysAgo: 8, status: "contacted", conv: "awaiting", coord: "dewi", awaitingDays: 1 },
  { name: "Maya Anggraini", age: 36, sex: "F", area: "West", bp: [144, 91], daysAgo: 16, status: "contacted", conv: "handed_over", coord: "rina", owner: "coordinator", reason: "INSURANCE", insurance: "inactive", note: "Insurance inactive — needs a status check with the patient." },
  { name: "Hendra Gunawan", age: 52, sex: "M", area: "North", bp: [162, 101], daysAgo: 18, status: "no_show", conv: "no_response", coord: "dewi", awaitingDays: 4, family: { name: "Lina", relation: "Wife", level: "attendance", contacted: true } },
  { name: "Putri Ayuningtyas", age: 33, sex: "F", area: "East", bp: [141, 90], daysAgo: 0, status: "new", conv: "idle" },
  { name: "Agus Salim", age: 60, sex: "M", area: "South", bp: [170, 104], daysAgo: 20, status: "contacted", conv: "handed_over", coord: "dewi", owner: "coordinator", takeover: "dewi", reason: "FEAR_MEDS", note: "Afraid medicine damages kidneys — wants to talk to a doctor." },
  { name: "Rini Kusuma", age: 47, sex: "F", area: "West", bp: [149, 93], daysAgo: 4, status: "contacted", conv: "active", coord: "rina" },
  { name: "Bayu Saputra", age: 39, sex: "M", area: "North", bp: [155, 97], daysAgo: 12, status: "contacted", conv: "awaiting", awaitingDays: 2 },
  { name: "Nur Aini", age: 58, sex: "F", area: "East", bp: [147, 92], daysAgo: 25, status: "in_treatment", conv: "idle", coord: "rina", visits: 1, reason: "NO_TIME" },
  { name: "Yusuf Hidayat", age: 64, sex: "M", area: "South", bp: [165, 99], daysAgo: 30, status: "in_treatment", conv: "idle", coord: "dewi", visits: 2, inTarget: 1, reason: "FEEL_WELL" },
  { name: "Ratna Dewanti", age: 51, sex: "F", area: "West", bp: [143, 90], daysAgo: 35, status: "controlled", conv: "idle", coord: "rina", visits: 2, inTarget: 2, reason: "FEAR_MEDS" },
  { name: "Tono Wijaya", age: 55, sex: "M", area: "North", bp: [151, 95], daysAgo: 22, status: "visited", conv: "idle", coord: "dewi", visits: 1, reason: "OTHER_CLINIC" },
  { name: "Sri Handayani", age: 61, sex: "F", area: "East", bp: [159, 96], daysAgo: 28, status: "closed", conv: "idle", coord: "dewi", closure: "transferred", reason: "OTHER_CLINIC" },
  { name: "Eko Prasetyo", age: 44, sex: "M", area: "South", bp: [145, 91], daysAgo: 7, status: "scheduled", conv: "active", coord: "rina", apptIn: 1, reason: "NO_TIME" },
  { name: "Fitri Handini", age: 37, sex: "F", area: "West", bp: [150, 94], daysAgo: 11, status: "contacted", conv: "active", coord: "dewi" },
  { name: "Dimas Ardian", age: 42, sex: "M", area: "North", bp: [168, 103], daysAgo: 14, status: "contacted", conv: "awaiting", coord: "rina", awaitingDays: 3 },
  { name: "Ayu Lestari", age: 35, sex: "F", area: "East", bp: [142, 92], daysAgo: 1, status: "new", conv: "idle" },
  { name: "Slamet Riyadi", age: 66, sex: "M", area: "South", bp: [172, 106], daysAgo: 19, status: "no_show", conv: "awaiting", coord: "rina", awaitingDays: 1, reason: "NO_ESCORT" },
  { name: "Wulan Sari", age: 46, sex: "F", area: "West", bp: [148, 90], daysAgo: 26, status: "in_treatment", conv: "idle", coord: "rina", visits: 1, reason: "NO_TIME" },
  { name: "Fajar Nugroho", age: 50, sex: "M", area: "North", bp: [157, 99], daysAgo: 9, status: "contacted", conv: "active", coord: "dewi" },
  { name: "Indah Permata", age: 43, sex: "F", area: "East", bp: [146, 93], daysAgo: 23, status: "visited", conv: "idle", coord: "rina", visits: 1, reason: "FEEL_WELL" },
  { name: "Hari Setiawan", age: 59, sex: "M", area: "South", bp: [163, 100], daysAgo: 32, status: "closed", conv: "idle", coord: "rina", visits: 2, inTarget: 2, closure: "controlled", reason: "NO_ESCORT" },
  { name: "Mega Utami", age: 40, sex: "F", area: "West", bp: [149, 95], daysAgo: 13, status: "contacted", conv: "active", coord: "rina" },
  { name: "Rizal Firmansyah", age: 48, sex: "M", area: "North", bp: [154, 96], daysAgo: 17, status: "contacted", conv: "handed_over", coord: "dewi", owner: "coordinator", reason: "DONT_KNOW_HOW", note: "Could not book through the app — needs a call." },
  { name: "Tuti Marlina", age: 63, sex: "F", area: "East", bp: [161, 98], daysAgo: 27, status: "in_treatment", conv: "idle", coord: "dewi", visits: 1, reason: "FEEL_WELL" },
  { name: "Arif Rahman", age: 53, sex: "M", area: "South", bp: [147, 91], daysAgo: 15, status: "contacted", conv: "awaiting", coord: "rina", awaitingDays: 1, reason: "FEEL_WELL" },
  { name: "Nina Kartika", age: 39, sex: "F", area: "West", bp: [145, 92], daysAgo: 21, status: "scheduled", conv: "active", coord: "dewi", apptIn: 3, reason: "NO_TIME" },
  { name: "Gilang Ramadhan", age: 46, sex: "M", area: "West", bp: [150, 97], daysAgo: 24, status: "closed", conv: "idle", coord: "dewi", closure: "declined", reason: "FEAR_MEDS" },
  { name: "Sinta Maharani", age: 34, sex: "F", area: "North", bp: [143, 91], daysAgo: 5, status: "contacted", conv: "active", coord: "rina" },
];

const COORD_NAME = { rina: "Nurse Rina", dewi: "Nurse Dewi" };

export function firstName(full: string) {
  return full.split(" ")[0];
}

export function createSeedState(): DemoState {
  const patients: Patient[] = [];
  const families: FamilyContact[] = [];
  const cases: CaseRecord[] = [];
  const messages: Message[] = [];
  const timeline: TimelineEvent[] = [];
  let seq = 1;
  const id = (p: string) => `${p}-${seq++}`;

  const msg = (m: Omit<Message, "id">) => messages.push({ id: id("m"), ...m });
  const ev = (e: Omit<TimelineEvent, "id">) => timeline.push({ id: id("t"), ...e });

  SPECS.forEach((s, i) => {
    const pid = `p${i + 1}`;
    const cid = `c${i + 1}`;
    const first = firstName(s.name);
    const resultDay = START_DAY - s.daysAgo;

    patients.push({
      id: pid,
      name: s.name,
      age: s.age,
      sex: s.sex,
      area: s.area,
      registeredClinic: s.otherClinic ? "Hillside Clinic (another district)" : FACILITY.short,
      insuranceStatus: s.insurance ?? "active",
    });

    if (s.family) {
      families.push({
        id: `f${i + 1}`,
        patientId: pid,
        name: s.family.name,
        relation: s.family.relation,
        consentLevel: s.family.level,
        consentDay: resultDay + 1,
        revoked: false,
      });
    }

    const owner = s.owner ?? (s.takeover ? "coordinator" : "vani");
    const c: CaseRecord = {
      id: cid,
      patientId: pid,
      systolic: s.bp[0],
      diastolic: s.bp[1],
      resultDay,
      status: s.status,
      conversation: s.conv,
      ownerType: owner,
      coordinatorId: s.coord,
      takeoverBy: s.takeover,
      reasons: s.reason ? [{ code: s.reason, source: "button", day: Math.min(START_DAY, resultDay + 9) }] : [],
      appointment: s.apptIn ? { day: START_DAY + s.apptIn, time: "08:00", status: "booked" } : undefined,
      visits: s.visits ?? 0,
      visitsInTarget: s.inTarget ?? 0,
      awaitingSince: s.awaitingDays !== undefined ? START_DAY - s.awaitingDays : undefined,
      familyContacted: !!s.family?.contacted,
      escalated: s.conv === "urgent",
      urgentSince: s.conv === "urgent" ? START_DAY : undefined,
      handoverNote: s.note,
      flow: s.conv === "awaiting" && s.status === "no_show" ? "reason" : "none",
      unread: s.conv === "urgent" || s.conv === "handed_over",
    };
    cases.push(c);

    // ---- history ----
    ev({ caseId: cid, kind: "result", label: `Screening result received: BP ${s.bp[0]}/${s.bp[1]}`, actor: "Community screening", day: resultDay });
    ev({ caseId: cid, kind: "system", label: "Case created · owner: Vani", actor: "Rules engine", day: resultDay });

    if (s.status === "new") return;

    const contactDay = resultDay + 1;
    msg({
      caseId: cid, from: "vani", to: "patient", senderName: "Vani", day: contactDay, time: "09:00",
      text: `Hi ${first}, this is Vani, the digital assistant of ${FACILITY.short}. Your recent health check needs a follow-up visit. Medication for the first 15 days is ready at the clinic. Can we help you plan the visit?`,
      buttons: ["Yes, book a visit", "I have a question"],
    });
    ev({ caseId: cid, kind: "message", label: "First contact sent by Vani", actor: "Vani", day: contactDay });

    if (s.family) {
      ev({ caseId: cid, kind: "family", label: `Family consent recorded: ${s.family.name} (${s.family.relation}) · ${s.family.level}`, actor: first, day: contactDay });
    }

    if (s.name.startsWith("Andi")) {
      msg({ caseId: cid, from: "patient", senderName: first, day: contactDay, time: "12:14", text: "Ok, I picked up the medicine. Thanks." });
      msg({ caseId: cid, from: "vani", to: "patient", senderName: "Vani", day: contactDay, time: "12:15", text: "Great. Please take it every morning. I'll remind you before it runs out." });
    }

    if (s.reason) {
      const rDay = Math.min(START_DAY, resultDay + 9);
      msg({
        caseId: cid, from: "vani", to: "patient", senderName: "Vani", day: rDay, time: "09:00",
        text: `Hi ${first}, we haven't seen you for your follow-up yet. Is something making it hard to come?`,
      });
      msg({ caseId: cid, from: "patient", senderName: first, day: rDay, time: "10:32", text: REASON_META[s.reason].button });
      ev({ caseId: cid, kind: "reason", label: `Reason recorded: ${REASON_META[s.reason].label}`, actor: first, day: rDay });
    }

    if (s.conv === "awaiting" || s.conv === "no_response") {
      const aDay = START_DAY - (s.awaitingDays ?? 1);
      msg({
        caseId: cid, from: "vani", to: "patient", senderName: "Vani", day: aDay, time: "09:00",
        text: `Hi ${first}, just checking in. Is something making it hard to come for your follow-up?`,
        buttons: ["I feel fine", "No time / work", "Registered at another clinic", "Worried about the medicine", "Something else"],
      });
      ev({ caseId: cid, kind: "message", label: "Vani asked for the reason", actor: "Vani", day: aDay });
    }

    if (s.family?.contacted) {
      msg({
        caseId: cid, from: "vani", to: "family", senderName: "Vani", day: START_DAY - 1, time: "09:00",
        text: `Hello ${s.family.name}, this is Vani from ${FACILITY.short}. ${first} has a follow-up visit we haven't been able to arrange. Could you help remind him?`,
        buttons: ["I'll remind", "I can take him", "Need to reschedule"],
      });
      ev({ caseId: cid, kind: "family", label: `Family contacted: ${s.family.name}`, actor: "Vani", day: START_DAY - 1 });
    }

    if (s.urgentText) {
      msg({ caseId: cid, from: "patient", senderName: first, day: START_DAY, time: "07:42", text: s.urgentText });
      msg({
        caseId: cid, from: "vani", to: "patient", senderName: "Vani", day: START_DAY, time: "07:42",
        text: "These can be warning signs. Please go to the nearest emergency department now or call your local emergency number. A doctor from our team has been alerted and will call you.",
      });
      ev({ caseId: cid, kind: "handover", label: "Danger sign detected (rule) → escalated to doctor", actor: "Rules engine", day: START_DAY });
    }

    if (s.conv === "handed_over") {
      ev({ caseId: cid, kind: "handover", label: `Handed over to ${COORD_NAME[s.coord ?? "rina"]}: ${s.note ?? ""}`, actor: "Vani", day: START_DAY - 1 });
      if (s.takeover) {
        ev({ caseId: cid, kind: "handover", label: `${COORD_NAME[s.takeover]} took over the conversation`, actor: COORD_NAME[s.takeover], day: START_DAY - 1 });
        msg({ caseId: cid, from: "staff", to: "patient", senderName: COORD_NAME[s.takeover], day: START_DAY - 1, time: "14:05", text: `Hi ${first}, I'm ${COORD_NAME[s.takeover]}. I understand the worry about your kidneys. Would you like a short call with our doctor this week?` });
      }
    }

    if (s.apptIn) {
      ev({ caseId: cid, kind: "schedule", label: `Visit scheduled for day ${START_DAY + s.apptIn} at 08:00`, actor: s.coord ? COORD_NAME[s.coord] : "Vani", day: START_DAY - 1 });
    }

    for (let v = 0; v < (s.visits ?? 0); v++) {
      const isLast = v === (s.visits ?? 0) - 1;
      // Spread the latest visit of open cases over the past week so "Returns per day" has data.
      const vDay =
        isLast && !s.closure
          ? Math.max(resultDay + 3, START_DAY - 1 - ((i * 2) % 7))
          : Math.min(START_DAY - 1, resultDay + 8 + v * 12);
      ev({ caseId: cid, kind: "visit", label: `Visit recorded · BP ${v < (s.inTarget ?? 0) ? "in target" : "above target"}`, actor: s.coord ? COORD_NAME[s.coord] : "Clinic", day: vDay });
    }

    if (s.closure) {
      const cDay = Math.min(START_DAY - 1, resultDay + 30);
      c.closure = { type: s.closure, note: s.closure === "controlled" ? "Two visits in target." : s.closure === "transferred" ? "Moved to Hillside Clinic; care confirmed by phone." : "Declined medication after doctor explanation.", by: s.coord ? COORD_NAME[s.coord] : "Dr. Yoga", day: cDay };
      ev({ caseId: cid, kind: "closure", label: `Case closed with evidence: ${s.closure}`, actor: c.closure.by, day: cDay });
    }
  });

  const andi = cases[0];
  return {
    version: STATE_VERSION,
    day: START_DAY,
    activeAccountId: "rina",
    patients,
    families,
    cases,
    messages,
    timeline,
    openCaseId: undefined,
    phoneOpen: false,
    phoneCaseId: andi.id,
    phoneTab: "patient",
    seq,
  };
}

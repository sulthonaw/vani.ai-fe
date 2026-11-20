import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  Check,
  ClipboardCheck,
  Clock,
  Command,
  EyeOff,
  FileCheck2,
  Hand,
  ListChecks,
  Lock,
  MessageCircleQuestion,
  Minus,
  ScrollText,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { CaseMock, ChatMock, FamilyMock, MapMock } from "./landing-mocks";

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

function Label({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-md bg-[#EEF1F6] px-2 py-1 text-xs font-semibold text-[#294167]">{children}</span>;
}

function Heading({ first, second, center = false }: { first: string; second: string; center?: boolean }) {
  return (
    <h2 className={`mt-4 text-3xl font-semibold tracking-[-0.025em] sm:text-[40px] sm:leading-[1.1] ${center ? "text-center" : ""}`}>
      <span className="block text-[#061224]">{first}</span>
      <span className="block text-[#8A94A9]">{second}</span>
    </h2>
  );
}

function Point({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F1F3F7] text-[#294167] [&_svg]:size-4">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-[#061224]">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-[#556A8B]">{text}</span>
      </span>
    </li>
  );
}

function FeatureRow({
  id,
  label,
  first,
  second,
  text,
  points,
  mock,
  reverse = false,
  tinted = false,
}: {
  id?: string;
  label: string;
  first: string;
  second: string;
  text: string;
  points: { icon: React.ReactNode; title: string; text: string }[];
  mock: React.ReactNode;
  reverse?: boolean;
  tinted?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 sm:py-28 ${tinted ? "bg-[#F7F8FA]" : "bg-white"}`}>
      <div className={`mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8`}>
        <div className={reverse ? "lg:order-2" : ""}>
          <Label>{label}</Label>
          <Heading first={first} second={second} />
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#556A8B]">{text}</p>
          <ul className="mt-8 space-y-5">
            {points.map((p) => (
              <Point key={p.title} {...p} />
            ))}
          </ul>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{mock}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 1. The gap (numbers)                                                */
/* ------------------------------------------------------------------ */

export function GapSection() {
  const stats = [
    { v: "109.3M", l: "people joined free health checks (CKG) in Indonesia" },
    { v: "35.4%", l: "of people with high blood pressure came back for a check" },
    { v: "4.2%", l: "of adults with high blood pressure have it under control" },
    { v: "0", l: "national figures on how many abnormal results were closed" },
  ];
  return (
    <section className="bg-white pt-4 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-[#556A8B]">Screening finds the problem. Then the trail goes cold.</p>
        <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-xl border border-[#E8EBF1] lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.v} className={`px-6 py-6 ${i % 2 ? "border-l" : ""} ${i > 0 ? "lg:border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} border-[#EEF0F4]`}>
              <p className="text-3xl font-semibold tracking-[-0.03em] text-[#061224]">{s.v}</p>
              <p className="mt-1 text-sm leading-snug text-[#556A8B]">{s.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-[#97A0B7]">Sources: Ministry of Health Indonesia (2026), Muharram et al., BMJ Open (2025), Aisyah et al., Nature Communications (2026).</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2–4. Feature rows                                                   */
/* ------------------------------------------------------------------ */

export function FeatureSections() {
  return (
    <div id="product">
      <FeatureRow
        label="Case ownership"
        first="Every result has an owner."
        second="Until it is closed."
        text="An abnormal result becomes a case with a clear owner: Vani, a care coordinator or a doctor. The team sees who is late, who is stuck and who is waiting, without searching three apps."
        points={[
          { icon: <UserCheck />, title: "One owner at every step", text: "Hand-overs move the case to a named person, never to no one." },
          { icon: <Clock />, title: "Late cases surface by themselves", text: "No visit by day 15? The case is flagged and Vani asks why." },
          { icon: <ClipboardCheck />, title: "Closed only with evidence", text: "Two in-target visits, a transfer note or a doctor decision. Nothing closes silently." },
        ]}
        mock={<CaseMock />}
      />
      <FeatureRow
        tinted
        reverse
        label="Vani agent"
        first="Vani asks why."
        second="Then helps with the reason."
        text="Reminders alone do not bring people back. Vani asks what is in the way and answers that barrier: feeling fine, no time, the wrong clinic, fear of the medicine or an insurance problem."
        points={[
          { icon: <MessageCircleQuestion />, title: "Reasons, not just reminders", text: "Eight common barriers, each with its own next step." },
          { icon: <Hand />, title: "A person when it matters", text: "Low confidence, danger signs or a stuck process go to staff at once." },
          { icon: <BellRing />, title: "Staff can reply any time", text: "Type in the same WhatsApp thread. Vani pauses until you hand it back." },
        ]}
        mock={<ChatMock />}
      />
      <FeatureRow
        label="Family"
        first="Family can help."
        second="Only with consent."
        text="Many patients need a lift, a reminder or someone to explain. With the patient's consent, Vani can include one family member, at the level the patient chooses."
        points={[
          { icon: <Users />, title: "The patient decides", text: "Schedule only, attendance, or condition. Revoke at any time." },
          { icon: <BellRing />, title: "A second way to reach", text: "After three days without a reply, Vani asks the family to help." },
          { icon: <EyeOff />, title: "Sensitive topics stay private", text: "Mental health and other sensitive cases never use the family channel by default." },
        ]}
        mock={<FamilyMock />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. How it works                                                     */
/* ------------------------------------------------------------------ */

export function HowSection() {
  const rules = [
    ["create_case", "BP ≥ 140/90 at screening"],
    ["first_contact", "day 1 after the result"],
    ["medicine_reminder", "day 12"],
    ["overdue", "day 15 without a visit"],
    ["contact_family", "3 days without reply, consent only"],
    ["hand_over", "7 days, low AI confidence or a stuck step"],
    ["urgent", "BP ≥ 180/120 or a danger sign"],
  ];
  const flow = [
    { n: "1", t: "Result arrives", d: "A case is created with an owner", c: "#294167" },
    { n: "2", t: "Vani reminds", d: "Patient, and family if allowed", c: "#3D6FD9" },
    { n: "3", t: "No visit? Vani asks why", d: "Buttons or free text", c: "#E5A50A" },
    { n: "4", t: "Help or hand over", d: "Barrier-specific step, or a nurse", c: "#F07B2B" },
    { n: "5", t: "Closed with evidence", d: "Visit recorded or doctor decision", c: "#22A06B" },
  ];
  return (
    <section id="how" className="scroll-mt-20 bg-[#F7F8FA] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Label>How it works</Label>
          <Heading center first="Rules decide. AI writes." second="People make medical decisions." />
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#556A8B]">
            Timing, urgency and hand-overs follow fixed rules set by the clinical team. AI only reads free-text replies and drafts plain-language messages. Diagnosis, dosing and closing a case stay with people.
          </p>
        </div>
        <div className="mt-12 grid overflow-hidden rounded-xl border border-[#E8EBF1] bg-white lg:grid-cols-2">
          <div className="border-b border-[#EEF0F4] p-6 lg:border-r lg:border-b-0">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#556A8B]">
              <ScrollText className="size-4" /> rules.config · set by the clinical team
            </p>
            <div className="mt-4 space-y-1 rounded-lg bg-[#061224] p-4 font-mono text-[12.5px] leading-relaxed">
              {rules.map(([k, v]) => (
                <p key={k}>
                  <span className="text-[#7FA3E8]">{k}</span>
                  <span className="text-white/40">: </span>
                  <span className="text-white/85">{v}</span>
                </p>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#97A0B7]">Demo defaults. Real values are set and approved by doctors.</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold text-[#556A8B]">One case, start to finish</p>
            <ol className="mt-4 space-y-2">
              {flow.map((f) => (
                <li key={f.n} className="flex items-center gap-3 rounded-lg border border-[#EEF0F4] px-3 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold text-white" style={{ background: f.c }}>
                    {f.n}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-[#061224]">{f.t}</span>
                    <span className="block text-xs text-[#556A8B]">{f.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. For the care team (bento)                                        */
/* ------------------------------------------------------------------ */

function Tile({ title, text, children, className = "" }: { title: string; text: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col rounded-xl border border-[#E8EBF1] bg-white p-5 ${className}`}>
      {children && <div className="mb-5 flex flex-1 items-center rounded-lg bg-[#F7F8FA] p-4">{children}</div>}
      <p className="text-sm font-semibold text-[#061224]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#556A8B]">{text}</p>
    </div>
  );
}

export function TeamSection() {
  const reasons = [
    ["Feels healthy", 28],
    ["No time / work", 21],
    ["Another clinic", 16],
    ["Worried about medicine", 12],
  ] as const;
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Label>For the care team</Label>
          <Heading center first="One place for the follow-up." second="For every role." />
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#556A8B]">Coordinators, doctors and managers see the same cases, each with the view and permissions they need.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Tile className="md:col-span-2" title="Vani Map" text="See every live conversation, grouped by status. Hover a patient to trace the branch; click to open the case.">
            <MapMock />
          </Tile>
          <Tile title="Doctor queue" text="Doctors only see cases that need a clinical decision, urgent first, with a short summary.">
            <div className="w-full space-y-2 text-xs">
              <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2">
                <Stethoscope className="size-3.5 text-[#E5484D]" /> <span className="flex-1 text-[#061224]">Lastri W. · blurred vision</span>
                <span className="text-[10px] font-medium text-[#E5484D]">Urgent</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2">
                <Stethoscope className="size-3.5 text-[#F07B2B]" /> <span className="flex-1 text-[#061224]">Agus S. · medicine worry</span>
                <span className="text-[10px] font-medium text-[#F07B2B]">Review</span>
              </div>
            </div>
          </Tile>
          <Tile title="Reasons, by area" text="Managers see why people do not return, so they can fix the process, not blame the patient.">
            <div className="w-full space-y-2">
              {reasons.map(([l, v]) => (
                <div key={l} className="text-[11px]">
                  <div className="mb-0.5 flex justify-between text-[#1F3050]">
                    <span>{l}</span>
                    <span className="text-[#97A0B7]">{v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#294167]" style={{ width: `${v * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Tile>
          <Tile title="Search everything" text="Press Ctrl K to jump to a patient, a page, an account or a demo action.">
            <div className="w-full rounded-lg border border-[#E8EBF1] bg-white p-2 text-xs">
              <div className="flex items-center gap-2 border-b border-[#EEF0F4] px-1 pb-2 text-[#97A0B7]">
                <Command className="size-3.5" /> lastri
              </div>
              <p className="mt-2 rounded-md bg-[#F1F3F7] px-2 py-1.5 text-[#061224]">Lastri Wahyuni · BP 186/112</p>
            </div>
          </Tile>
          <Tile title="Every role, one demo" text="Switch between coordinator, doctor and manager views. Managers never see names or messages.">
            <div className="grid w-full grid-cols-2 gap-2">
              {[
                { n: "Nurse Rina", r: "Coordinator", a: "/images/avatars/nurse.png", on: true },
                { n: "Nurse Dewi", r: "Coordinator", a: "/images/avatars/nurse.png" },
                { n: "Dr. Yoga", r: "Doctor", a: "/images/avatars/dokter.png" },
                { n: "Hadi", r: "Manager", a: "/images/avatars/manager.png" },
              ].map((p) => (
                <div key={p.n} className={`flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 ${p.on ? "ring-1 ring-[#294167]" : ""}`}>
                  <Image src={p.a} alt={p.n} width={28} height={28} className="size-7 rounded-full object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-[#061224]">{p.n}</span>
                    <span className="block text-[10px] text-[#97A0B7]">{p.r}</span>
                  </span>
                </div>
              ))}
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Safety                                                           */
/* ------------------------------------------------------------------ */

export function SafetySection() {
  const items = [
    { icon: <Lock />, t: "No diagnosis in the first message", d: "Details are shared only after the patient's identity is checked." },
    { icon: <ShieldAlert />, t: "Danger signs go to a doctor", d: "Detected by a fixed rule. AI can raise urgency, never lower it." },
    { icon: <FileCheck2 />, t: "Answers from approved content", d: "Health questions are answered from a library approved by doctors." },
    { icon: <UsersRound />, t: "Consent for family", d: "The patient chooses who and how much, and can revoke it." },
    { icon: <ListChecks />, t: "Every step is logged", d: "Who did what and when, for each case, in one timeline." },
    { icon: <EyeOff />, t: "Role-based views", d: "Managers see numbers only. No names, no messages." },
  ];
  return (
    <section id="safety" className="scroll-mt-20 bg-[#F7F8FA] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Label>Safety</Label>
          <Heading first="Safe by design." second="Private by default." />
          <p className="mt-5 text-base leading-relaxed text-[#556A8B]">vani.ai coordinates care. It does not diagnose. The prototype uses synthetic data only, and AI results are clearly marked.</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-[#E8EBF1] bg-[#E8EBF1] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.t} className="bg-white p-6">
              <span className="grid size-8 place-items-center rounded-lg bg-[#F1F3F7] text-[#294167] [&_svg]:size-4">{it.icon}</span>
              <p className="mt-4 text-sm font-semibold text-[#061224]">{it.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#556A8B]">{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Evidence                                                         */
/* ------------------------------------------------------------------ */

export function EvidenceSection() {
  const cards = [
    {
      k: "35.4%",
      t: "Most people do not come back",
      d: "Only about one in three people with high blood pressure from Indonesia's free health checks had a follow-up check the next year.",
      s: "Ministry of Health Indonesia, 2026",
    },
    {
      k: "22.7% vs 22.9%",
      t: "Reminders alone did not help",
      d: "In a 44-practice trial, automated reminders gave the same follow-up rate as usual care. Personal outreach raised it.",
      s: "JAMA cluster trial, abnormal screening follow-up",
    },
    {
      k: "Same gap",
      t: "Even with full insurance",
      d: "Abu Dhabi's public health regulator describes results without a clear next step, even though residents are fully insured.",
      s: "ADPHC, Future Health Challenge webinar",
    },
  ];
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Label>Evidence</Label>
          <Heading center first="Why a case owner, not a reminder." second="What the data says." />
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.t} className="flex flex-col rounded-xl border border-[#E8EBF1] bg-white p-6">
              <p className="text-2xl font-semibold tracking-[-0.02em] text-[#061224]">{c.k}</p>
              <p className="mt-3 text-sm font-semibold text-[#061224]">{c.t}</p>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-[#556A8B]">{c.d}</p>
              <p className="mt-5 border-t border-[#EEF0F4] pt-3 text-xs text-[#97A0B7]">{c.s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. Path to pilot (in place of pricing)                              */
/* ------------------------------------------------------------------ */

export function PilotSection() {
  const phases = [
    { w: "Months 0–2", t: "Co-design", d: "Test with nurses and doctors. Approve the content library and rules." },
    { w: "Months 3–6", t: "Pilot", d: "One or two clinics, hypertension only. Compare return rates with the baseline." },
    { w: "Months 7–12", t: "Grow", d: "Add diabetes. Connect to national health records over FHIR." },
    { w: "Year 2", t: "Scale", d: "Cervical screening, hospital referrals, and an Abu Dhabi pilot." },
  ];
  const needs = [
    "WhatsApp Business API",
    "FHIR-ready data model (SATUSEHAT, Malaffi)",
    "Swappable local rule packs (JKN, Thiqa / Daman)",
    "Runs in a browser on existing devices",
    "No special hardware",
    "Patient consent built in",
  ];
  return (
    <section id="pilot" className="scroll-mt-20 bg-[#F7F8FA] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Label>Path to pilot</Label>
          <Heading center first="Start with one clinic." second="Grow one condition at a time." />
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#556A8B]">The first pilot target is modest on purpose: about 8–10 more people in every 100 returning for follow-up, the gain seen with personal outreach in trials.</p>
        </div>
        <div className="mt-12 grid overflow-hidden rounded-xl border border-[#E8EBF1] bg-white lg:grid-cols-[1.5fr_1fr]">
          <ol className="grid gap-px bg-[#EEF0F4] sm:grid-cols-2">
            {phases.map((p, i) => (
              <li key={p.t} className="bg-white p-6">
                <p className="text-xs font-medium text-[#97A0B7]">
                  {String(i + 1).padStart(2, "0")} · {p.w}
                </p>
                <p className="mt-2 text-base font-semibold text-[#061224]">{p.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#556A8B]">{p.d}</p>
              </li>
            ))}
          </ol>
          <div className="border-t border-[#EEF0F4] p-6 lg:border-t-0 lg:border-l">
            <p className="text-sm font-semibold text-[#061224]">What a facility needs</p>
            <ul className="mt-4 space-y-2.5">
              {needs.map((n) => (
                <li key={n} className="flex items-center gap-2.5 text-sm text-[#1F3050]">
                  <Check className="size-4 text-[#22A06B]" /> {n}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#081832] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F3050]">
              Try the demo <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Compare                                                         */
/* ------------------------------------------------------------------ */

type Cell = "yes" | "part" | "no";

export function CompareSection() {
  const cols = ["vani.ai", "Reminder blasts", "Patient apps", "Phone follow-up"];
  const rows: { f: string; v: [Cell, Cell, Cell, Cell] }[] = [
    { f: "An owner for every abnormal result", v: ["yes", "no", "no", "part"] },
    { f: "Asks why a visit was missed", v: ["yes", "no", "no", "yes"] },
    { f: "Next step for the specific barrier", v: ["yes", "no", "part", "part"] },
    { f: "Family included, with consent", v: ["yes", "no", "no", "part"] },
    { f: "Hands over to staff with context", v: ["yes", "no", "no", "part"] },
    { f: "Closes only with evidence", v: ["yes", "no", "no", "no"] },
    { f: "Works for hundreds of patients per nurse", v: ["yes", "yes", "yes", "no"] },
  ];
  const icon = (c: Cell) =>
    c === "yes" ? (
      <span className="inline-grid size-5 place-items-center rounded-full bg-[#E3F5EC] text-[#1B7F55]">
        <Check className="size-3" />
      </span>
    ) : c === "part" ? (
      <span className="inline-grid size-5 place-items-center rounded-full bg-[#FDF4DC] text-[#9A6B00]">
        <Minus className="size-3" />
      </span>
    ) : (
      <span className="inline-grid size-5 place-items-center rounded-full bg-[#F1F3F7] text-[#97A0B7]">
        <X className="size-3" />
      </span>
    );
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Label>Compare</Label>
          <Heading center first="How vani.ai compares." second="Against what clinics use today." />
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#556A8B]">Typical approaches, not specific products. Partial means it can happen, but depends on staff time or extra set-up.</p>
        </div>
        <div className="mt-12 overflow-x-auto rounded-xl border border-[#E8EBF1]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#EEF0F4] bg-[#F7F8FA]">
                <th className="px-5 py-3.5 text-xs font-medium text-[#556A8B]">Feature</th>
                {cols.map((c, i) => (
                  <th key={c} className={`px-5 py-3.5 text-center text-xs font-semibold ${i === 0 ? "text-[#061224]" : "font-medium text-[#556A8B]"}`}>
                    {i === 0 ? (
                      <Image src="/images/vani-logo.png" alt="vani.ai" width={427} height={91} className="mx-auto h-4 w-auto" />
                    ) : (
                      c
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.f} className="border-b border-[#F1F3F6] last:border-0">
                  <td className="px-5 py-3.5 text-[#1F3050]">{r.f}</td>
                  {r.v.map((c, i) => (
                    <td key={i} className={`px-5 py-3.5 text-center ${i === 0 ? "bg-[#F7F9FC]" : ""}`}>
                      {icon(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Final CTA + footer                                              */
/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="bg-white px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#081832] px-6 py-16 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image src="/images/hospital-comic-lobby.png" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081832] via-[#081832]/90 to-[#081832]/70" />
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-white sm:text-[40px] sm:leading-[1.1]">
            See one case close.
            <span className="block text-white/55">Start to finish.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70">Open the demo as Nurse Rina, move the clock forward, and follow Andi from a missed visit to a booked one.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#081832] transition hover:bg-white/90">
              Open live demo <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a href="#how" className="inline-flex items-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
              How it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[#EEF0F4] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <Image src="/images/vani-logo.png" alt="vani ai" width={427} height={91} className="h-6 w-auto" />
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#97A0B7]">
            Built for the Future Health Digital Innovation Challenge 2026, Challenge 05: Closing the Screening-to-Care Loop. Prototype with synthetic data. Not a medical device.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#556A8B]">
          <a href="#product" className="hover:text-[#061224]">Product</a>
          <a href="#how" className="hover:text-[#061224]">How it works</a>
          <a href="#safety" className="hover:text-[#061224]">Safety</a>
          <a href="#pilot" className="hover:text-[#061224]">Pilot</a>
          <Link href="/dashboard" className="font-medium text-[#061224]">Dashboard ↗</Link>
        </nav>
      </div>
    </footer>
  );
}

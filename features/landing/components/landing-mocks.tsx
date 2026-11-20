import Image from "next/image";
import { CheckCheck } from "lucide-react";

/* Static UI mock-ups used on the landing page. They mirror the real dashboard styling. */

const dot = (c: string) => <span className="inline-block size-1.5 shrink-0 rounded-full" style={{ background: c }} />;

export function BrowserFrame({ url, children, className = "" }: { url: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[#E8EBF1] bg-white shadow-[0_24px_60px_-12px_rgba(6,18,36,0.35)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#EEF0F4] bg-[#F7F8FA] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#E1E5EC]" />
        <span className="size-2.5 rounded-full bg-[#E1E5EC]" />
        <span className="size-2.5 rounded-full bg-[#E1E5EC]" />
        <span className="mx-auto rounded-md bg-white px-3 py-0.5 text-[11px] text-[#97A0B7]">{url}</span>
      </div>
      {children}
    </div>
  );
}

/** Hero: a compact version of the "Today" dashboard. */
export function DashboardMock() {
  const kpis = [
    { label: "Needs you", value: "4", hint: "Urgent, handed over, overdue" },
    { label: "Handed to you", value: "1", hint: "Vani paused", c: "#F07B2B" },
    { label: "Urgent", value: "1", hint: "Doctor review", c: "#E5484D" },
    { label: "Overdue", value: "2", hint: "Day 15+, no visit", c: "#E5A50A" },
  ];
  const rows = [
    { n: "Lastri Wahyuni", d: "BP 186/112 · day 3", p: "Urgent", c: "#E5484D" },
    { n: "Maya Anggraini", d: "BP 144/91 · insurance inactive", p: "Handed over", c: "#F07B2B" },
    { n: "Hendra Gunawan", d: "BP 162/101 · day 18", p: "Overdue", c: "#E5A50A" },
    { n: "Putri Ayuningtyas", d: "BP 141/90 · day 0", p: "Unassigned", c: "#556A8B" },
  ];
  const bars = [2, 1, 3, 2, 4, 1, 3, 2, 3, 1, 2, 4, 3, 5];
  return (
    <div className="grid grid-cols-[150px_1fr] text-left">
      <aside className="hidden border-r border-[#EEF0F4] p-4 sm:block">
        <Image src="/images/vani-logo.png" alt="" width={427} height={91} className="mb-6 h-4 w-auto" />
        {["Today", "Cases", "Vani Map", "Insights"].map((n, i) => (
          <div key={n} className={`mb-1 rounded-md px-2 py-1.5 text-[11px] font-medium ${i === 0 ? "bg-[#F1F3F7] text-[#061224]" : "text-[#97A0B7]"}`}>
            {n}
          </div>
        ))}
      </aside>
      <div className="col-span-2 space-y-3 bg-[#F7F8FA] p-4 sm:col-span-1">
        <div>
          <p className="text-sm font-semibold text-[#061224]">Today</p>
          <p className="text-[10px] text-[#556A8B]">Fri, 20 Nov · Vani is handling 4 conversations</p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#E8EBF1] bg-white md:grid-cols-4">
          {kpis.map((k, i) => (
            <div key={k.label} className={`px-3 py-2.5 ${i > 0 ? "md:border-l" : ""} ${i % 2 ? "border-l" : ""} border-[#EEF0F4]`}>
              <p className="flex items-center gap-1 text-[10px] text-[#556A8B]">
                {k.c && dot(k.c)}
                {k.label}
              </p>
              <p className="text-lg font-semibold text-[#061224]">{k.value}</p>
              <p className="text-[9px] text-[#97A0B7]">{k.hint}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-[#E8EBF1] bg-white">
            <p className="px-3 pt-2.5 text-[11px] font-semibold text-[#061224]">Needs you today</p>
            {rows.map((r) => (
              <div key={r.n} className="flex items-center gap-2 border-t border-[#F1F3F6] px-3 py-2">
                <span className="grid size-5 place-items-center rounded-full bg-[#EEF1F6] text-[8px] font-semibold text-[#1F3050]">
                  {r.n
                    .split(" ")
                    .map((s) => s[0])
                    .join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium text-[#061224]">{r.n}</span>
                  <span className="block truncate text-[9px] text-[#556A8B]">{r.d}</span>
                </span>
                <span className="flex items-center gap-1 text-[9px] font-medium text-[#1F3050]">
                  {dot(r.c)}
                  {r.p}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#E8EBF1] bg-white p-3">
            <p className="text-[11px] font-semibold text-[#061224]">Follow-up visits</p>
            <p className="text-lg font-semibold text-[#061224]">
              20% <span className="text-[9px] font-normal text-[#556A8B]">of cases returned</span>
            </p>
            <div className="mt-2 flex h-20 items-end gap-1">
              {bars.map((b, i) => (
                <span key={i} className="flex-1 rounded-t-sm" style={{ height: `${b * 18}%`, background: i === bars.length - 1 ? "#294167" : "#C8D3E6" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Case ownership: a case with owner, timeline and evidence. */
export function CaseMock() {
  const steps = [
    { t: "Screening result: BP 160/100", s: "Day 7 · Community screening", c: "#294167" },
    { t: "First contact sent by Vani", s: "Day 8 · Vani", c: "#3D6FD9" },
    { t: "Overdue (day 15) → Vani asked why", s: "Day 22 · Rules engine", c: "#E5A50A" },
    { t: "Handed over to Nurse Rina", s: "Day 22 · App keeps failing (AI 86%)", c: "#F07B2B" },
    { t: "Visit scheduled: Sat 08:00", s: "Day 22 · Nurse Rina", c: "#22A06B" },
  ];
  return (
    <div className="rounded-xl border border-[#E8EBF1] bg-white p-5 text-left shadow-[0_12px_32px_-12px_rgba(6,18,36,0.18)]">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-[#081832] text-[11px] font-semibold text-white">AP</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#061224]">Andi Pratama, 38</p>
          <p className="text-[11px] text-[#556A8B]">BP 160/100 · Hypertension · Day 22</p>
        </div>
        <span className="rounded-md bg-[#F1F3F7] px-2 py-1 text-[10px] font-medium text-[#1F3050]">Owner: Nurse Rina</span>
      </div>
      <ol className="mt-4 space-y-2.5 border-l border-[#EEF0F4] pl-4">
        {steps.map((s) => (
          <li key={s.t} className="relative">
            <span className="absolute top-1 -left-[21px] size-2.5 rounded-full ring-4 ring-white" style={{ background: s.c }} />
            <p className="text-xs text-[#061224]">{s.t}</p>
            <p className="text-[10px] text-[#97A0B7]">{s.s}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F7F8FA] px-3 py-2 text-[11px]">
        <span className="text-[#556A8B]">Close case</span>
        <span className="font-medium text-[#061224]">Needs 2 in-target visits · 0 / 2</span>
      </div>
    </div>
  );
}

/** Vani agent: WhatsApp-style conversation. */
export function ChatMock() {
  const msgs = [
    { me: true, who: "Vani · digital assistant", t: "Hi Andi, we haven't seen you for your follow-up yet. Is something making it hard to come?", btn: ["I feel fine", "No time / work", "Registered at another clinic"] },
    { me: false, who: "Andi", t: "Registered at another clinic" },
    { me: true, who: "Vani · digital assistant", t: "You can move your clinic in your insurance app: Profile → Change clinic → Riverside CHC." },
    { me: false, who: "Andi", t: "I tried but the app keeps failing" },
    { me: true, who: "Nurse Rina", t: "Hi Andi, come on Saturday at 08:00. We will help you at the front desk.", staff: true },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8EBF1] bg-white text-left shadow-[0_12px_32px_-12px_rgba(6,18,36,0.18)]">
      <div className="flex items-center gap-3 bg-[#F0F2F5] px-4 py-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-white">
          <Image src="/images/vani-icon.png" alt="" width={123} height={91} className="h-4 w-auto" />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-[#111B21]">Vani · Riverside CHC</p>
          <p className="text-[10px] text-[#667781]">Business account · chat with Andi</p>
        </div>
      </div>
      <div className="space-y-2 bg-[#EFEAE2] px-4 py-4" style={{ backgroundImage: "radial-gradient(rgba(17,27,33,0.05) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%] rounded-lg px-2.5 py-1.5 text-[11.5px] leading-snug text-[#111B21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ background: m.me ? "#D9FDD3" : "#fff" }}>
              <p className={`mb-0.5 text-[10px] font-semibold ${m.staff ? "text-[#06CF9C]" : m.me ? "text-[#294167]" : "text-[#E26A3B]"}`}>{m.who}</p>
              {m.t}
              {m.btn && (
                <div className="mt-1 border-t border-black/5 pt-1 text-center text-[10.5px] font-medium text-[#027EB5]">
                  {m.btn.map((b) => (
                    <p key={b}>{b}</p>
                  ))}
                </div>
              )}
              {m.me && (
                <span className="float-right mt-0.5 ml-2 flex items-center gap-0.5 text-[9px] text-[#667781]">
                  09:0{i} <CheckCheck className="size-3 text-[#53BDEB]" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Family channel with consent levels. */
export function FamilyMock() {
  const levels = [
    { l: "Schedule only", d: "Visit day and time", on: true },
    { l: "Schedule + attendance", d: "Also tells if the visit happened", on: false },
    { l: "Schedule, attendance + condition", d: "Also explains the condition", on: false },
  ];
  return (
    <div className="space-y-3 text-left">
      <div className="rounded-xl border border-[#E8EBF1] bg-white p-5 shadow-[0_12px_32px_-12px_rgba(6,18,36,0.18)]">
        <p className="text-sm font-semibold text-[#061224]">Share reminders with family?</p>
        <p className="text-[11px] text-[#556A8B]">Andi chooses who and how much. He can revoke it any time.</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#EEF0F4] px-3 py-2 text-xs">
          <span className="grid size-6 place-items-center rounded-full bg-[#EEF1F6] text-[9px] font-semibold text-[#1F3050]">S</span>
          <span className="flex-1 text-[#061224]">Sari (Wife)</span>
          <span className="text-[10px] text-[#22A06B]">Consent given · day 8</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {levels.map((x) => (
            <div key={x.l} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${x.on ? "bg-[#EEF1F6]" : ""}`}>
              <span className={`grid size-3.5 place-items-center rounded-full border ${x.on ? "border-[#294167]" : "border-[#C8CFE0]"}`}>
                {x.on && <span className="size-1.5 rounded-full bg-[#294167]" />}
              </span>
              <span className="flex-1">
                <span className="block text-xs text-[#061224]">{x.l}</span>
                <span className="block text-[10px] text-[#97A0B7]">{x.d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="ml-auto w-[85%] rounded-xl border border-[#E8EBF1] bg-white p-3 text-[11px] shadow-[0_12px_32px_-12px_rgba(6,18,36,0.18)]">
        <p className="font-semibold text-[#061224]">To Sari · WhatsApp</p>
        <p className="mt-1 text-[#556A8B]">Reminder from Riverside CHC: Andi has a follow-up visit tomorrow (Sat) at 08:00. Can you help remind or accompany him?</p>
        <p className="mt-2 font-medium text-[#22A06B]">Sari: I can take him ✓</p>
      </div>
    </div>
  );
}

/** Vani Map in miniature: Vani → status → patients. */
export function MapMock() {
  const branches = [
    { s: "Urgent", c: "#E5484D", p: ["Lastri W."] },
    { s: "Handed over", c: "#F07B2B", p: ["Maya A.", "Agus S."] },
    { s: "Active", c: "#22A06B", p: ["Andi P.", "Budi S."] },
  ];
  return (
    <div className="flex items-center gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white shadow ring-4 ring-[#EEF1F6]">
        <Image src="/images/vani-icon.png" alt="" width={123} height={91} className="h-5 w-auto" />
      </span>
      <div className="flex-1 space-y-2">
        {branches.map((b) => (
          <div key={b.s} className="flex items-center gap-2">
            <span className="h-px w-4" style={{ background: b.c }} />
            <span className="w-[72px] shrink-0 rounded-md border bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#061224]" style={{ borderColor: b.c }}>
              {b.s}
            </span>
            <span className="h-px w-3" style={{ background: b.c }} />
            <span className="flex flex-wrap gap-1">
              {b.p.map((p) => (
                <span key={p} className="rounded-md border bg-white px-1.5 py-0.5 text-[9px] text-[#1F3050]" style={{ borderColor: b.c }}>
                  {p}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

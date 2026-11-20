"use client";

import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { CONVERSATION_META, REASON_META } from "../logic/constants";
import { useDemoStore } from "../hooks/use-demo-store";
import { EmptyState, Initials, Panel } from "./ui-kit";

export function DoctorQueueView() {
  const { state } = useDemoStore();
  const router = useRouter();
  const queue = state.cases
    .filter((c) => c.status !== "closed" && (c.conversation === "urgent" || c.escalated))
    .sort((a, b) => (a.conversation === "urgent" ? 0 : 1) - (b.conversation === "urgent" ? 0 : 1));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Doctor Queue</h1>
        <p className="text-sm text-steel-500">Only cases that need a clinical decision. Urgent cases always come first.</p>
      </div>
      <Panel icon={<Stethoscope />} title={`${queue.length} cases for review`} subtitle="Danger signs (rule-based), medication concerns and escalations" bodyClassName="space-y-3">
        {queue.length === 0 && <EmptyState>No cases need a doctor right now.</EmptyState>}
        {queue.map((c) => {
          const p = state.patients.find((x) => x.id === c.patientId)!;
          const urgent = c.conversation === "urgent";
          const lastPatient = [...state.messages].reverse().find((m) => m.caseId === c.id && m.from === "patient");
          const concerns = Array.from(new Set(c.reasons.map((r) => REASON_META[r.code].label)));
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/dashboard/cases/${c.id}`)}
              className="flex w-full items-start gap-4 rounded-xl border border-steel-100 p-4 text-left transition hover:border-steel-200 hover:bg-tint/40"
            >
              <Initials name={p.name} tone="soft" className="size-10 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy-900">
                    {p.name}, {p.age}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ color: CONVERSATION_META[urgent ? "urgent" : "handed_over"].color, background: CONVERSATION_META[urgent ? "urgent" : "handed_over"].soft }}
                  >
                    {urgent ? `Urgent · since day ${c.urgentSince ?? state.day}` : "Escalated"}
                  </span>
                </div>
                <div className="mt-2 rounded-lg bg-surface p-3 text-xs leading-relaxed text-navy-800">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-500">Vani summary · Simulated AI</p>
                  <p>
                    <b>Finding:</b> BP {c.systolic}/{c.diastolic} at screening (day {c.resultDay}).
                  </p>
                  <p>
                    <b>Barrier:</b> {concerns.length ? concerns.join(", ") : "none reported"}.
                  </p>
                  <p>
                    <b>Patient said:</b> {lastPatient ? `“${lastPatient.text}”` : "—"}
                  </p>
                  {c.handoverNote && (
                    <p>
                      <b>Why here:</b> {c.handoverNote}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </Panel>
    </div>
  );
}

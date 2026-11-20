"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { CONVERSATION_META, REASON_META, getPatientAvatar } from "../logic/constants";
import { useDemoStore } from "../hooks/use-demo-store";
import { EmptyState, Initials } from "./ui-kit";
import { WhatsAppChat } from "./whatsapp-chat";

export function DoctorQueueView() {
  const { state } = useDemoStore();
  const [search, setSearch] = React.useState("");

  const queue = React.useMemo(
    () =>
      state.cases
        .filter((c) => c.status !== "closed" && (c.conversation === "urgent" || c.escalated))
        .sort((a, b) => (a.conversation === "urgent" ? 0 : 1) - (b.conversation === "urgent" ? 0 : 1)),
    [state.cases],
  );

  const filteredQueue = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((c) => {
      const p = state.patients.find((x) => x.id === c.patientId);
      return p?.name.toLowerCase().includes(q) || c.handoverNote?.toLowerCase().includes(q);
    });
  }, [queue, search, state.patients]);

  const [selectedId, setSelectedId] = React.useState<string | undefined>(() => queue[0]?.id);

  const activeCase = React.useMemo(
    () => queue.find((c) => c.id === selectedId) ?? filteredQueue[0] ?? queue[0],
    [queue, filteredQueue, selectedId],
  );
  const activePatient = activeCase ? state.patients.find((x) => x.id === activeCase.patientId) : undefined;
  const activeConcerns = activeCase ? Array.from(new Set(activeCase.reasons.map((r) => REASON_META[r.code].label))) : [];

  if (queue.length === 0) {
    return (
      <div className="p-6">
        <EmptyState>No cases need a doctor right now.</EmptyState>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-surface">
      {/* Left Panel: Contact List (Menempel langsung dengan Sidebar & TopBar, punya scroll sendiri) */}
      <aside data-tour="doctor-queue" className="flex h-full min-h-0 w-76 shrink-0 flex-col border-r border-[#E8EBF1] bg-white xl:w-84">
        <div className="shrink-0 space-y-2.5 border-b border-[#EEF0F4] px-3.5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-navy-800" />
              <h2 className="text-[13px] font-semibold text-navy-950">Doctor Queue</h2>
            </div>
            <span className="rounded-full bg-[#EEF1F6] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-navy-800">
              {queue.length}
            </span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-steel-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient contact…"
              className="h-8 rounded-lg border-[#E8EBF1] bg-[#F8F9FB] pl-8 text-xs shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-[#F1F3F6] overflow-y-auto">
          {filteredQueue.length === 0 && (
            <p className="p-6 text-center text-xs text-steel-500">No contacts match &ldquo;{search}&rdquo;.</p>
          )}
          {filteredQueue.map((c) => {
            const p = state.patients.find((x) => x.id === c.patientId)!;
            const urgent = c.conversation === "urgent";
            const lastMsg = [...state.messages].reverse().find((m) => m.caseId === c.id);
            const lastPatient = [...state.messages].reverse().find((m) => m.caseId === c.id && m.from === "patient");
            const isSelected = activeCase?.id === c.id;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#F8F9FB]",
                  isSelected && "bg-[#F1F4F9] hover:bg-[#F1F4F9]",
                )}
              >
                <Initials name={p.name} avatarUrl={getPatientAvatar(p)} tone="soft" className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-navy-950">
                      {p.name}, {p.age}
                    </p>
                    {lastMsg && <span className="shrink-0 text-[10px] text-steel-400">{lastMsg.time}</span>}
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: CONVERSATION_META[urgent ? "urgent" : "handed_over"].color,
                        background: CONVERSATION_META[urgent ? "urgent" : "handed_over"].soft,
                      }}
                    >
                      {urgent ? "Urgent" : "Escalated"}
                    </span>
                    <span className="text-[11px] font-medium text-navy-800">
                      BP {c.systolic}/{c.diastolic}
                    </span>
                  </div>

                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-steel-500">
                    {lastPatient ? lastPatient.text : c.handoverNote ?? "Awaiting clinical review"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Panel: Padded Chat Container (Ada jaraknya & hanya di dalam chat yang bisa di-scroll) */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-surface p-4 md:p-5">
        {activeCase && activePatient ? (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E8EBF1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            {/* Compact Vani Summary Banner */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E8EBF1] bg-white px-4 py-2 text-xs">
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                    Vani summary · Simulated AI
                  </span>
                  <span className="text-steel-300">·</span>
                  <span className="font-semibold text-navy-900">
                    BP {activeCase.systolic}/{activeCase.diastolic} (day {activeCase.resultDay})
                  </span>
                  {activeConcerns.length > 0 && (
                    <>
                      <span className="text-steel-300">·</span>
                      <span className="text-navy-800">Barrier: {activeConcerns.join(", ")}</span>
                    </>
                  )}
                </div>
                {activeCase.handoverNote && (
                  <p className="line-clamp-1 text-[11.5px] text-steel-500">
                    <b className="text-navy-800">Why here:</b> {activeCase.handoverNote}
                  </p>
                )}
              </div>

              <Link
                href={`/dashboard/cases/${activeCase.id}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#E1E5EC] bg-white px-2.5 py-1 text-[11.5px] font-medium text-navy-900 transition hover:bg-[#F4F5F8]"
              >
                Open case detail
                <ArrowUpRight className="size-3.5 text-steel-500" />
              </Link>
            </div>

            {/* Embedded WhatsApp Chat — Only the messages body inside scrolls */}
            <WhatsAppChat
              key={activeCase.id}
              c={activeCase}
              patientName={activePatient.name}
              className="h-full min-h-0 flex-1 rounded-none border-0"
            />
          </div>
        ) : (
          <div className="grid flex-1 place-items-center rounded-2xl border border-[#E8EBF1] bg-white p-8 text-sm text-steel-500">
            Select a patient contact on the left to open the chat.
          </div>
        )}
      </div>
    </div>
  );
}

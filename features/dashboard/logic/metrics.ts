import type { CaseStatus, DemoState, ReasonCode } from "../types";
import { REASON_CODES, STATUS_ORDER } from "./constants";
import { isOpen, isOverdue, priorityOf } from "./engine";

const REACHED: Record<CaseStatus, number> = {
  new: 0,
  contacted: 1,
  no_show: 2,
  scheduled: 2,
  visited: 3,
  in_treatment: 4,
  controlled: 5,
  closed: 5,
};

export function funnel(state: DemoState) {
  const stages = [
    { key: "new", label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "scheduled", label: "Scheduled" },
    { key: "visited", label: "Visited" },
    { key: "in_treatment", label: "In treatment" },
    { key: "closed", label: "Controlled / closed" },
  ];
  const total = state.cases.length;
  return stages.map((s, i) => {
    const count = state.cases.filter((c) => {
      const reached = c.visits > 0 ? Math.max(REACHED[c.status], 3) : REACHED[c.status];
      return reached >= i;
    }).length;
    return { ...s, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
}

export function reasonCounts(state: DemoState) {
  const counts = Object.fromEntries(REASON_CODES.map((c) => [c, 0])) as Record<ReasonCode, number>;
  state.cases.forEach((c) => {
    const seen = new Set<ReasonCode>();
    c.reasons.forEach((r) => {
      if (!seen.has(r.code)) counts[r.code] += 1;
      seen.add(r.code);
    });
  });
  return REASON_CODES.map((code) => ({ code, count: counts[code] })).sort((a, b) => b.count - a.count);
}

export function statusCounts(state: DemoState) {
  return STATUS_ORDER.concat("no_show").map((s) => ({ status: s, count: state.cases.filter((c) => c.status === s).length }));
}

export function performance(state: DemoState) {
  const firstContact: number[] = [];
  const toVisit: number[] = [];
  state.cases.forEach((c) => {
    const ev = state.timeline.filter((t) => t.caseId === c.id);
    const fc = ev.find((t) => t.kind === "message");
    if (fc) firstContact.push(fc.day - c.resultDay);
    const v = ev.find((t) => t.kind === "visit" && t.label.startsWith("Visit recorded"));
    if (v) toVisit.push(v.day - c.resultDay);
  });
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : 0);
  const open = state.cases.filter(isOpen);
  return {
    avgFirstContact: avg(firstContact),
    avgToVisit: avg(toVisit),
    overdue: open.filter((c) => isOverdue(c, state.day)).length,
    unassigned: open.filter((c) => !c.coordinatorId).length,
    handedOver: open.filter((c) => c.conversation === "handed_over").length,
    urgent: open.filter((c) => c.conversation === "urgent").length,
    closedWithoutEvidence: state.cases.filter((c) => c.status === "closed" && !c.closure).length,
    returned: state.cases.filter((c) => c.visits > 0 || c.status === "closed").length,
    total: state.cases.length,
    open: open.length,
    closed: state.cases.filter((c) => c.status === "closed" || c.status === "controlled").length,
  };
}

export function familyStats(state: DemoState) {
  const withConsent = state.cases.filter((c) => state.families.some((f) => f.patientId === c.patientId && !f.revoked));
  const reachedViaFamily = state.cases.filter((c) => c.familyContacted).length;
  const noResponseCases = state.cases.filter((c) => c.familyContacted || c.conversation === "no_response").length;
  const escorts = state.timeline.filter((t) => t.kind === "family" && t.label.includes("will accompany")).length;
  return {
    consentPct: state.cases.length ? Math.round((withConsent.length / state.cases.length) * 100) : 0,
    consentCount: withConsent.length,
    reachedViaFamily,
    noResponseCases,
    escorts,
  };
}

export function returnsPerDay(state: DemoState, days = 7) {
  const out: { day: number; visits: number; byReason: Record<string, number> }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = state.day - i;
    const visits = state.timeline.filter((t) => t.kind === "visit" && t.label.startsWith("Visit recorded") && t.day === day);
    const byReason: Record<string, number> = {};
    visits.forEach((v) => {
      const c = state.cases.find((x) => x.id === v.caseId);
      const r = c?.reasons[0]?.code ?? "NONE";
      byReason[r] = (byReason[r] ?? 0) + 1;
    });
    out.push({ day, visits: visits.length, byReason });
  }
  return out;
}

export function vaniActivity(state: DemoState, days = 7) {
  const from = state.day - days + 1;
  const msgs = state.messages.filter((m) => m.day >= from);
  return {
    sent: msgs.filter((m) => m.from === "vani").length,
    replied: msgs.filter((m) => m.from === "patient" || m.from === "family").length,
    handedOver: state.timeline.filter((t) => t.day >= from && t.kind === "handover" && t.label.startsWith("Handed over")).length,
  };
}

export function byArea(state: DemoState) {
  const areas = ["North", "East", "South", "West"] as const;
  return areas.map((area) => {
    const ids = new Set(state.patients.filter((p) => p.area === area).map((p) => p.id));
    const cases = state.cases.filter((c) => ids.has(c.patientId));
    const rc: Partial<Record<ReasonCode, number>> = {};
    cases.forEach((c) => c.reasons.forEach((r) => (rc[r.code] = (rc[r.code] ?? 0) + 1)));
    const top = (Object.entries(rc) as [ReasonCode, number][]).sort((a, b) => b[1] - a[1])[0];
    const returned = cases.filter((c) => c.visits > 0 || c.status === "closed").length;
    return { area, cases: cases.length, returnedPct: cases.length ? Math.round((returned / cases.length) * 100) : 0, top: top?.[0], topCount: top?.[1] ?? 0 };
  });
}

export function needsToday(state: DemoState, accountId: string) {
  return state.cases
    .filter(isOpen)
    .map((c) => ({ c, p: priorityOf(c, state.day) }))
    .filter(({ c, p }) => p !== "normal" && (p !== "handed_over" || !c.coordinatorId || c.coordinatorId === accountId || c.takeoverBy === accountId) )
    .sort((a, b) => rank(a.p) - rank(b.p));
}

function rank(p: string) {
  return ["urgent", "handed_over", "overdue", "unassigned", "normal"].indexOf(p);
}

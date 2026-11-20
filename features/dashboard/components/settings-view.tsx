"use client";

import { BookCheck, Lock, Scale, ShieldCheck } from "lucide-react";
import { FACILITY, RULES } from "../logic/constants";
import { URGENT_TERMS } from "../logic/simulated-ai";
import { Panel } from "./ui-kit";

const RULE_ROWS: [string, string][] = [
  ["Create a case", `BP ≥ ${RULES.createCaseSystolic}/${RULES.createCaseDiastolic} at screening`],
  ["Urgent from result", `Systolic ≥ ${RULES.urgentSystolic} or diastolic ≥ ${RULES.urgentDiastolic}`],
  ["Urgent from reply", URGENT_TERMS.join(", ")],
  ["First contact", `Day ${RULES.firstContactDay} after the result`],
  ["Medicine running out reminder", `Day ${RULES.medsRunningOutDay}`],
  ["Overdue", `Day ${RULES.overdueDay} without a visit`],
  ["Contact family", `${RULES.familyAfterNoReplyDays} days without reply (consent only)`],
  ["Hand over to staff", `${RULES.handoverAfterNoReplyDays} days without reply · reason needs a person · Simulated AI confidence < ${RULES.minConfidence * 100}%`],
];

const CONTENT = [
  "Why follow-up matters when you feel fine",
  "Is blood pressure medicine safe for my kidneys?",
  "How to change your registered clinic",
  "Early and weekend visit options",
  "Danger signs: when to go to the emergency department",
];

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-950">Settings</h1>
        <p className="flex items-center gap-1.5 text-sm text-steel-500">
          <Lock className="size-3.5" /> Read-only in this prototype. Values are demo defaults and must be set by the clinical team.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel icon={<Scale />} title="Rules (deterministic)" subtitle="Decisions are made by rules, not by AI" className="xl:row-span-2">
          <dl className="divide-y divide-steel-100 text-[13px]">
            {RULE_ROWS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[180px_1fr] gap-3 py-2.5">
                <dt className="font-medium text-navy-900">{k}</dt>
                <dd className="text-steel-500">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel icon={<BookCheck />} title="Approved content library" subtitle="Vani only answers health questions from this list">
          <ul className="space-y-2 text-[13px]">
            {CONTENT.map((c) => (
              <li key={c} className="flex items-center justify-between gap-3 rounded-lg border border-steel-100 px-3 py-2">
                <span className="text-navy-900">{c}</span>
                <span className="shrink-0 rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[11px] font-semibold text-[#1B7F55]">Approved by Dr. Yoga</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel icon={<ShieldCheck />} title="Rule pack" subtitle="Local insurance and referral rules are swappable">
          <p className="text-[13px] text-navy-900">
            Active: <b>{FACILITY.rulePack}</b>
          </p>
          <p className="mt-2 text-xs text-steel-500">Next stage: national rule packs (e.g. JKN in Indonesia, Thiqa / Daman in Abu Dhabi) and FHIR integration with national health records.</p>
        </Panel>
      </div>
    </div>
  );
}

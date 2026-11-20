import type { ReasonCode, SimulatedAiResult } from "../types";

/**
 * Simulated AI classifier.
 * Mimics the contract of a real model (reason + confidence) using keyword rules,
 * so it can later be swapped for a real model call with the same interface.
 * Danger signs are NOT decided here: see URGENT_TERMS (deterministic rule).
 */
const KEYWORDS: Record<Exclude<ReasonCode, "OTHER">, string[]> = {
  FEEL_WELL: ["feel fine", "feel good", "healthy", "not sick", "no symptoms", "i'm fine", "im fine", "feel ok"],
  NO_TIME: ["work", "busy", "no time", "shift", "office", "late", "schedule"],
  OTHER_CLINIC: ["another clinic", "other clinic", "registered", "hometown", "village", "different clinic", "transfer"],
  FEAR_MEDS: ["kidney", "side effect", "medicine", "medication", "pills", "drug", "dependent", "addicted"],
  INSURANCE: ["insurance", "card", "inactive", "premium", "coverage", "bpjs", "pay"],
  DONT_KNOW_HOW: ["app", "failing", "error", "don't know how", "dont know how", "how do i", "login", "crash", "keeps failing", "confusing"],
  NO_ESCORT: ["no one", "nobody", "alone", "take me", "drive me", "escort", "accompany"],
};

export const URGENT_TERMS = [
  "chest pain",
  "short of breath",
  "shortness of breath",
  "one-sided weakness",
  "weakness on one side",
  "slurred speech",
  "blurred vision",
  "severe headache",
  "fainted",
];

export function detectUrgent(text: string): string[] {
  const t = text.toLowerCase();
  return URGENT_TERMS.filter((term) => t.includes(term));
}

export function classifyFreeText(text: string): SimulatedAiResult {
  const t = text.toLowerCase();
  const urgentTerms = detectUrgent(t);

  let best: { code: ReasonCode; hits: string[] } = { code: "OTHER", hits: [] };
  (Object.keys(KEYWORDS) as Exclude<ReasonCode, "OTHER">[]).forEach((code) => {
    const hits = KEYWORDS[code].filter((k) => t.includes(k));
    if (hits.length > best.hits.length) best = { code, hits };
  });

  let confidence = 0.32;
  if (best.hits.length >= 2) confidence = 0.86;
  else if (best.hits.length === 1) confidence = best.hits[0].length > 5 ? 0.78 : 0.64;

  return {
    reason: best.code,
    confidence,
    urgent: urgentTerms.length > 0,
    matchedTerms: [...best.hits, ...urgentTerms],
  };
}

"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import type { Action } from "../logic/engine";
import { nextWeekday } from "../logic/constants";
import type { DemoState } from "../types";
import { useDemoStore } from "../hooks/use-demo-store";

/* ------------------------------------------------------------------ */
/* Script                                                              */
/* ------------------------------------------------------------------ */

type Ctx = { state: DemoState; dispatch: React.Dispatch<Action>; reset: () => void };

type Step = {
  id: string;
  title: string;
  body: string;
  /** Page the step lives on. */
  route?: string;
  /** Demo account the step is seen as. */
  account?: string;
  /** CSS selector to highlight. No target = centred card. */
  target?: string;
  /** Text on the Next button when it also performs an action. */
  actionLabel?: string;
  /** Runs when the user presses Next on this step (the demo moves forward). */
  onNext?: (ctx: Ctx) => void;
  /** Skip condition: the step is passed over when this returns false. */
  when?: (ctx: Ctx) => boolean;
};

const ANDI = "c1";

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to the vani.ai demo",
    body: "This 2-minute tour follows one patient, Andi, from a missed follow-up to a booked visit. Starting the tour resets the demo data. You can skip at any time.",
    route: "/dashboard",
    account: "rina",
    actionLabel: "Start tour",
    onNext: ({ reset }) => reset(),
  },
  {
    id: "kpis",
    title: "What needs a person today",
    body: "You are Nurse Rina, a care coordinator. These numbers show cases that need a human: urgent, handed over to you, and overdue. Vani handles the rest.",
    route: "/dashboard",
    account: "rina",
    target: '[data-tour="kpis"]',
  },
  {
    id: "needs",
    title: "Your list, sorted by urgency",
    body: "Each row is one abnormal screening result with an owner. Click a row to open the case.",
    route: "/dashboard",
    account: "rina",
    target: '[data-tour="needs"]',
  },
  {
    id: "clock",
    title: "Move time forward",
    body: "The demo clock lets you see days pass in seconds. Next jumps 5 days: Andi's medicine runs out and he misses his follow-up.",
    route: "/dashboard",
    account: "rina",
    target: '[data-tour="clock"]',
    actionLabel: "Jump 5 days",
    onNext: ({ dispatch }) => dispatch({ type: "ADVANCE_DAY", days: 5 }),
  },
  {
    id: "map",
    title: "Vani Map",
    body: "Every live conversation, grouped by status. Andi is now under “Awaiting reply”: Vani asked why he has not come back.",
    route: "/dashboard/map",
    account: "rina",
    target: ".vani-map",
  },
  {
    id: "cases",
    title: "All cases in one table",
    body: "Filter by status, priority or reason. Use Columns to show extra details. Only the essentials are shown by default.",
    route: "/dashboard/cases",
    account: "rina",
    target: '[data-tour="cases-table"]',
  },
  {
    id: "case",
    title: "Andi's case",
    body: "Every case has an owner, a status and a day count. Day 15 without a visit makes it overdue.",
    route: `/dashboard/cases/${ANDI}`,
    account: "rina",
    target: '[data-tour="case-header"]',
  },
  {
    id: "chat",
    title: "Vani asks why",
    body: "Vani messages Andi on WhatsApp (simulated here). Next sends Andi's replies: he is registered at another clinic, and the app to move clinic keeps failing.",
    route: `/dashboard/cases/${ANDI}`,
    account: "rina",
    target: '[data-tour="chat"]',
    actionLabel: "Send Andi's replies",
    when: ({ state }) => state.cases.find((c) => c.id === ANDI)?.conversation === "awaiting",
    onNext: ({ dispatch }) => {
      dispatch({ type: "PATIENT_REPLY", caseId: ANDI, text: "Registered at another clinic" });
      dispatch({ type: "PATIENT_REPLY", caseId: ANDI, text: "I tried but the app keeps failing" });
    },
  },
  {
    id: "handover",
    title: "Handed over to you",
    body: "The simulated AI read the free text as “Doesn't know how / app error” and passed the case to Nurse Rina. Next takes over, replies to Andi and books a Saturday visit.",
    route: `/dashboard/cases/${ANDI}`,
    account: "rina",
    target: '[data-tour="case-header"]',
    actionLabel: "Take over & book visit",
    when: ({ state }) => state.cases.find((c) => c.id === ANDI)?.conversation === "handed_over",
    onNext: ({ state, dispatch }) => {
      const sat = nextWeekday(state.day, 6);
      dispatch({ type: "TAKE_OVER", caseId: ANDI });
      dispatch({ type: "STAFF_MESSAGE", caseId: ANDI, text: "Hi Andi, I'm Nurse Rina. Come on Saturday at 08:00 and we will move your clinic at the front desk." });
      dispatch({ type: "SCHEDULE", caseId: ANDI, day: sat, time: "08:00" });
    },
  },
  {
    id: "timeline",
    title: "Every step is on the record",
    body: "The timeline shows the reason, the hand-over and the booked visit, with who did what. The case can only be closed with evidence.",
    route: `/dashboard/cases/${ANDI}`,
    account: "rina",
    target: '[data-tour="timeline"]',
  },
  {
    id: "doctor",
    title: "The doctor's view",
    body: "Now you are Dr. Yoga. Doctors only see cases that need a clinical decision. Lastri reported blurred vision, so a fixed rule sent her here as urgent.",
    route: "/dashboard/doctor-queue",
    account: "yoga",
    target: '[data-tour="doctor-queue"]',
  },
  {
    id: "insights",
    title: "The manager's view",
    body: "Now you are Hadi, the facility manager. He sees numbers only: where patients drop off and why. No names, no messages.",
    route: "/dashboard/insights",
    account: "hadi",
    target: '[data-tour="insights"]',
  },
  {
    id: "done",
    title: "That's one case, start to finish",
    body: "You can explore freely now. Press Help in the top bar to replay this tour, or use Ctrl K to jump anywhere.",
    route: "/dashboard",
    account: "rina",
    actionLabel: "Finish",
  },
];

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

const SEEN_KEY = "vani-tour-seen";

type TourValue = { start: () => void; active: boolean };
const TourContext = React.createContext<TourValue>({ start: () => {}, active: false });
export const useTour = () => React.useContext(TourContext);

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, reset } = useDemoStore();
  const router = useRouter();
  const pathname = usePathname();
  const [index, setIndex] = React.useState<number | null>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const direction = React.useRef<1 | -1>(1);
  const ctxRef = React.useRef<Ctx>({ state, dispatch, reset });
  // Keep the latest demo context for step actions (updated before other effects run).
  React.useLayoutEffect(() => {
    ctxRef.current = { state, dispatch, reset };
  });

  const step = index !== null ? STEPS[index] : null;

  const close = React.useCallback((how: "skip" | "finish") => {
    setIndex(null);
    setRect(null);
    markSeen();
    if (how === "skip") toast("Tour skipped", { description: "Press Help in the top bar to replay it." });
  }, []);

  const start = React.useCallback(() => {
    direction.current = 1;
    setIndex(0);
  }, []);

  // First visit: start automatically once.
  React.useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const t = window.setTimeout(start, 700);
    return () => window.clearTimeout(t);
  }, [start]);

  const go = React.useCallback((to: number) => {
    if (to < 0) return;
    if (to >= STEPS.length) {
      setIndex(null);
      setRect(null);
      markSeen();
      return;
    }
    direction.current = to >= (index ?? 0) ? 1 : -1;
    setRect(null);
    setIndex(to);
  }, [index]);

  // Enter a step: apply its skip condition, account and route.
  React.useEffect(() => {
    if (!step || index === null) return;
    const ctx = ctxRef.current;
    if (step.when && !step.when(ctx)) {
      const t = window.setTimeout(() => go(index + direction.current), 0);
      return () => window.clearTimeout(t);
    }
    if (step.account && ctx.state.activeAccountId !== step.account) ctx.dispatch({ type: "SWITCH_ACCOUNT", id: step.account });
    if (step.route && pathname !== step.route) router.push(step.route);
  }, [step, index, pathname, router, go]);

  // Find and follow the highlighted element. If it never appears, skip the step.
  React.useEffect(() => {
    if (!step || index === null) return;
    if (!step.target) return;
    let tries = 0;
    let scrolled = false;
    const timer = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>(step.target!);
      const onRoute = !step.route || window.location.pathname === step.route;
      if (el && onRoute) {
        if (!scrolled) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          scrolled = true;
        }
        setRect(el.getBoundingClientRect());
        return;
      }
      tries += 1;
      if (tries > 25) {
        window.clearInterval(timer);
        go(index + direction.current);
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [step, index, go]);

  const next = () => {
    if (!step || index === null) return;
    step.onNext?.(ctxRef.current);
    if (index === STEPS.length - 1) close("finish");
    else go(index + 1);
  };

  // Keyboard: → next, ← back, Esc skip.
  React.useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close("skip");
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, close]);

  const value = React.useMemo(() => ({ start, active: index !== null }), [start, index]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {step && index !== null && (
        <TourOverlay
          step={step}
          index={index}
          total={STEPS.length}
          rect={step.target ? rect : null}
          waiting={!!step.target && !rect}
          onNext={next}
          onBack={() => go(index - 1)}
          onSkip={() => close("skip")}
        />
      )}
    </TourContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay                                                             */
/* ------------------------------------------------------------------ */

const PAD = 8;
const CARD_W = 360;

function TourOverlay({
  step,
  index,
  total,
  rect,
  waiting,
  onNext,
  onBack,
  onSkip,
}: {
  step: Step;
  index: number;
  total: number;
  rect: DOMRect | null;
  waiting: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const centered = !rect;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  // Place the card below the target, or above it, or beside it when there is no room.
  let cardStyle: React.CSSProperties = {};
  if (rect) {
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const left = Math.min(Math.max(16, rect.left), vw - CARD_W - 16);
    if (spaceBelow > 230) cardStyle = { top: rect.bottom + PAD + 12, left };
    else if (spaceAbove > 230) cardStyle = { bottom: vh - rect.top + PAD + 12, left };
    else cardStyle = { top: Math.max(16, Math.min(rect.top, vh - 260)), left: rect.right + 24 + CARD_W < vw ? rect.right + 24 : Math.max(16, rect.left - CARD_W - 24) };
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* Dim layer with a cut-out around the target */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-white/90 transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(6,18,36,0.55)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(6,18,36,0.55)] transition-opacity" />
      )}
      {/* Click shield: the demo is driven from the card while the tour runs */}
      <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />

      <div
        className={cn(
          "fixed w-[min(360px,calc(100vw-32px))] rounded-xl border border-[#E8EBF1] bg-white p-5 shadow-[0_24px_60px_-12px_rgba(6,18,36,0.45)] transition-[top,left,bottom] duration-300 ease-out",
          centered && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
        style={centered ? undefined : cardStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {(index === 0 || index === total - 1) && (
              <span className="grid size-9 place-items-center rounded-full bg-[#F1F3F7]">
                <Image src="/images/vani-icon.png" alt="" width={123} height={91} className="h-4 w-auto" />
              </span>
            )}
            <p className="text-[11px] font-medium text-steel-500">
              Step {index + 1} of {total}
            </p>
          </div>
          <button onClick={onSkip} className="-mt-1 -mr-1 grid size-7 place-items-center rounded-md text-steel-300 hover:bg-[#F1F3F7] hover:text-navy-950" aria-label="Skip tour">
            <X className="size-4" />
          </button>
        </div>
        <h3 className="mt-2 text-[15px] font-semibold text-navy-950">{step.title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-steel-500">{step.body}</p>
        {waiting && <p className="mt-2 text-[11px] text-steel-300">Opening the page…</p>}

        <div className="mt-4 flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-navy-900" : "bg-[#E8EBF1]")} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={onSkip} className="text-xs font-medium text-steel-500 hover:text-navy-950">
            Skip tour
          </button>
          <span className="flex-1" />
          {index > 0 && index < total - 1 && (
            <button onClick={onBack} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E8EBF1] px-3 text-xs font-medium text-navy-800 hover:bg-[#F7F8FA]">
              <ArrowLeft className="size-3.5" /> Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={waiting}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-navy-900 px-3 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:opacity-50"
          >
            {step.actionLabel ?? "Next"} {index < total - 1 && <ArrowRight className="size-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

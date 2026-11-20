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

type Box = { top: number; left: number; width: number; height: number };

const sameBox = (a: Box | null, b: Box | null) =>
  !!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, reset } = useDemoStore();
  const router = useRouter();
  const pathname = usePathname();
  const [index, setIndex] = React.useState<number | null>(null);
  /** Last highlighted box. It is kept while the next target loads, so the spotlight glides instead of flashing. */
  const [box, setBox] = React.useState<Box | null>(null);
  /** Id of the step whose target has been found. */
  const [foundFor, setFoundFor] = React.useState<string | null>(null);
  const direction = React.useRef<1 | -1>(1);
  const ctxRef = React.useRef<Ctx>({ state, dispatch, reset });
  // Keep the latest demo context for step actions (updated before other effects run).
  React.useLayoutEffect(() => {
    ctxRef.current = { state, dispatch, reset };
  });

  const step = index !== null ? STEPS[index] : null;

  const close = React.useCallback((how: "skip" | "finish") => {
    setIndex(null);
    setBox(null);
    setFoundFor(null);
    markSeen();
    if (how === "skip") toast("Tour skipped", { description: "Press Help in the top bar to replay it." });
  }, []);

  const start = React.useCallback(() => {
    direction.current = 1;
    setFoundFor(null);
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

  const go = React.useCallback(
    (to: number) => {
      if (to < 0) return;
      if (to >= STEPS.length) {
        setIndex(null);
        setBox(null);
        setFoundFor(null);
        markSeen();
        return;
      }
      direction.current = to >= (index ?? 0) ? 1 : -1;
      setIndex(to);
    },
    [index],
  );

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

  // Follow the target every animation frame (smooth while the page scrolls).
  // Steps without a target glide to the centre. A target that never appears is skipped.
  React.useEffect(() => {
    if (!step || index === null) return;
    let raf = 0;
    let scrolled = false;
    const startedAt = performance.now();
    const tick = () => {
      if (!step.target) {
        const centre = { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };
        setBox((prev) => (sameBox(prev, centre) ? prev : centre));
        setFoundFor(step.id);
        return;
      }
      const el = document.querySelector<HTMLElement>(step.target);
      const onRoute = !step.route || window.location.pathname === step.route;
      if (el && onRoute) {
        const r = el.getBoundingClientRect();
        if (!scrolled) {
          scrolled = true;
          const fits = r.top >= 72 && r.bottom <= window.innerHeight - 16;
          if (!fits) el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? "start" : "center", behavior: "smooth" });
        }
        const next = { top: r.top, left: r.left, width: r.width, height: r.height };
        setBox((prev) => (sameBox(prev, next) ? prev : next));
        setFoundFor((prev) => (prev === step.id ? prev : step.id));
      } else if (performance.now() - startedAt > 3000) {
        go(index + direction.current);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [step, index, go]);

  const next = () => {
    if (!step || index === null) return;
    step.onNext?.(ctxRef.current);
    if (index === STEPS.length - 1) close("finish");
    else go(index + 1);
  };

  // Keyboard: ← back, Esc skip.
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
          box={box}
          ready={foundFor === step.id}
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
const GAP = 14;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function useViewport() {
  const [vp, setVp] = React.useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  React.useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

function TourOverlay({
  step,
  index,
  total,
  box,
  ready,
  onNext,
  onBack,
  onSkip,
}: {
  step: Step;
  index: number;
  total: number;
  box: Box | null;
  ready: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const vp = useViewport();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = React.useState(240);

  // Track the card height so it can be placed precisely (and slide, not jump).
  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCardH(Math.round(entry.contentRect.height + 42)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cw = Math.min(360, vp.w - 32);
  const target = box ?? { top: vp.h / 2, left: vp.w / 2, width: 0, height: 0 };
  const hasHole = target.width > 0 && target.height > 0;

  // One positioning model (top/left) for every case, so the card always glides.
  let top: number;
  let left: number;
  if (!hasHole) {
    top = (vp.h - cardH) / 2;
    left = (vp.w - cw) / 2;
  } else {
    const below = vp.h - (target.top + target.height);
    const above = target.top;
    left = Math.min(Math.max(16, target.left), vp.w - cw - 16);
    if (below > cardH + GAP + PAD + 8) top = target.top + target.height + PAD + GAP;
    else if (above > cardH + GAP + PAD + 8) top = target.top - PAD - GAP - cardH;
    else if (target.left + target.width + GAP + cw + 16 < vp.w) {
      left = target.left + target.width + PAD + GAP;
      top = Math.min(Math.max(16, target.top), vp.h - cardH - 16);
    } else if (target.left - GAP - cw - 16 > 0) {
      left = target.left - PAD - GAP - cw;
      top = Math.min(Math.max(16, target.top), vp.h - cardH - 16);
    } else {
      // Very large target (e.g. the map): sit inside it, bottom-right.
      left = vp.w - cw - 24;
      top = vp.h - cardH - 24;
    }
  }

  const glide = `top 420ms ${EASE}, left 420ms ${EASE}, width 420ms ${EASE}, height 420ms ${EASE}, opacity 300ms ease`;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* Spotlight: always mounted, it glides from one target to the next and shrinks to the centre for intro/outro. */}
      <div
        className="pointer-events-none fixed rounded-xl"
        style={{
          top: target.top - (hasHole ? PAD : 0),
          left: target.left - (hasHole ? PAD : 0),
          width: target.width + (hasHole ? PAD * 2 : 0),
          height: target.height + (hasHole ? PAD * 2 : 0),
          boxShadow: `0 0 0 9999px rgba(6,18,36,${hasHole ? 0.55 : 0.6}), 0 0 0 ${hasHole ? 2 : 0}px rgba(255,255,255,0.9)`,
          transition: glide + ", box-shadow 420ms ease",
          willChange: "top, left, width, height",
        }}
      />
      {/* Click shield: the demo is driven from the card while the tour runs */}
      <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />

      <div
        ref={cardRef}
        className="fixed rounded-xl border border-[#E8EBF1] bg-white p-5 shadow-[0_24px_60px_-12px_rgba(6,18,36,0.45)]"
        style={{ top, left, width: cw, transition: glide, willChange: "top, left" }}
      >
        {/* Content fades in per step, while the card itself slides */}
        <div key={step.id} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
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
        </div>

        <div className="mt-4 flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i <= index ? "bg-navy-900" : "bg-[#E8EBF1]")} />
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
            disabled={!ready}
            className="inline-flex h-8 min-w-20 items-center justify-center gap-1 rounded-lg bg-navy-900 px-3 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
          >
            {ready ? (
              <>
                {step.actionLabel ?? "Next"} {index < total - 1 && <ArrowRight className="size-3.5" />}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Loading
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

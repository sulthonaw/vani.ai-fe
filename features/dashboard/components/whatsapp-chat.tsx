"use client";

import * as React from "react";
import Image from "next/image";
import gsap from "gsap";
import { BadgeCheck, CheckCheck, Pause, Play, SendHorizontal, Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import type { CaseRecord, Message } from "../types";
import { FACILITY, formatDay } from "../logic/constants";
import { accountById } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";

const WA = {
  wallpaper: "#EFEAE2",
  outgoing: "#D9FDD3",
  incoming: "#FFFFFF",
  header: "#F0F2F5",
  green: "#00A884",
  tick: "#53BDEB",
};

function DateChip({ day }: { day: number }) {
  return (
    <div className="flex justify-center py-1" data-chat-item data-chat-kind="meta">
      <span className="rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#54656F] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        Day {day} · {formatDay(day)}
      </span>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start" data-typing-bubble style={{ display: "none" }}>
      <div
        className="relative flex items-center gap-1 rounded-lg rounded-tl-none px-3 py-2.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
        style={{ background: WA.incoming }}
      >
        <span
          className="absolute top-0 -left-2 size-2"
          style={{
            background: WA.incoming,
            clipPath: "polygon(0 0, 100% 0, 100% 100%)",
          }}
        />
        <span className="size-1.5 animate-bounce rounded-full bg-[#667781]/80 [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#667781]/80 [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#667781]/80 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Message }) {
  const outgoing = m.from === "vani" || m.from === "staff";
  const sender =
    m.from === "vani" ? "Vani · digital assistant" : m.from === "staff" ? m.senderName : m.from === "family" ? `${m.senderName} (family)` : m.senderName;
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")} data-chat-item data-chat-kind={outgoing ? "outgoing" : "incoming"}>
      <div
        className={cn(
          "relative max-w-[78%] rounded-lg px-2.5 pt-1.5 pb-1 text-[13.5px] leading-snug text-[#111B21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
          outgoing ? "rounded-tr-none" : "rounded-tl-none",
        )}
        style={{ background: outgoing ? WA.outgoing : WA.incoming }}
      >
        {/* bubble tail */}
        <span
          className={cn("absolute top-0 size-2", outgoing ? "-right-2" : "-left-2")}
          style={{
            background: outgoing ? WA.outgoing : WA.incoming,
            clipPath: outgoing ? "polygon(0 0, 100% 0, 0 100%)" : "polygon(0 0, 100% 0, 100% 100%)",
          }}
        />
        <p
          className={cn(
            "mb-0.5 text-[11.5px] font-semibold",
            m.from === "vani" ? "text-[#294167]" : m.from === "staff" ? "text-[#06CF9C]" : m.from === "family" ? "text-[#7F66FF]" : "text-[#E26A3B]",
          )}
        >
          {sender}
          {m.to === "family" && outgoing && <span className="font-normal text-[#667781]"> → family</span>}
        </p>
        <p className="whitespace-pre-wrap">{m.text}</p>
        {m.buttons && m.buttons.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1 border-t border-black/5 pt-1.5">
            {m.buttons.map((b) => (
              <span key={b} className="text-center text-[12.5px] font-medium text-[#027EB5]">
                {b}
              </span>
            ))}
          </div>
        )}
        <span className="float-right mt-0.5 ml-3 flex items-center gap-0.5 text-[10.5px] text-[#667781]">
          {m.time}
          {outgoing && <CheckCheck className="size-3.5" style={{ color: WA.tick }} />}
        </span>
      </div>
    </div>
  );
}

export function WhatsAppChat({ c, patientName, className }: { c: CaseRecord; patientName: string; className?: string }) {
  const { state, dispatch } = useDemoStore();
  const account = useActiveAccount();
  const [draft, setDraft] = React.useState("");
  const [loop, setLoop] = React.useState(true);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  const messages = React.useMemo(() => state.messages.filter((m) => m.caseId === c.id), [state.messages, c.id]);
  const closed = c.status === "closed";
  const takenByOther = !!c.takeoverBy && c.takeoverBy !== account.id;
  const canType = !closed && !takenByOther && account.role !== "manager";

  // Simulation: reveal messages slowly one by one (GSAP), showing a typing bubble before incoming user messages.
  React.useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-chat-item]", body);
      const typingEl = body.querySelector<HTMLElement>("[data-typing-bubble]");
      if (!items.length) return;
      if (!loop) {
        if (typingEl) gsap.set(typingEl, { display: "none", autoAlpha: 0 });
        gsap.set(items, { display: "", autoAlpha: 1, y: 0, scale: 1 });
        body.scrollTop = body.scrollHeight;
        return;
      }
      const scrollToBottom = () => {
        body.scrollTop = body.scrollHeight;
      };
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 4.5 });
      tl.set(items, { display: "none", autoAlpha: 0, y: 12, scale: 0.97 });
      if (typingEl) {
        tl.set(typingEl, { display: "none", autoAlpha: 0, y: 8, scale: 0.97 });
      }
      tl.call(() => {
        body.scrollTop = 0;
      });
      items.forEach((el, i) => {
        const kind = el.getAttribute("data-chat-kind");
        const isIncoming = kind === "incoming";
        const isMeta = kind === "meta";

        if (isIncoming && typingEl) {
          tl.set(typingEl, { display: "flex" }, i === 0 ? 0.4 : ">+0.85");
          tl.to(typingEl, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.25,
            ease: "power2.out",
            onStart: scrollToBottom,
          });
          tl.set(typingEl, { display: "none", autoAlpha: 0, y: 8, scale: 0.97 }, ">+1.35");
          tl.set(el, { display: "" });
          tl.to(el, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            ease: "power2.out",
            onStart: scrollToBottom,
          });
        } else {
          const pos = i === 0 ? 0.35 : isMeta ? ">+0.5" : ">+1.15";
          tl.set(el, { display: "" }, pos);
          tl.to(el, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: isMeta ? 0.3 : 0.42,
            ease: "power2.out",
            onStart: scrollToBottom,
          });
        }
      });
    }, body);
    return () => ctx.revert();
  }, [messages.length, loop, c.id]);

  const send = () => {
    const text = draft.trim();
    if (!text || !canType) return;
    if (!c.takeoverBy) {
      dispatch({ type: "TAKE_OVER", caseId: c.id });
      toast("You took over from Vani", { description: "Vani is paused for this patient until you return the case." });
    }
    dispatch({ type: "STAFF_MESSAGE", caseId: c.id, text });
    setDraft("");
    setLoop(false);
  };

  return (
    <section className={cn("flex h-[680px] flex-col overflow-hidden rounded-2xl border border-steel-100 bg-white", className)}>
      {/* Header: Vani business profile (compact) */}
      <header className="flex shrink-0 items-center gap-2.5 border-b border-black/5 px-3 py-2" style={{ background: WA.header }}>
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-black/5">
          <Image src="/images/vani-icon.png" alt="Vani" width={123} height={91} className="h-4 w-auto" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[13px] font-semibold leading-tight text-[#111B21]">
            <span className="truncate">Vani · {FACILITY.short}</span>
            <BadgeCheck className="size-3.5 shrink-0 fill-[#00A884] text-white" />
          </p>
          <p className="truncate text-[11px] leading-tight text-[#667781]">
            Chat with {patientName}
            {c.takeoverBy ? ` · ${accountById(c.takeoverBy)?.name}` : " · Vani auto"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLoop((v) => !v)}
          className="h-7 shrink-0 gap-1 rounded-md border-black/10 bg-white px-2 text-[11px] text-[#111B21]"
        >
          {loop ? <Pause className="size-3" /> : <Play className="size-3" />}
          {loop ? "Pause" : "Replay"}
        </Button>
      </header>

      {/* Body (Scrollable messages area) */}
      <div
        ref={bodyRef}
        className="relative min-h-0 flex-1 space-y-1.5 overflow-y-auto px-[5%] py-3"
        style={{
          background: WA.wallpaper,
          backgroundImage: "radial-gradient(rgba(17,27,33,0.05) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="mx-auto mb-2 max-w-sm rounded-md bg-[#FFEECD] px-2.5 py-1 text-center text-[10.5px] leading-snug text-[#54656F]" data-chat-item data-chat-kind="meta">
          Simulated WhatsApp channel. Messages from Vani are automated; staff can reply at any time.
        </div>
        {messages.length === 0 && <p className="pt-10 text-center text-xs text-[#667781]">No messages yet.</p>}
        {messages.map((m, i) => (
          <React.Fragment key={m.id}>
            {(i === 0 || messages[i - 1].day !== m.day) && <DateChip day={m.day} />}
            <Bubble m={m} />
          </React.Fragment>
        ))}
        <TypingBubble />
      </div>

      {/* Composer */}
      <form
        className="flex shrink-0 items-center gap-2 px-2.5 py-2"
        style={{ background: WA.header }}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Smile className="size-4.5 shrink-0 text-[#54656F]" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canType}
          placeholder={
            closed
              ? "Case closed"
              : takenByOther
                ? `${accountById(c.takeoverBy)?.name} is handling this chat`
                : account.role === "manager"
                  ? "Read-only"
                  : `Message as ${account.name}${c.takeoverBy ? "" : " (take over)"}`
          }
          className="h-8.5 flex-1 rounded-lg border-0 bg-white px-2.5 text-xs shadow-none focus-visible:ring-0"
        />
        <button
          type="submit"
          disabled={!canType || !draft.trim()}
          className="grid size-8.5 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40"
          style={{ background: WA.green }}
          aria-label="Send"
        >
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </section>
  );
}

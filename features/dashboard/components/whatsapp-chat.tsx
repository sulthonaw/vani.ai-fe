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
    <div className="flex justify-center py-1" data-chat-item>
      <span className="rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#54656F] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        Day {day} · {formatDay(day)}
      </span>
    </div>
  );
}

function Bubble({ m }: { m: Message }) {
  const outgoing = m.from === "vani" || m.from === "staff";
  const sender =
    m.from === "vani" ? "Vani · digital assistant" : m.from === "staff" ? m.senderName : m.from === "family" ? `${m.senderName} (family)` : m.senderName;
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")} data-chat-item>
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

export function WhatsAppChat({ c, patientName }: { c: CaseRecord; patientName: string }) {
  const { state, dispatch } = useDemoStore();
  const account = useActiveAccount();
  const [draft, setDraft] = React.useState("");
  const [loop, setLoop] = React.useState(true);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  const messages = React.useMemo(() => state.messages.filter((m) => m.caseId === c.id), [state.messages, c.id]);
  const closed = c.status === "closed";
  const takenByOther = !!c.takeoverBy && c.takeoverBy !== account.id;
  const canType = !closed && !takenByOther && account.role !== "manager";

  // Simulation: reveal messages one by one (GSAP), and repeat while "loop" is on.
  React.useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-chat-item]", body);
      if (!items.length) return;
      if (!loop) {
        gsap.set(items, { autoAlpha: 1, y: 0, scale: 1 });
        body.scrollTop = body.scrollHeight;
        return;
      }
      const follow = (el: HTMLElement) => {
        body.scrollTop = Math.max(0, el.offsetTop + el.offsetHeight - body.clientHeight + 24);
      };
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
      tl.set(items, { autoAlpha: 0, y: 14, scale: 0.97 });
      tl.call(() => {
        body.scrollTop = 0;
      });
      items.forEach((el, i) => {
        tl.to(el, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power2.out", onStart: () => follow(el) }, i === 0 ? 0.3 : ">+0.45");
      });
    }, body);
    return () => ctx.revert();
  }, [messages.length, loop]);

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
    <section className="flex h-[680px] flex-col overflow-hidden rounded-2xl border border-steel-100 bg-white">
      {/* Header: Vani business profile */}
      <header className="flex items-center gap-3 border-b border-black/5 px-4 py-2.5" style={{ background: WA.header }}>
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-black/5">
          <Image src="/images/vani-icon.png" alt="Vani" width={123} height={91} className="h-5 w-auto" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[15px] font-semibold text-[#111B21]">
            Vani · {FACILITY.short}
            <BadgeCheck className="size-4 fill-[#00A884] text-white" />
          </p>
          <p className="truncate text-xs text-[#667781]">
            Business account · chat with {patientName}
            {c.takeoverBy ? ` · ${accountById(c.takeoverBy)?.name} is replying` : " · Vani is replying"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLoop((v) => !v)}
          className="h-8 gap-1.5 rounded-lg border-black/10 bg-white text-xs text-[#111B21]"
        >
          {loop ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {loop ? "Pause simulation" : "Replay simulation"}
        </Button>
      </header>

      {/* Body */}
      <div
        ref={bodyRef}
        className="relative flex-1 space-y-1.5 overflow-y-auto px-[6%] py-4"
        style={{
          background: WA.wallpaper,
          backgroundImage: "radial-gradient(rgba(17,27,33,0.05) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="mx-auto mb-2 max-w-sm rounded-md bg-[#FFEECD] px-3 py-1.5 text-center text-[11px] leading-snug text-[#54656F]" data-chat-item>
          Simulated WhatsApp channel. Messages from Vani are automated; staff can reply at any time.
        </div>
        {messages.length === 0 && <p className="pt-10 text-center text-xs text-[#667781]">No messages yet.</p>}
        {messages.map((m, i) => (
          <React.Fragment key={m.id}>
            {(i === 0 || messages[i - 1].day !== m.day) && <DateChip day={m.day} />}
            <Bubble m={m} />
          </React.Fragment>
        ))}
      </div>

      {/* Composer */}
      <form
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ background: WA.header }}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Smile className="size-5 shrink-0 text-[#54656F]" />
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
                  : `Message as ${account.name}${c.takeoverBy ? "" : " (takes over from Vani)"}`
          }
          className="h-10 flex-1 rounded-lg border-0 bg-white px-3 text-sm shadow-none focus-visible:ring-0"
        />
        <button
          type="submit"
          disabled={!canType || !draft.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40"
          style={{ background: WA.green }}
          aria-label="Send"
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </section>
  );
}

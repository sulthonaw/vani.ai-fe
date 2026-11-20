"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowUpRight, MousePointerClick, Users, Waypoints } from "lucide-react";
import { cn } from "@/libs/utils";
import type { CaseRecord, ConversationStatus } from "../types";
import { CONVERSATION_META, formatDay } from "../logic/constants";
import { accountById, familyOf } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { Panel } from "./ui-kit";

type VaniData = { count: number };
type GroupData = { status: ConversationStatus; count: number; dimmed: boolean };
type PatientData = { name: string; finding: string; status: ConversationStatus; owner: string; unread: boolean; dimmed: boolean; focused: boolean };
type FamilyData = { name: string; relation: string; contacted: boolean; dimmed: boolean };

const hidden = "!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

/** Layout columns: the orchestrator (Vani) sits on the left and the tree grows to the right. */
const COL = { vani: 0, group: 300, patient: 640 };
const ROW = 80;
const GROUP_GAP = 44;
/** Patients per column inside a branch; larger branches wrap into extra columns further right. */
const MAX_ROWS = 4;
const COL_STEP = 480;
const FAMILY_OFFSET = 236;

const GROUP_HINT: Record<ConversationStatus, string> = {
  urgent: "Doctor now",
  handed_over: "Staff is handling",
  no_response: "Family / next step scheduled",
  awaiting: "Waiting for the patient",
  active: "Vani is talking",
  idle: "",
};

function VaniNode({ data }: NodeProps<Node<VaniData>>) {
  return (
    <div className="relative grid size-[116px] place-items-center rounded-full bg-white shadow-[0_12px_30px_rgba(41,65,103,0.25)] ring-[6px] ring-tint">
      <Handle type="source" position={Position.Right} className={hidden} />
      <Image src="/images/vani-icon.png" alt="Vani" width={123} height={91} className="h-11 w-auto" />
      <span className="absolute -bottom-2 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white shadow">{data.count} active</span>
    </div>
  );
}

function GroupNode({ data }: NodeProps<Node<GroupData>>) {
  const meta = CONVERSATION_META[data.status];
  return (
    <div className={cn("w-[200px] rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-opacity", data.dimmed && "opacity-35")} style={{ borderColor: meta.color }}>
      <Handle type="target" position={Position.Left} className={hidden} />
      <Handle type="source" position={Position.Right} className={hidden} />
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: meta.color }} />
        <p className="flex-1 text-[13px] font-semibold text-navy-900">{meta.label}</p>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: meta.soft, color: meta.color }}>
          {data.count}
        </span>
      </div>
      <p className="mt-0.5 pl-[18px] text-[10px] text-steel-500">{GROUP_HINT[data.status]}</p>
    </div>
  );
}

function PatientNode({ data }: NodeProps<Node<PatientData>>) {
  const meta = CONVERSATION_META[data.status];
  return (
    <div
      className={cn(
        "group w-[210px] cursor-pointer rounded-xl border bg-white px-3 py-2 shadow-sm transition-all duration-150",
        data.focused && "-translate-y-0.5 shadow-[0_10px_24px_rgba(8,24,50,0.16)]",
        data.dimmed && "opacity-35",
        data.unread && !data.dimmed && "vani-pulse",
      )}
      style={{ borderColor: meta.color, borderWidth: data.focused ? 2 : 1 }}
    >
      <Handle type="target" position={Position.Left} className={hidden} />
      <Handle type="source" position={Position.Right} className={hidden} />
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: meta.color }}>
          {data.name
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-navy-900">{data.name}</p>
          <p className="truncate text-[10px] text-steel-500">
            {data.finding}
            {(data.status === "handed_over" || data.status === "urgent") && data.owner ? ` · → ${data.owner}` : ""}
          </p>
        </div>
        <ArrowUpRight className="size-3.5 shrink-0 text-steel-300 opacity-0 transition group-hover:opacity-100" />
      </div>
    </div>
  );
}

function FamilyNode({ data }: NodeProps<Node<FamilyData>>) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm transition-opacity",
        data.contacted ? "border-[#7FA3E8] bg-[#EEF3FD] text-brand-700" : "border-[#D6E2F8] bg-white text-steel-500",
        data.dimmed && "opacity-35",
      )}
    >
      <Handle type="target" position={Position.Left} className={hidden} />
      <Users className="size-3.5" /> {data.name} · {data.relation}
    </div>
  );
}

const nodeTypes = { vani: VaniNode, branch: GroupNode, patient: PatientNode, family: FamilyNode };

const ORDER: ConversationStatus[] = ["urgent", "handed_over", "no_response", "awaiting", "active"];

type Filter = { needsHuman: boolean; mine: boolean; family: boolean };

export function VaniMapView() {
  const { state } = useDemoStore();
  const router = useRouter();
  const account = useActiveAccount();
  const [filter, setFilter] = React.useState<Filter>({ needsHuman: false, mine: false, family: true });
  /** Case id under the pointer: its whole branch is highlighted and the rest is dimmed. */
  const [focus, setFocus] = React.useState<string | null>(null);
  // React Flow measures the DOM, so render it on the client only (avoids hydration mismatch).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const active = React.useMemo(() => {
    return state.cases
      .filter((c) => c.status !== "closed" && c.conversation !== "idle")
      .filter((c) => !filter.needsHuman || c.conversation === "handed_over" || c.conversation === "urgent")
      .filter((c) => !filter.mine || c.coordinatorId === account.id || c.takeoverBy === account.id);
  }, [state.cases, filter, account.id]);

  const focusCase = focus ? active.find((c) => c.id === focus) : undefined;

  const { nodes, edges } = React.useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const groups = ORDER.map((s) => ({ status: s, cases: active.filter((c) => c.conversation === s) })).filter((g) => g.cases.length);
    const focusStatus = focusCase?.conversation;

    let y = 0;
    const placed: { status: ConversationStatus; top: number; bottom: number; cases: { c: CaseRecord; x: number; y: number }[] }[] = [];
    groups.forEach((g) => {
      const top = y;
      const rowsUsed = Math.min(g.cases.length, MAX_ROWS);
      const rows = g.cases.map((c, i) => ({
        c,
        x: COL.patient + Math.floor(i / MAX_ROWS) * COL_STEP,
        y: top + (i % MAX_ROWS) * ROW,
      }));
      y = top + rowsUsed * ROW + GROUP_GAP;
      placed.push({ status: g.status, top, bottom: top + (rowsUsed - 1) * ROW, cases: rows });
    });
    const totalMid = placed.length ? (placed[0].top + placed[placed.length - 1].bottom) / 2 : 0;

    nodes.push({ id: "vani", type: "vani", position: { x: COL.vani, y: totalMid - 58 + 20 }, data: { count: active.length }, draggable: false, selectable: false });

    placed.forEach((g) => {
      const meta = CONVERSATION_META[g.status];
      const gid = `g-${g.status}`;
      const groupDimmed = !!focusStatus && focusStatus !== g.status;
      nodes.push({
        id: gid,
        type: "branch",
        position: { x: COL.group, y: (g.top + g.bottom) / 2 },
        data: { status: g.status, count: g.cases.length, dimmed: groupDimmed },
        draggable: false,
        selectable: false,
      });
      edges.push({
        id: `e-${gid}`,
        source: "vani",
        target: gid,
        type: "smoothstep",
        pathOptions: { borderRadius: 18 },
        style: { stroke: meta.color, strokeWidth: focusStatus === g.status ? 3.5 : 2.5, opacity: groupDimmed ? 0.2 : 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: meta.color, width: 16, height: 16 },
      } as Edge);

      g.cases.forEach(({ c, x: px, y: py }) => {
        const p = state.patients.find((x) => x.id === c.patientId)!;
        const owner = c.takeoverBy ? accountById(c.takeoverBy)?.name : c.ownerType === "doctor" ? "Dr. Yoga" : accountById(c.coordinatorId)?.name;
        const dimmed = !!focus && focus !== c.id;
        const focused = focus === c.id;
        nodes.push({
          id: c.id,
          type: "patient",
          position: { x: px, y: py },
          data: { name: p.name, finding: `BP ${c.systolic}/${c.diastolic}`, status: c.conversation, owner: owner ?? "unassigned", unread: c.unread, dimmed, focused },
          selectable: false,
        });
        edges.push({
          id: `e-${c.id}`,
          source: gid,
          target: c.id,
          type: "smoothstep",
          pathOptions: { borderRadius: 14 },
          interactionWidth: 24,
          className: c.conversation === "active" && !dimmed ? "vani-edge-flow" : undefined,
          style: {
            stroke: meta.color,
            strokeWidth: focused ? 3.5 : 1.75,
            strokeDasharray: c.conversation === "no_response" ? "4 6" : undefined,
            opacity: dimmed ? 0.15 : 1,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: meta.color, width: 14, height: 14 },
        } as Edge);

        const fam = familyOf(state, c.patientId);
        if (filter.family && fam) {
          nodes.push({
            id: `fam-${c.id}`,
            type: "family",
            position: { x: px + FAMILY_OFFSET, y: py + 8 },
            data: { name: fam.name, relation: fam.relation, contacted: c.familyContacted, dimmed },
            draggable: false,
            selectable: false,
          });
          edges.push({
            id: `ef-${c.id}`,
            source: c.id,
            target: `fam-${c.id}`,
            type: "smoothstep",
            interactionWidth: 20,
            style: { stroke: "#7FA3E8", strokeWidth: 1.5, strokeDasharray: c.familyContacted ? undefined : "3 4", opacity: dimmed ? 0.15 : 1 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#7FA3E8", width: 12, height: 12 },
          });
        }
      });
    });
    return { nodes, edges };
  }, [active, state, filter.family, focus, focusCase]);

  const focusMsg = focusCase ? [...state.messages].reverse().find((m) => m.caseId === focusCase.id) : undefined;
  const focusPatient = focusCase ? state.patients.find((p) => p.id === focusCase.patientId) : undefined;

  const toggle = (k: keyof Filter) => setFilter((f) => ({ ...f, [k]: !f[k] }));
  const caseIdOf = (id: string) => (id.startsWith("fam-") ? id.slice(4) : id.startsWith("e-") ? id.slice(2) : id.startsWith("ef-") ? id.slice(3) : id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-950">Vani Map</h1>
        <p className="mt-0.5 text-[13px] text-steel-500">What Vani is doing right now: Vani → status → patient → family. Hover a patient to trace its branch; click to open the case.</p>
      </div>
      <Panel
        icon={<Waypoints />}
        title={`${active.length} active conversations`}
        subtitle="Branch colour = conversation status"
        actions={
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["needsHuman", "Needs a person"],
                ["mine", "My cases"],
                ["family", "Show family"],
              ] as [keyof Filter, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => toggle(k)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-xs font-semibold transition",
                  filter[k] ? "border-brand-700 bg-brand-700 text-white" : "border-steel-100 bg-white text-steel-500 hover:bg-surface",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="relative h-[calc(100vh-240px)] min-h-[560px] bg-surface">
          {mounted && (
            <ReactFlow
              key={`${active.length}-${filter.family}-${filter.needsHuman}-${filter.mine}`}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
              minZoom={0.3}
              maxZoom={1.8}
              // Comfortable interaction: the page scrolls normally, drag to pan, pinch / buttons to zoom.
              zoomOnScroll={false}
              preventScrolling={false}
              zoomOnDoubleClick={false}
              panOnDrag
              nodesConnectable={false}
              nodesDraggable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, node) => {
                if (node.type === "patient" || node.type === "family") router.push(`/dashboard/cases/${caseIdOf(node.id)}`);
              }}
              onEdgeClick={(_, e) => {
                const id = caseIdOf(e.id);
                if (id.startsWith("c")) router.push(`/dashboard/cases/${id}`);
              }}
              onNodeMouseEnter={(_, node) => {
                if (node.type === "patient" || node.type === "family") setFocus(caseIdOf(node.id));
              }}
              onNodeMouseLeave={() => setFocus(null)}
              onEdgeMouseEnter={(_, e) => {
                const id = caseIdOf(e.id);
                if (id.startsWith("c")) setFocus(id);
              }}
              onEdgeMouseLeave={() => setFocus(null)}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#C8CFE0" />
              <Controls showInteractive={false} position="bottom-right" className="!rounded-xl !border !border-steel-100 !shadow-none" />
            </ReactFlow>
          )}

          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] text-steel-500 shadow-sm">
            <MousePointerClick className="size-3.5" /> Drag to move · use +/− to zoom · click a patient to open
          </div>

          {focusCase && focusPatient && (
            <div className="pointer-events-none absolute top-4 left-4 w-80 rounded-xl bg-navy-950 p-3.5 text-xs text-white shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{focusPatient.name}</p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: CONVERSATION_META[focusCase.conversation].color }}>
                  {CONVERSATION_META[focusCase.conversation].label}
                </span>
              </div>
              <p className="mt-0.5 text-white/60">
                BP {focusCase.systolic}/{focusCase.diastolic} · since {formatDay(focusCase.resultDay)}
              </p>
              {focusMsg && (
                <p className="mt-2 leading-relaxed text-white/90">
                  <span className="text-white/50">
                    {focusMsg.from === "vani" ? "Vani" : focusMsg.senderName} · Day {focusMsg.day} {focusMsg.time}:
                  </span>{" "}
                  {focusMsg.text}
                </p>
              )}
              <p className="mt-2 text-[10px] text-white/50">Click to open the case</p>
            </div>
          )}
          {active.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-steel-500">No conversations match these filters.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}

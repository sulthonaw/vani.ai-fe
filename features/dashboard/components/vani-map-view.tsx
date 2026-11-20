"use client";

import * as React from "react";
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
import { Bot, Users, Waypoints } from "lucide-react";
import { cn } from "@/libs/utils";
import type { CaseRecord, ConversationStatus } from "../types";
import { CONVERSATION_META } from "../logic/constants";
import { accountById, familyOf } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { Panel } from "./ui-kit";

type VaniData = { count: number };
type GroupData = { status: ConversationStatus; count: number };
type PatientData = { name: string; finding: string; status: ConversationStatus; owner: string; unread: boolean };
type FamilyData = { name: string; relation: string; contacted: boolean };

const hidden = "!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

/** Layout columns: the tree grows from Vani (right) to the left, like a root-cause diagram. */
const COL = { vani: 0, group: -330, patient: -680 };
const ROW = 78;
const GROUP_GAP = 44;
/** Patients per column inside a branch; larger branches wrap into extra columns further left. */
const MAX_ROWS = 4;
const COL_STEP = 470;
const FAMILY_OFFSET = 240;

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
    <div className="relative grid size-[128px] place-items-center rounded-full bg-brand-700 text-white shadow-[0_12px_30px_rgba(41,65,103,0.35)] ring-8 ring-tint">
      <Handle type="source" position={Position.Left} className={hidden} />
      <div className="text-center">
        <Bot className="mx-auto mb-1 size-6" />
        <p className="text-sm font-bold">Vani</p>
        <p className="text-[10px] text-white/70">{data.count} active</p>
      </div>
    </div>
  );
}

function GroupNode({ data }: NodeProps<Node<GroupData>>) {
  const meta = CONVERSATION_META[data.status];
  return (
    <div className="w-[190px] rounded-xl border bg-white px-3 py-2.5 shadow-sm" style={{ borderColor: meta.color }}>
      <Handle type="target" position={Position.Right} className={hidden} />
      <Handle type="source" position={Position.Left} className={hidden} />
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
      className={cn("w-[200px] cursor-pointer rounded-xl border bg-white px-3 py-2 shadow-sm transition hover:shadow-md", data.unread && "vani-pulse")}
      style={{ borderColor: meta.color }}
    >
      <Handle type="target" position={Position.Right} className={hidden} />
      <Handle type="source" position={Position.Left} className={hidden} />
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
      </div>
    </div>
  );
}

function FamilyNode({ data }: NodeProps<Node<FamilyData>>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm",
        data.contacted ? "border-[#7FA3E8] bg-[#EEF3FD] text-brand-700" : "border-[#D6E2F8] bg-white text-steel-500",
      )}
    >
      <Handle type="target" position={Position.Right} className={hidden} />
      <Users className="size-3.5" /> {data.name} · {data.relation}
    </div>
  );
}

const nodeTypes = { vani: VaniNode, group: GroupNode, patient: PatientNode, family: FamilyNode };

const ORDER: ConversationStatus[] = ["urgent", "handed_over", "no_response", "awaiting", "active"];

type Filter = { needsHuman: boolean; mine: boolean; family: boolean };

export function VaniMapView() {
  const { state } = useDemoStore();
  const router = useRouter();
  const account = useActiveAccount();
  const [filter, setFilter] = React.useState<Filter>({ needsHuman: false, mine: false, family: true });
  const [hover, setHover] = React.useState<string | null>(null);
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

  const { nodes, edges } = React.useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const groups = ORDER.map((s) => ({ status: s, cases: active.filter((c) => c.conversation === s) })).filter((g) => g.cases.length);

    // Vertical layout: stack patients group by group, then centre each group on its patients.
    let y = 0;
    const placed: { status: ConversationStatus; top: number; bottom: number; cases: { c: CaseRecord; x: number; y: number }[] }[] = [];
    groups.forEach((g) => {
      const top = y;
      const rowsUsed = Math.min(g.cases.length, MAX_ROWS);
      const rows = g.cases.map((c, i) => ({
        c,
        x: COL.patient - Math.floor(i / MAX_ROWS) * COL_STEP,
        y: top + (i % MAX_ROWS) * ROW,
      }));
      y = top + rowsUsed * ROW + GROUP_GAP;
      placed.push({ status: g.status, top, bottom: top + (rowsUsed - 1) * ROW, cases: rows });
    });
    const totalMid = placed.length ? (placed[0].top + placed[placed.length - 1].bottom) / 2 : 0;

    nodes.push({ id: "vani", type: "vani", position: { x: COL.vani, y: totalMid - 64 + 20 }, data: { count: active.length }, draggable: false });

    placed.forEach((g) => {
      const meta = CONVERSATION_META[g.status];
      const gid = `g-${g.status}`;
      const mid = (g.top + g.bottom) / 2;
      nodes.push({ id: gid, type: "group", position: { x: COL.group, y: mid }, data: { status: g.status, count: g.cases.length }, draggable: false });
      edges.push({
        id: `e-${gid}`,
        source: "vani",
        target: gid,
        type: "smoothstep",
        pathOptions: { borderRadius: 18 },
        style: { stroke: meta.color, strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: meta.color, width: 16, height: 16 },
      } as Edge);

      g.cases.forEach(({ c, x: px, y: py }) => {
        const p = state.patients.find((x) => x.id === c.patientId)!;
        const owner = c.takeoverBy ? accountById(c.takeoverBy)?.name : c.ownerType === "doctor" ? "Dr. Yoga" : accountById(c.coordinatorId)?.name;
        nodes.push({
          id: c.id,
          type: "patient",
          position: { x: px, y: py },
          data: { name: p.name, finding: `BP ${c.systolic}/${c.diastolic}`, status: c.conversation, owner: owner ?? "unassigned", unread: c.unread },
        });
        edges.push({
          id: `e-${c.id}`,
          source: gid,
          target: c.id,
          type: "smoothstep",
          pathOptions: { borderRadius: 14 },
          className: c.conversation === "active" ? "vani-edge-flow" : undefined,
          style: {
            stroke: meta.color,
            strokeWidth: hover === `e-${c.id}` ? 3.5 : 1.75,
            strokeDasharray: c.conversation === "no_response" ? "4 6" : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: meta.color, width: 14, height: 14 },
        } as Edge);

        const fam = familyOf(state, c.patientId);
        if (filter.family && fam) {
          nodes.push({
            id: `fam-${c.id}`,
            type: "family",
            position: { x: px - FAMILY_OFFSET, y: py + 6 },
            data: { name: fam.name, relation: fam.relation, contacted: c.familyContacted },
            draggable: false,
          });
          edges.push({
            id: `ef-${c.id}`,
            source: c.id,
            target: `fam-${c.id}`,
            type: "smoothstep",
            style: { stroke: "#7FA3E8", strokeWidth: 1.5, strokeDasharray: c.familyContacted ? undefined : "3 4" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#7FA3E8", width: 12, height: 12 },
          });
        }
      });
    });
    return { nodes, edges };
  }, [active, state, filter.family, hover]);

  const hoveredCase = hover ? state.cases.find((c) => `e-${c.id}` === hover) : undefined;
  const hoveredMsg = hoveredCase ? [...state.messages].reverse().find((m) => m.caseId === hoveredCase.id) : undefined;
  const hoveredPatient = hoveredCase ? state.patients.find((p) => p.id === hoveredCase.patientId) : undefined;

  const toggle = (k: keyof Filter) => setFilter((f) => ({ ...f, [k]: !f[k] }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Vani Map</h1>
        <p className="text-sm text-steel-500">
          What Vani is doing right now, branching from Vani → status → patient → family. Click a patient to open the case; hover an arrow to see the last message.
        </p>
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
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
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
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.2}
              maxZoom={1.6}
              nodesConnectable={false}
              nodesDraggable={false}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, node) => {
                if (node.type === "patient") router.push(`/dashboard/cases/${node.id}`);
                if (node.type === "family") router.push(`/dashboard/cases/${node.id.replace("fam-", "")}`);
              }}
              onEdgeMouseEnter={(_, e) => setHover(e.id)}
              onEdgeMouseLeave={() => setHover(null)}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#C8CFE0" />
              <Controls showInteractive={false} className="!rounded-xl !border !border-steel-100 !shadow-none" />
            </ReactFlow>
          )}

          {hoveredCase && hoveredPatient && (
            <div className="pointer-events-none absolute top-4 left-4 w-72 rounded-xl bg-navy-950 p-3 text-xs text-white shadow-xl">
              <p className="font-semibold">{hoveredPatient.name}</p>
              <p className="text-white/60">{CONVERSATION_META[hoveredCase.conversation].label}</p>
              {hoveredMsg && (
                <p className="mt-2 leading-relaxed text-white/90">
                  <span className="text-white/50">
                    {hoveredMsg.from === "vani" ? "Vani" : hoveredMsg.senderName} · Day {hoveredMsg.day} {hoveredMsg.time}:
                  </span>{" "}
                  {hoveredMsg.text}
                </p>
              )}
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

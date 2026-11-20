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
type GroupData = { status: ConversationStatus; count: number };
type PatientData = { name: string; finding: string; status: ConversationStatus; owner: string; unread: boolean };
type FamilyData = { name: string; relation: string; contacted: boolean };

const hidden = "!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

/** Layout columns: the orchestrator (Vani) sits on the left and the tree grows to the right. */
const COL = { vani: 0, group: 300, patient: 620 };
/** Vertical distance between patient cards (card is ~50px high, so ~22px clear space). */
const ROW = 72;
/** Extra space between status branches. */
const GROUP_GAP = 36;
/** Family pill sits to the right of the patient card, with a clear gap. */
const FAMILY_OFFSET = 250;

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
    <div className="w-[200px] rounded-xl border bg-white px-3 py-2.5 shadow-sm" style={{ borderColor: meta.color }}>
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
      className="vani-patient-card group relative w-[210px] cursor-pointer rounded-xl border bg-white px-3 py-2 shadow-sm"
      style={{ borderColor: meta.color, ["--ring" as string]: meta.color }}
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
        {data.unread && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-brand-500 ring-2 ring-white" title="Unread reply" />}
        <ArrowUpRight className="size-3.5 shrink-0 text-steel-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}

function FamilyNode({ data }: NodeProps<Node<FamilyData>>) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm",
        data.contacted ? "border-[#7FA3E8] bg-[#EEF3FD] text-brand-700" : "border-[#D6E2F8] bg-white text-steel-500",
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
  const [focus, setFocusState] = React.useState<string | null>(null);
  const leaveTimer = React.useRef<number | undefined>(undefined);
  // Small delay on leave so moving between a card and its line does not flicker.
  const setFocus = React.useCallback((id: string | null) => {
    window.clearTimeout(leaveTimer.current);
    if (id) setFocusState(id);
    else leaveTimer.current = window.setTimeout(() => setFocusState(null), 80);
  }, []);
  React.useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
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

    let y = 0;
    const placed: { status: ConversationStatus; top: number; bottom: number; cases: { c: CaseRecord; x: number; y: number }[] }[] = [];
    groups.forEach((g) => {
      const top = y;
      const rowsUsed = g.cases.length;
      const rows = g.cases.map((c, i) => ({ c, x: COL.patient, y: top + i * ROW }));
      y = top + rowsUsed * ROW + GROUP_GAP;
      placed.push({ status: g.status, top, bottom: top + (rowsUsed - 1) * ROW, cases: rows });
    });
    const totalMid = placed.length ? (placed[0].top + placed[placed.length - 1].bottom) / 2 : 0;

    nodes.push({ id: "vani", type: "vani", position: { x: COL.vani, y: totalMid - 58 + 20 }, data: { count: active.length }, draggable: false, selectable: false });

    placed.forEach((g) => {
      const meta = CONVERSATION_META[g.status];
      const gid = `g-${g.status}`;
      nodes.push({
        id: gid,
        type: "branch",
        position: { x: COL.group, y: (g.top + g.bottom) / 2 },
        data: { status: g.status, count: g.cases.length },
        draggable: false,
        selectable: false,
      });
      edges.push({
        id: `e-${gid}`,
        focusable: false,
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
          selectable: false,
        });
        edges.push({
          id: `e-${c.id}`,
          focusable: false,
          source: gid,
          target: c.id,
          type: "smoothstep",
          pathOptions: { borderRadius: 14 },
          className: c.conversation === "active" ? "vani-edge-flow" : undefined,
          style: {
            stroke: meta.color,
            strokeWidth: 1.75,
            strokeDasharray: c.conversation === "no_response" ? "4 6" : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: meta.color, width: 14, height: 14 },
        } as Edge);

        const fam = familyOf(state, c.patientId);
        if (filter.family && fam) {
          nodes.push({
            id: `fam-${c.id}`,
            type: "family",
            position: { x: px + FAMILY_OFFSET, y: py + 8 },
            data: { name: fam.name, relation: fam.relation, contacted: c.familyContacted },
            draggable: false,
            selectable: false,
          });
          edges.push({
            id: `ef-${c.id}`,
            focusable: false,
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
  }, [active, state, filter.family]);

  // Highlight the hovered branch with CSS only, so React Flow never re-measures or re-renders nodes.
  const focusCss = focusCase
    ? (() => {
        const id = focusCase.id;
        const g = `g-${focusCase.conversation}`;
        const keepNodes = [`[data-id="${id}"]`, `[data-id="fam-${id}"]`, `[data-id="${g}"]`, `[data-id="vani"]`]
          .map((sel) => `.vani-map .react-flow__node${sel}`)
          .join(",");
        const keepEdges = [`e-${id}`, `ef-${id}`, `e-${g}`].map((e) => `.vani-map .react-flow__edge[data-id="${e}"]`).join(",");
        return `.vani-map .react-flow__node,.vani-map .react-flow__edge{opacity:.3}
${keepNodes},${keepEdges}{opacity:1}
.vani-map .react-flow__node[data-id="${id}"] .vani-patient-card{box-shadow:0 0 0 2px var(--ring),0 8px 20px rgba(8,24,50,.12)}
.vani-map .react-flow__edge[data-id="e-${id}"] path,.vani-map .react-flow__edge[data-id="e-${g}"] path{stroke-width:3px}`;
      })()
    : "";

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
        <div className="vani-map relative h-[calc(100vh-300px)] min-h-[520px] border-t border-[#EEF0F4] bg-surface">
          {focusCss && <style>{focusCss}</style>}
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
              edgesFocusable={false}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, node) => {
                if (node.type === "patient" || node.type === "family") router.push(`/dashboard/cases/${caseIdOf(node.id)}`);
              }}
              onNodeMouseEnter={(_, node) => {
                if (node.type === "patient" || node.type === "family") setFocus(caseIdOf(node.id));
              }}
              onNodeMouseLeave={() => setFocus(null)}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#C8CFE0" />
              <Controls showInteractive={false} position="bottom-right" className="!rounded-xl !border !border-steel-100 !shadow-none" />
            </ReactFlow>
          )}

          {active.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-steel-500">No conversations match these filters.</div>
          )}
        </div>

        {/* Details strip: shows the hovered patient, never covers the map */}
        <div className="flex min-h-[60px] items-center gap-4 border-t border-[#EEF0F4] bg-white px-5 py-3 text-xs">
          {focusCase && focusPatient ? (
            <>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: CONVERSATION_META[focusCase.conversation].color }} />
                <span className="font-semibold text-navy-950">{focusPatient.name}</span>
                <span className="text-steel-500">
                  BP {focusCase.systolic}/{focusCase.diastolic} · {CONVERSATION_META[focusCase.conversation].label} · since {formatDay(focusCase.resultDay)}
                </span>
              </span>
              {focusMsg && (
                <span className="min-w-0 flex-1 truncate text-steel-500">
                  <span className="text-steel-300">{focusMsg.from === "vani" ? "Vani" : focusMsg.senderName}:</span> {focusMsg.text}
                </span>
              )}
              <span className="shrink-0 font-medium text-navy-900">Click to open →</span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-steel-500">
              <MousePointerClick className="size-3.5" /> Hover a patient card to trace its branch · click to open the case · drag to move · +/− to zoom
            </span>
          )}
        </div>
      </Panel>
    </div>
  );
}

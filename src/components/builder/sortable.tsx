"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { reorderAction } from "@/app/(app)/builder-actions";

type Kind = "module" | "lesson";
type Dragging = { kind: Kind; id: string; parentId: string; index: number } | null;
interface Ctx {
  dragging: Dragging;
  setDragging: (d: Dragging) => void;
  drop: (kind: Kind, toParentId: string, insertAt: number) => void;
  pending: boolean;
}
const SortCtx = createContext<Ctx | null>(null);

/**
 * Drag-and-drop ordering for the course structure. Wraps server-rendered content; each
 * SortableItem gets a grip handle. The arrow buttons beside each item remain as the
 * keyboard and touch-screen alternative (WCAG 2.5.7).
 */
export function SortableStructure({ scope, courseId, children }: { scope: "tenant" | "platform"; courseId: string; children: ReactNode }) {
  const [dragging, setDragging] = useState<Dragging>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [pending, start] = useTransition();
  const drop = (kind: Kind, toParentId: string, insertAt: number) => {
    const d = dragging;
    setDragging(null);
    if (!d || d.kind !== kind) return;
    // Position after the dragged item is taken out of its list.
    const toIndex = d.parentId === toParentId && d.index < insertAt ? insertAt - 1 : insertAt;
    if (d.parentId === toParentId && toIndex === d.index) return;
    setError(null);
    start(async () => {
      const e = await reorderAction({ scope, courseId, kind, id: d.id, toModuleId: kind === "lesson" ? toParentId : undefined, toIndex });
      setError(e);
      setStatus(e ? "" : `${kind === "module" ? "Module" : "Lesson"} moved to position ${toIndex + 1}.`);
    });
  };
  return (
    <SortCtx.Provider value={{ dragging, setDragging, drop, pending }}>
      {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <p className="mb-3 text-xs text-slate-600">Drag the <GripVertical className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> handle to reorder modules and lessons, or to move a lesson into another module. The arrow buttons do the same from the keyboard or a touch screen.</p>
      <div aria-busy={pending} className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>{children}</div>
      <p role="status" aria-live="polite" className="sr-only">{status}</p>
    </SortCtx.Provider>
  );
}

/** One draggable module or lesson. `parentId` is the version (modules) or module (lessons); `index` its current position. */
export function SortableItem({ kind, id, parentId, index, label, className = "", children }: { kind: Kind; id: string; parentId: string; index: number; label: string; className?: string; children: ReactNode }) {
  const ctx = useContext(SortCtx);
  const ref = useRef<HTMLLIElement>(null);
  const [armed, setArmed] = useState(false); // only the handle starts a drag, so text stays selectable
  const [edge, setEdge] = useState<"before" | "after" | null>(null);
  if (!ctx) return <li className={className}>{children}</li>;
  const active = ctx.dragging?.kind === kind && ctx.dragging.id !== id;
  const self = ctx.dragging?.id === id;
  return (
    <li
      ref={ref}
      draggable={armed}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", label);
        ctx.setDragging({ kind, id, parentId, index });
      }}
      onDragEnd={() => { setArmed(false); setEdge(null); ctx.setDragging(null); }}
      onDragOver={(e) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        const r = ref.current!.getBoundingClientRect();
        setEdge(e.clientY < r.top + r.height / 2 ? "before" : "after");
      }}
      onDragLeave={() => setEdge(null)}
      onDrop={(e) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        const at = edge === "after" ? index + 1 : index;
        setEdge(null);
        ctx.drop(kind, parentId, at);
      }}
      className={`relative ${className} ${self ? "opacity-40" : ""}`}
    >
      {edge && <span aria-hidden className={`pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-teal-600 ${edge === "before" ? "-top-px" : "-bottom-px"}`} />}
      <span
        role="img"
        aria-label={`Drag to move ${label}`}
        title="Drag to reorder"
        onMouseDown={() => setArmed(true)}
        onMouseUp={() => setArmed(false)}
        className={`absolute left-1 hidden cursor-grab select-none rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing md:block ${kind === "module" ? "top-2.5" : "top-1/2 -translate-y-1/2"}`}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </span>
      {children}
    </li>
  );
}

/** Drop target shown inside a module that has no lessons yet. */
export function SortableEmpty({ moduleId, children }: { moduleId: string; children: ReactNode }) {
  const ctx = useContext(SortCtx);
  const [over, setOver] = useState(false);
  const active = ctx?.dragging?.kind === "lesson";
  return (
    <li
      onDragOver={(e) => { if (active) { e.preventDefault(); e.stopPropagation(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { if (active) { e.preventDefault(); e.stopPropagation(); setOver(false); ctx!.drop("lesson", moduleId, 0); } }}
      className={`px-4 py-2 text-xs text-slate-500 ${over ? "bg-teal-50 outline-2 -outline-offset-2 outline-teal-600 outline-dashed" : ""}`}
    >
      {children}
    </li>
  );
}

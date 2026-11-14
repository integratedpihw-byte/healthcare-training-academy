import { fmtDate } from "@/components/ui";
import type { files } from "@/db/schema";

type F = typeof files.$inferSelect;
const size = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Server-rendered list of attached files with an optional remove form. */
export function FileList({ items, removeAction, hidden }: { items: F[]; removeAction?: (fd: FormData) => Promise<void>; hidden?: Record<string, string> }) {
  if (!items.length) return <p className="text-xs text-slate-500">No files attached.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center gap-2">
          <a href={`/api/files/${f.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-700 underline">{f.filename}</a>
          <span className="text-xs text-slate-500">{size(f.sizeBytes)} · {fmtDate(f.createdAt)}{f.scanStatus === "NOT_SCANNED" ? " · not malware-scanned" : ""}</span>
          {removeAction && (
            <form action={removeAction}>
              <input type="hidden" name="fileId" value={f.id} />
              {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <button type="submit" className="text-xs text-red-700 hover:underline" aria-label={`Remove ${f.filename}`}>Remove</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

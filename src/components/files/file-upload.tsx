"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui";

/**
 * Accessible file picker that posts to /api/files. On success it refreshes the page
 * (server-rendered file lists) or hands the new file URL to `onUploaded`.
 */
export function FileUpload({ purpose, entityId, accept, label, hint, onUploaded }: { purpose: string; entityId: string; accept: string; label: string; hint?: string; onUploaded?: (f: { id: string; url: string; filename: string }) => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: string }>({});
  const id = `upload-${purpose}-${entityId}`;
  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) return setState({ error: "Choose a file first." });
    setState({ busy: true });
    const fd = new FormData();
    fd.set("purpose", purpose);
    fd.set("entityId", entityId);
    fd.set("file", file);
    try {
      const res = await fetch("/api/files", { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as { error?: string; id?: string; url?: string; filename?: string };
      if (!res.ok || !j.id) return setState({ error: j.error ?? "Upload failed." });
      setState({ ok: `Uploaded ${j.filename}.` });
      if (input.current) input.current.value = "";
      if (onUploaded) onUploaded({ id: j.id, url: j.url!, filename: j.filename! });
      else router.refresh();
    } catch {
      setState({ error: "Upload failed. Check your connection and try again." });
    }
  }
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} id={id} type="file" accept={accept} aria-describedby={hint ? `${id}-hint` : undefined} className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy-900" />
        <button type="button" onClick={upload} disabled={state.busy} aria-busy={state.busy} className="rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">{state.busy ? "Uploading…" : "Upload"}</button>
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>}
      <div aria-live="polite">
        {state.error && <Alert>{state.error}</Alert>}
        {state.ok && <p className="text-xs text-emerald-700">{state.ok}</p>}
      </div>
    </div>
  );
}

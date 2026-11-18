"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin bar at the top of the window while the next page loads. It listens for clicks on
 * same-site links and finishes when the address changes. It deliberately does not use a
 * route-level loading.tsx: that streams the page and turns "not found" responses into 200s.
 */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

type Phase = "idle" | "loading" | "done";

function Bar() {
  const path = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The address changed: the new page is on screen.
  useEffect(() => {
    setPhase((p) => (p === "loading" ? "done" : p));
  }, [path, search]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("idle"), 350);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const start = () => {
      setPhase("loading");
      if (safety.current) clearTimeout(safety.current);
      safety.current = setTimeout(() => setPhase((p) => (p === "loading" ? "idle" : p)), 15_000);
    };
    const onClick = (e: MouseEvent) => {
      // Capture phase: Next.js links cancel the default click to navigate themselves, so
      // "defaultPrevented" cannot be used to tell whether a navigation is starting.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return; // files and downloads
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page or #anchor
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (safety.current) clearTimeout(safety.current);
    };
  }, []);

  if (phase === "idle") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className={
          "h-full bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.7)] motion-reduce:transition-none " +
          (phase === "loading" ? "w-[85%] transition-[width] duration-[8000ms] ease-out" : "w-full opacity-0 transition-[width,opacity] duration-300")
        }
        style={phase === "loading" ? { animation: "nav-progress-start 8s ease-out" } : undefined}
      />
    </div>
  );
}

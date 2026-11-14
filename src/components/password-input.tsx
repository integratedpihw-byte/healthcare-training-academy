"use client";
import { useState, type ComponentProps } from "react";
import { Input } from "./ui";

/** Password field with a Show / Hide control so people can check what they typed. */
export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pr-16" />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide typed characters" : "Show typed characters"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 min-w-14 rounded-r-md px-3 text-xs font-semibold text-teal-700 hover:bg-slate-50"
      >
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}

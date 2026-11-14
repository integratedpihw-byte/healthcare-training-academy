import "server-only";

/**
 * Model provider abstraction (spec §16). The API key is read server-side only and is
 * never sent to the browser. A deterministic "fake" provider exists for automated tests
 * and is refused in production.
 */
export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}
export interface AiCompletion {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}
export interface AiProvider {
  name: string;
  complete(req: { system: string; messages: AiMessage[]; maxTokens: number }): Promise<AiCompletion>;
}

export class AiUnavailableError extends Error {}

const anthropic = (key: string, model: string): AiProvider => ({
  name: "anthropic",
  async complete({ system, messages, maxTokens }) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, temperature: 0.2 }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        // Do not echo provider bodies to users (may contain request details).
        console.error("AI provider error", res.status);
        throw new AiUnavailableError(res.status === 429 ? "The assistant is busy. Please try again in a minute." : "The assistant is temporarily unavailable.");
      }
      const j = (await res.json()) as { content?: { type: string; text?: string }[]; model?: string; usage?: { input_tokens?: number; output_tokens?: number } };
      const text = (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
      return { text, model: j.model ?? model, inputTokens: j.usage?.input_tokens ?? 0, outputTokens: j.usage?.output_tokens ?? 0 };
    } catch (e) {
      if (e instanceof AiUnavailableError) throw e;
      throw new AiUnavailableError("The assistant is temporarily unavailable.");
    } finally {
      clearTimeout(timer);
    }
  },
});

/** Deterministic provider for tests: summarizes which sources it was given. */
const fake: AiProvider = {
  name: "fake",
  async complete({ system, messages }) {
    const ids = [...system.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]);
    const last = messages[messages.length - 1]?.content ?? "";
    return { text: `Educational answer (test provider) for: ${last.slice(0, 80)}\n\nSources used: ${[...new Set(ids)].map((i) => `[${i}]`).join(" ") || "none"}`, model: "fake", inputTokens: system.length, outputTokens: 20 };
  },
};

export function aiProvider(): AiProvider | null {
  if (process.env.AI_PROVIDER === "fake") {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_FAKE_AI !== "1") return null;
    return fake;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return anthropic(key, process.env.AI_MODEL || "claude-sonnet-5-5");
}

export function aiConfigured() {
  return aiProvider() !== null;
}

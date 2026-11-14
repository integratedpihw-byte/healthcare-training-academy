/**
 * Small per-process TTL cache for expensive, read-only aggregates (dashboard
 * compliance counts). Keys must include everything that changes the answer —
 * always the tenant and the viewing user, because results are RLS-scoped.
 * Each server instance has its own cache; values are at most `ttlMs` old.
 */
const store = new Map<string, { at: number; value: unknown }>();
const MAX = 500;

export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  if (store.size >= MAX) store.delete(store.keys().next().value as string);
  store.set(key, { at: Date.now(), value });
  return value;
}

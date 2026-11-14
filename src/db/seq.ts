/**
 * Awaits Drizzle query builders one after another. Builders are lazy (they run
 * when awaited), so this keeps queries on a transaction's single connection
 * strictly sequential — `Promise.all` would pipeline them concurrently on one
 * pg client, which node-postgres deprecates.
 */
export async function seq<const T extends readonly unknown[]>(items: T): Promise<{ -readonly [K in keyof T]: Awaited<T[K]> }> {
  const out: unknown[] = [];
  for (const item of items) out.push(await item);
  return out as { -readonly [K in keyof T]: Awaited<T[K]> };
}

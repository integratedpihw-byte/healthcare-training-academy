import { describe, expect, it, vi } from "vitest";
import { writeAudit } from "@/lib/audit";

describe("audit redaction", () => {
  it("never stores secrets in audit payloads", async () => {
    const values = vi.fn();
    const db = { insert: () => ({ values }) } as never;
    await writeAudit(db, {
      tenantId: null,
      actorUserId: null,
      action: "x",
      entityType: "user",
      after: { email: "a@b.example", passwordHash: "abc", nested: { mfaSecretEnc: "s", ok: 1 }, list: [{ token: "t" }] },
    });
    const row = values.mock.calls[0][0];
    expect(row.after).toEqual({ email: "a@b.example", passwordHash: "[REDACTED]", nested: { mfaSecretEnc: "[REDACTED]", ok: 1 }, list: [{ token: "[REDACTED]" }] });
  });
});

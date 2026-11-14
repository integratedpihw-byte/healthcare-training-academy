import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, PERMISSIONS, SYSTEM_ROLES } from "@/lib/rbac/catalog";
import { can, facilityScope, type Access } from "@/lib/rbac/access";
import { ungrantable } from "@/lib/rbac/service";
import { NAV, CURRENT_PHASE, visibleNav } from "@/lib/nav";

const access = (entries: [string, "ALL" | string[]][]): Access => ({
  membershipId: "m",
  roles: [],
  grants: new Map(entries.map(([k, v]) => [k as never, v === "ALL" ? "ALL" : new Set(v)])),
});

describe("permission catalog", () => {
  it("every system role references only known permissions", () => {
    for (const r of Object.values(SYSTEM_ROLES)) for (const p of r.permissions) expect(PERMISSIONS).toHaveProperty(p);
  });
  it("organization administrators cannot grant clinical approval (requires a qualified clinician)", () => {
    expect(SYSTEM_ROLES.org_admin.permissions).not.toContain("courses.approve.clinical");
  });
  it("learners have only self-service permissions", () => {
    expect(SYSTEM_ROLES.learner.permissions.sort()).toEqual(["courses.view", "learning.self"]);
  });
  it("facility administrator is the only facility-scoped template", () => {
    expect(Object.entries(SYSTEM_ROLES).filter(([, r]) => r.facilityScoped).map(([k]) => k)).toEqual(["facility_admin"]);
  });
  it("every role can use self-service learning", () => {
    for (const r of Object.values(SYSTEM_ROLES)) expect(r.permissions).toContain("learning.self");
  });
  it("has unique permission keys", () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });
});

describe("can() and facility scope", () => {
  const a = access([["employees.manage", ["f1"]], ["reports.view", "ALL"]]);
  it("tenant-wide grants apply to every facility", () => {
    expect(can(a, "reports.view", "anything")).toBe(true);
    expect(facilityScope(a, "reports.view")).toBeNull();
  });
  it("facility-scoped grants apply only to their facilities", () => {
    expect(can(a, "employees.manage", "f1")).toBe(true);
    expect(can(a, "employees.manage", "f2")).toBe(false);
    expect(can(a, "employees.manage", null)).toBe(false);
    expect(can(a, "employees.manage")).toBe(true);
    expect(facilityScope(a, "employees.manage")).toEqual(["f1"]);
  });
  it("missing permissions are denied", () => {
    expect(can(a, "billing.manage")).toBe(false);
    expect(can(null, "reports.view")).toBe(false);
    expect(facilityScope(a, "billing.manage")).toEqual([]);
  });
});

describe("privilege escalation guard", () => {
  it("blocks granting permissions the actor lacks or holds only per-facility", () => {
    const a = access([["employees.view", "ALL"], ["employees.manage", ["f1"]]]);
    expect(ungrantable(a, ["employees.view"])).toEqual([]);
    expect(ungrantable(a, ["employees.manage", "billing.manage"])).toEqual(["employees.manage", "billing.manage"]);
  });
});

describe("navigation", () => {
  it("lists all 14 main navigation modules from the specification, in order", () => {
    expect(NAV.map((n) => n.label)).toEqual([
      "Dashboard", "Course Catalog", "My Learning", "Training Management", "Employee Management", "Competency Management",
      "Certificates", "Compliance Center", "Instructor Portal", "Reports and Analytics", "Notifications", "Billing", "Administration", "Settings",
    ]);
  });
  it("never shows a module from a future phase", () => {
    const all = visibleNav(() => true);
    expect(all.every((n) => n.phase <= CURRENT_PHASE)).toBe(true);
  });
  it("hides permission-gated modules from learners", () => {
    const learner = new Set(SYSTEM_ROLES.learner.permissions);
    const keys = visibleNav((p) => learner.has(p)).map((n) => n.key);
    expect(keys).not.toContain("admin");
    expect(keys).not.toContain("billing");
    expect(keys).toContain("dashboard");
  });
});

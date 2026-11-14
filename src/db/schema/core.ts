// Tenancy, organizations, identity, roles/permissions and workforce.
import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {
  createdAt,
  employmentStatus,
  facilityType,
  licenseKind,
  membershipStatus,
  pk,
  tenantStatus,
  tenantType,
  tstz,
  updatedAt,
  userStatus,
  verificationStatus,
} from "./_shared";

// ---------------------------------------------------------------------------
// Tenancy & organizations
// ---------------------------------------------------------------------------

/** The isolation boundary. Every tenant-owned row references a tenant. */
export const tenants = pgTable(
  "tenants",
  {
    id: pk(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    type: tenantType().notNull().default("ORGANIZATION"),
    status: tenantStatus().notNull().default("PENDING_APPROVAL"),
    primaryState: char({ length: 2 }).notNull().default("FL"),
    approvedAt: tstz(),
    approvedById: uuid(),
    rejectionReason: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.status)],
);

const tenantId = () =>
  uuid()
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" });
/** Nullable tenant: NULL = platform-global content readable by all tenants. */
const globalTenantId = () => uuid().references(() => tenants.id, { onDelete: "cascade" });
export { tenantId as tenantIdColumn, globalTenantId as globalTenantIdColumn };

export const organizations = pgTable(
  "organizations",
  {
    id: pk(),
    tenantId: tenantId(),
    legalName: text().notNull(),
    displayName: text().notNull(),
    ein: text(),
    phone: text(),
    email: text(),
    addressLine1: text(),
    addressLine2: text(),
    city: text(),
    state: char({ length: 2 }).notNull().default("FL"),
    postalCode: text(),
    /** IANA zone used to display dates and times to this organization's users. */
    timeZone: text().notNull().default("America/New_York"),
    /** Who must use two-step verification: ADMINS (users who manage people or settings), ALL or OFF. */
    mfaPolicy: text().notNull().default("ADMINS"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId)],
);

export const facilities = pgTable(
  "facilities",
  {
    id: pk(),
    tenantId: tenantId(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    facilityType: facilityType().notNull(),
    licenseType: text(),
    licenseNumber: text(),
    licenseExpires: date(),
    /** License and program designations used by regulatory rules (e.g. VFC_PROVIDER, 340B_COVERED_ENTITY). */
    designations: text().array().notNull().default([]),
    addressLine1: text(),
    city: text(),
    state: char({ length: 2 }).notNull().default("FL"),
    postalCode: text(),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.tenantId, t.facilityType)],
);

export const departments = pgTable(
  "departments",
  {
    id: pk(),
    tenantId: tenantId(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    facilityId: uuid().references(() => facilities.id, { onDelete: "set null" }),
    name: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index().on(t.tenantId),
    unique().on(t.tenantId, t.organizationId, t.facilityId, t.name).nullsNotDistinct(),
  ],
);

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** Global identity; reachable only through the system client (not RLS-scoped). */
export const users = pgTable("users", {
  id: pk(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  phone: text(),
  status: userStatus().notNull().default("ACTIVE"),
  isPlatformAdmin: boolean().notNull().default(false),
  emailVerifiedAt: tstz(),
  mfaEnabled: boolean().notNull().default(false),
  mfaSecretEnc: text(),
  /** SHA-256 hashes of unused one-time recovery codes. */
  mfaRecoveryHashes: text().array().notNull().default([]),
  /** Last accepted TOTP time step (a code cannot be used twice). */
  mfaLastStep: bigint({ mode: "number" }),
  failedLoginCount: integer().notNull().default(0),
  lockedUntil: tstz(),
  passwordChangedAt: tstz().notNull().defaultNow(),
  lastLoginAt: tstz(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: pk(),
    /** SHA-256 of the opaque cookie token. The raw token is never stored. */
    tokenHash: text().notNull().unique(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeTenantId: uuid().references(() => tenants.id, { onDelete: "set null" }),
    mfaVerified: boolean().notNull().default(false),
    ipAddress: text(),
    userAgent: text(),
    createdAt: createdAt(),
    lastSeenAt: tstz().notNull().defaultNow(),
    expiresAt: tstz().notNull(),
    revokedAt: tstz(),
  },
  (t) => [index().on(t.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: pk(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().notNull().unique(),
    /** reset | invite (both set a password) or verify (confirms the email address only). */
    purpose: text().notNull().default("reset"),
    expiresAt: tstz().notNull(),
    usedAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId)],
);

/** Fixed-window counters for login / reset / verification rate limiting. */
export const rateLimits = pgTable("rate_limits", {
  key: text().primaryKey(),
  count: integer().notNull().default(0),
  windowStart: tstz().notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Roles & permissions (configurable; enforced in API and database)
// ---------------------------------------------------------------------------

export const permissions = pgTable("permissions", {
  id: pk(),
  key: text().notNull().unique(),
  description: text().notNull(),
  category: text().notNull(),
});

/** tenant_id NULL = system role template shared by all tenants. */
export const roles = pgTable(
  "roles",
  {
    id: pk(),
    tenantId: globalTenantId(),
    key: text().notNull(),
    name: text().notNull(),
    description: text(),
    isSystem: boolean().notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.tenantId, t.key).nullsNotDistinct()],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid()
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    tenantId: globalTenantId(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] }), index().on(t.tenantId)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: membershipStatus().notNull().default("ACTIVE"),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.tenantId, t.userId), index().on(t.userId)],
);

/** facility_id set = role is scoped to one facility (e.g. Facility Administrator). */
export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: pk(),
    tenantId: tenantId(),
    membershipId: uuid()
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    facilityId: uuid().references(() => facilities.id, { onDelete: "cascade" }),
  },
  (t) => [
    index().on(t.tenantId),
    unique().on(t.membershipId, t.roleId, t.facilityId).nullsNotDistinct(),
  ],
);

// ---------------------------------------------------------------------------
// Workforce
// ---------------------------------------------------------------------------

export const employees = pgTable(
  "employees",
  {
    id: pk(),
    tenantId: tenantId(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    employeeNumber: text().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text(),
    phone: text(),
    jobTitle: text().notNull(),
    /** Normalized position code used by the training applicability rules engine. */
    positionCode: text().notNull(),
    jobDuties: text().array().notNull().default([]),
    clinicalExposure: boolean().notNull().default(false),
    bloodborneExposure: boolean().notNull().default(false),
    employmentStatus: employmentStatus().notNull().default("ACTIVE"),
    hireDate: date().notNull(),
    terminationDate: date(),
    primaryFacilityId: uuid().references(() => facilities.id, { onDelete: "set null" }),
    departmentId: uuid().references(() => departments.id, { onDelete: "set null" }),
    supervisorId: uuid().references((): AnyPgColumn => employees.id, { onDelete: "set null" }),
    trainingPathway: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.tenantId, t.employeeNumber),
    index().on(t.tenantId),
    index().on(t.tenantId, t.primaryFacilityId),
    index().on(t.tenantId, t.positionCode),
  ],
);

export const employeeFacilities = pgTable(
  "employee_facilities",
  {
    tenantId: tenantId(),
    employeeId: uuid()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    facilityId: uuid()
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    assignedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.employeeId, t.facilityId] }), index().on(t.tenantId)],
);

export const instructors = pgTable(
  "instructors",
  {
    id: pk(),
    tenantId: globalTenantId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text(),
    bio: text(),
    qualifications: text().array().notNull().default([]),
    credentials: jsonb().notNull().default([]),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.tenantId, t.userId).nullsNotDistinct()],
);

/** External professional licenses and third-party certifications (never issued by the academy). */
export const licenses = pgTable(
  "licenses",
  {
    id: pk(),
    tenantId: tenantId(),
    employeeId: uuid()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    kind: licenseKind().notNull(),
    name: text().notNull(),
    licenseNumber: text().notNull(),
    issuingAuthority: text().notNull(),
    state: char({ length: 2 }),
    issuedOn: date(),
    expiresOn: date(),
    verificationStatus: verificationStatus().notNull().default("UNVERIFIED"),
    verifiedAt: tstz(),
    verifiedById: uuid(),
    /** Where/how the license was verified (e.g. state licensing board lookup). Required to mark VERIFIED. */
    verificationSource: text(),
    notes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.tenantId, t.expiresOn)],
);

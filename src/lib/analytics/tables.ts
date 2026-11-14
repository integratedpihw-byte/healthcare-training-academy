import type { ReportResult } from "@/lib/reports/export";
import { COMPLIANCE_LABEL } from "@/lib/workforce/rules";
import type { Analytics } from "./service";

export const ANALYTICS_TABLES = ["summary", "monthly", "utilization", "facilities", "employees"] as const;
export type AnalyticsTable = (typeof ANALYTICS_TABLES)[number];

/** Turns dashboard data into exportable tables (CSV / Excel / PDF). */
export function analyticsTable(a: Analytics, t: AnalyticsTable, filterNote: string): ReportResult {
  const subtitle = `${a.range.from} to ${a.range.to}${filterNote ? ` · ${filterNote}` : ""}`;
  switch (t) {
    case "summary": {
      const k = a.kpis;
      const rows: [string, string | number][] = [
        ["Employees (filtered)", k.employees], ["Active students", k.activeStudents], ["Published courses", k.courses], ["Course enrollments (period)", k.enrollments],
        ["Completed courses (period)", k.completed], ["Pending courses (open now)", k.pending], ["Overdue assignments (now)", k.overdue], ["Certificates expiring in 60 days", k.expiringCerts],
        ["Failed examinations (period)", k.failedExams], ["Competency pass rate", k.competencyPassRate == null ? "—" : `${k.competencyPassRate}% of ${k.competencySigned}`],
        ["Training compliance", k.compliancePct == null ? "—" : `${k.compliancePct}%`], ["Training hours (period)", k.trainingHours],
      ];
      return { title: "Training analytics summary", subtitle, columns: [{ key: "metric", label: "Metric", width: 3 }, { key: "value", label: "Value", width: 1.5 }], rows: rows.map(([metric, value]) => ({ metric, value })), notes: ["Training compliance = employees with required training in good standing (nothing overdue, expired or missing) ÷ employees with requirements."] };
    }
    case "monthly":
      return { title: "Monthly training trend", subtitle, columns: [{ key: "month", label: "Month" }, { key: "enrollments", label: "Enrollments" }, { key: "completions", label: "Completions" }, { key: "hours", label: "Training hours" }], rows: a.monthly };
    case "utilization":
      return { title: "Course utilization", subtitle, columns: [{ key: "title", label: "Course", width: 3 }, { key: "code", label: "Code" }, { key: "enrollments", label: "Enrollments" }, { key: "completions", label: "Completions" }, { key: "rate", label: "Completion %" }], rows: a.utilization.map((u) => ({ ...u, rate: u.ratePct ?? "—" })) };
    case "facilities":
      return { title: "Facility compliance ranking", subtitle, columns: [{ key: "rank", label: "#", width: 0.4 }, { key: "facility", label: "Facility", width: 2.5 }, { key: "employees", label: "Employees with requirements" }, { key: "compliant", label: "In good standing" }, { key: "pct", label: "Compliance %" }], rows: a.facilityRanking.map((f, i) => ({ rank: i + 1, ...f, pct: f.pct ?? "—" })) };
    case "employees":
      return { title: "Employee training status", subtitle, columns: [{ key: "name", label: "Employee", width: 1.6 }, { key: "number", label: "Employee ID" }, { key: "position", label: "Position", width: 1.5 }, { key: "facility", label: "Facility", width: 1.5 }, { key: "status", label: "Training status" }, { key: "open", label: "Open" }, { key: "overdue", label: "Overdue" }], rows: a.employees.map((e) => ({ ...e, status: COMPLIANCE_LABEL[e.status].label })) };
  }
}

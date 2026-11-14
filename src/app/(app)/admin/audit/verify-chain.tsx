"use client";
import { useActionState } from "react";
import { verifyAuditAction } from "../actions";
import { Alert, Card } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function VerifyChain() {
  const [report, action] = useActionState(verifyAuditAction, undefined);
  return (
    <Card title="Integrity check">
      <form action={action} className="flex flex-wrap items-center gap-4">
        <SubmitButton variant="secondary" pendingText="Verifying…">Verify audit chain</SubmitButton>
        {report && (report.valid
          ? <Alert tone="green">All {report.entries} entries verified: every hash matches and every link is intact.</Alert>
          : <Alert>Chain broken at entry #{report.firstBrokenId}. Contact platform support immediately.</Alert>)}
      </form>
    </Card>
  );
}

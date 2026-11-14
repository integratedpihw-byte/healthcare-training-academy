"use client";
import { ActionForm } from "@/components/action-form";
import { Field, Select, Textarea } from "@/components/ui";
import { reviewAction } from "../actions";

export function ReviewForm({ courseId }: { courseId: string }) {
  return (
    <ActionForm action={reviewAction} submitLabel="Submit feedback" variant="secondary">
      <input type="hidden" name="courseId" value={courseId} />
      <Field label="Rating" name="rating">
        <Select id="rating" name="rating" defaultValue="5">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} — {["", "Poor", "Fair", "Good", "Very good", "Excellent"][n]}</option>)}
        </Select>
      </Field>
      <Field label="Comments (optional)" name="comment"><Textarea id="comment" name="comment" rows={3} maxLength={1000} /></Field>
    </ActionForm>
  );
}

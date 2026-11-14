"use client";
import { FileUpload } from "@/components/files/file-upload";

/** Uploads lesson media and places the private file URL in the lesson's media field. */
export function LessonMediaUpload({ lessonId, inputId }: { lessonId: string; inputId: string }) {
  return (
    <FileUpload
      purpose="LESSON_MEDIA"
      entityId={lessonId}
      accept="video/mp4,application/pdf,image/png,image/jpeg,image/webp"
      label="Upload lesson media (MP4 video, PDF handout or image)"
      hint="After uploading, the file link is placed in “Media link” — set the video length if needed, then save the lesson."
      onUploaded={(f) => {
        const el = document.getElementById(inputId) as HTMLInputElement | null;
        if (el) {
          el.value = f.url;
          el.focus();
        }
      }}
    />
  );
}

/**
 * Authoring format for library courses shipped with the platform. Content files are
 * seeded as platform-global courses (tenant_id NULL) in IN_REVIEW status; they reach
 * learners only after the recorded approval workflow (Review → Clinical → Compliance).
 */
export type LessonKind = "TEXT" | "PRESENTATION" | "VIDEO" | "ILLUSTRATION" | "INTERACTIVE" | "CASE_STUDY" | "KNOWLEDGE_CHECK" | "DOWNLOAD";

export interface CheckQuestion {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  /** Option id (single answer) or ids (multiple select). */
  correct: string | string[];
  explanation: string;
}

export interface LessonContent {
  title: string;
  type: LessonKind;
  durationMinutes: number;
  /** Markdown. PRESENTATION: slides separated by a line containing only `---`. */
  body?: string;
  mediaUrl?: string;
  /** KNOWLEDGE_CHECK: { questions: CheckQuestion[] }; VIDEO: { durationSeconds?: number }. */
  mediaMeta?: { questions?: CheckQuestion[]; durationSeconds?: number };
  isRequired?: boolean;
}

export interface ExamQuestion {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_SELECT" | "SCENARIO";
  prompt: string;
  options: { id: string; text: string }[];
  correct: string | string[];
  explanation: string;
  difficulty?: 1 | 2 | 3;
}

export interface Reference {
  title: string;
  publisher: string;
  url: string;
  publishedOn?: string;
  accessedOn: string;
}

export interface RegulatoryReference {
  agency: string;
  citation: string;
  title: string;
  url: string;
}

export interface CourseContent {
  code: string;
  title: string;
  categorySlug: string;
  isRequiredByDefault: boolean;
  certificateEligible: boolean;
  passingScore: number;
  /** Only set where a verified regulatory or accreditation frequency exists. */
  renewalMonths: number | null;
  renewalBasis?: string;
  estimatedMinutes: number;
  clinicalReviewRequired: boolean;
  description: string;
  targetAudience: string;
  prerequisites: string[];
  completionCriteria: string;
  objectives: string[];
  regulatoryReferences: RegulatoryReference[];
  sourceReferences: Reference[];
  modules: { title: string; summary: string; lessons: LessonContent[] }[];
  finalExam: { title: string; passingScore: number; questionCount: number; questions: ExamQuestion[] };
}

export const AUTHOR_NOTE =
  "Complete Healthcare Innovative Training Academy content team (AI-assisted draft — requires review by a qualified subject-matter expert before use)";

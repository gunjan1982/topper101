export type QuestionType = "long" | "medium" | "short";
export type FrequencyTag = "high" | "medium" | "low";
export type SubscriptionTier = "free" | "exam_pass" | "full_archive";

export interface Course {
  id: string;
  code: string;
  name: string;
  year: number;
  stream: "core" | "counselling" | "clinical" | "organisational" | "common";
}

export interface Question {
  id: string;
  course_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  model_answer: string | null;
  frequency_tag: FrequencyTag | null;
  is_published: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  enrolled_courses: string[];
  exam_date: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export const PRICING = {
  exam_pass: { label: "Exam Pass", paise: 29900, display: "₹299/month" },
  full_archive: { label: "Full Archive", paise: 49900, display: "₹499/month" },
} as const;

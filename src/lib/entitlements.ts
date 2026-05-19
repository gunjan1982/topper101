import { nextScheduledExam } from './examSchedule';

export const FREE_SUBJECT_UNLOCK_SOURCE = 'signup_free';
export const REFERRAL_SUBJECT_UNLOCK_SOURCE = 'referral';
export const PURCHASE_SUBJECT_UNLOCK_SOURCE = 'purchase';
export const REFERRAL_REWARD_LIMIT = 3;

export type PlanTier = 'free' | 'pass' | 'pro';

export type EntitlementRow = {
  course_code: string | null;
  entitlement_type: string;
  source: string;
  expires_at: string | null;
};

type SupabaseError = { message: string } | null;

type SelectBuilder<T> = PromiseLike<{ data: T | null; error: SupabaseError }> & {
  eq: (...args: unknown[]) => SelectBuilder<T>;
};

type SupabaseLike = {
  from: (table: string) => {
    select: (columns?: string) => SelectBuilder<unknown>;
    upsert: (
      values: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => PromiseLike<{ error: SupabaseError }>;
  };
};

function table(supabase: unknown, name: string) {
  return (supabase as SupabaseLike).from(name);
}

export function activeSubjectEntitlements(entitlements: EntitlementRow[] | null | undefined, now = new Date()) {
  return (entitlements ?? [])
    .filter((entitlement) => (
      entitlement.entitlement_type === 'subject_unlock' &&
      entitlement.course_code &&
      (!entitlement.expires_at || new Date(entitlement.expires_at) > now)
    ));
}

export function unlockedCourseCodes(entitlements: EntitlementRow[] | null | undefined, now = new Date()) {
  return new Set(activeSubjectEntitlements(entitlements, now).map((entitlement) => entitlement.course_code as string));
}

export function hasFullQuestionBankAccess(planTier: string | null | undefined) {
  return planTier === 'pro';
}

export function canAccessCourse({
  planTier,
  courseCode,
  entitlements,
}: {
  planTier: string | null | undefined;
  courseCode: string;
  entitlements: EntitlementRow[] | null | undefined;
}) {
  return hasFullQuestionBankAccess(planTier) || unlockedCourseCodes(entitlements).has(courseCode);
}

export function firstFreeSubject(selectedPapers: readonly string[]) {
  return nextScheduledExam(selectedPapers)?.courseCode ?? selectedPapers[0] ?? null;
}

export async function grantSubjectEntitlement({
  supabase,
  userId,
  courseCode,
  source,
  sourceRef,
  expiresAt,
  metadata = {},
}: {
  supabase: unknown;
  userId: string;
  courseCode: string;
  source: 'signup_free' | 'referral' | 'purchase' | 'admin';
  sourceRef?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await table(supabase, 'user_entitlements')
    .upsert({
      user_id: userId,
      entitlement_type: 'subject_unlock',
      course_code: courseCode,
      source,
      source_ref: sourceRef ?? null,
      expires_at: expiresAt ?? null,
      metadata,
    }, { onConflict: 'user_id,entitlement_type,course_code,source' });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchSubjectEntitlements(supabase: unknown, userId: string) {
  const { data, error } = await table(supabase, 'user_entitlements')
    .select('course_code, entitlement_type, source, expires_at')
    .eq('user_id', userId)
    .eq('entitlement_type', 'subject_unlock');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EntitlementRow[];
}

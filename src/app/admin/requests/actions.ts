'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTES } from '@/lib/routes';
import { revalidatePath } from 'next/cache';

export type ActionResponse = 
  | { success: true }
  | { error: string };

/**
 * Approve and mark the answer as human reviewed.
 * Updates reviewed_by_human = true and answer_status = 'published'.
 */
export async function approveQuestionAnswer(formData: FormData): Promise<ActionResponse> {
  const questionId = String(formData.get('question_id') ?? '');
  const aiAnswer = formData.get('ai_answer') ? String(formData.get('ai_answer')).trim() : null;
  const textbookPageStr = formData.get('textbook_page');
  const textbookExcerpt = formData.get('textbook_excerpt') ? String(formData.get('textbook_excerpt')).trim() : null;

  if (!questionId) {
    return { error: 'Question ID is required' };
  }

  let textbookPage: number | null = null;
  if (textbookPageStr !== null && textbookPageStr !== '') {
    const parsed = parseInt(String(textbookPageStr), 10);
    if (!isNaN(parsed)) {
      textbookPage = parsed;
    }
  }

  const admin = createAdminClient();

  const updateData: {
    reviewed_by_human: boolean;
    answer_status: string;
    ai_answer?: string;
    textbook_page?: number | null;
    textbook_excerpt?: string | null;
  } = {
    reviewed_by_human: true,
    answer_status: 'published',
  };

  if (aiAnswer !== null) {
    updateData.ai_answer = aiAnswer;
  }
  updateData.textbook_page = textbookPage;
  updateData.textbook_excerpt = textbookExcerpt || null;

  const { error } = await admin
    .from('questions')
    .update(updateData)
    .eq('id', questionId);

  if (error) {
    console.error('Failed to approve question:', error);
    return { error: error.message };
  }

  revalidatePath(ROUTES.adminRequests);
  return { success: true };
}

/**
 * Save draft updates without approving or publishing the answer.
 */
export async function saveQuestionDraft(formData: FormData): Promise<ActionResponse> {
  const questionId = String(formData.get('question_id') ?? '');
  const aiAnswer = formData.get('ai_answer') ? String(formData.get('ai_answer')).trim() : null;
  const textbookPageStr = formData.get('textbook_page');
  const textbookExcerpt = formData.get('textbook_excerpt') ? String(formData.get('textbook_excerpt')).trim() : null;
  const status = String(formData.get('answer_status') ?? 'draft');

  if (!questionId) {
    return { error: 'Question ID is required' };
  }

  let textbookPage: number | null = null;
  if (textbookPageStr !== null && textbookPageStr !== '') {
    const parsed = parseInt(String(textbookPageStr), 10);
    if (!isNaN(parsed)) {
      textbookPage = parsed;
    }
  }

  const admin = createAdminClient();

  const updateData: {
    answer_status: string;
    ai_answer?: string;
    textbook_page?: number | null;
    textbook_excerpt?: string | null;
  } = {
    answer_status: status,
  };

  if (aiAnswer !== null) {
    updateData.ai_answer = aiAnswer;
  }
  updateData.textbook_page = textbookPage;
  updateData.textbook_excerpt = textbookExcerpt || null;

  const { error } = await admin
    .from('questions')
    .update(updateData)
    .eq('id', questionId);

  if (error) {
    console.error('Failed to save question draft:', error);
    return { error: error.message };
  }

  revalidatePath(ROUTES.adminRequests);
  return { success: true };
}

/**
 * Update a support request status and admin notes.
 */
export async function updateSupportRequest(formData: FormData): Promise<void> {
  const requestId = String(formData.get('request_id') ?? '');
  const status = String(formData.get('status') ?? 'open');
  const adminNotes = String(formData.get('admin_notes') ?? '').trim();

  if (!requestId) {
    throw new Error('Request ID is required');
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('support_requests')
    .update({
      status,
      admin_notes: adminNotes || null,
    })
    .eq('id', requestId);

  if (error) {
    console.error('Failed to update support request:', error);
    throw new Error(error.message);
  }

  revalidatePath(ROUTES.adminRequests);
}

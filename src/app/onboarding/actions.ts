'use server';

import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { grantSubjectEntitlement } from '@/lib/entitlements';
import { ROUTES } from '@/lib/routes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseVerificationDocument } from '@/lib/gemini';
import { COURSE_CATALOG } from '@/lib/courseCatalog';



export async function updateYear(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, year, stream: year === 1 ? null : undefined },
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/onboarding', 'layout');
  
  if (year === 2) {
    redirect(ROUTES.onboardingStream);
  } else {
    // For Year 1, we skip stream selection
    redirect(ROUTES.onboardingPapers);
  }
}

export async function updateStream(stream: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, year: 2, stream },
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/onboarding', 'layout');
  redirect(ROUTES.onboardingPapers);
}

export async function completeOnboarding(
  papers: string[],
  meta?: { year: number; stream: string | null; startedAt: number; phone?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (papers.length === 0) {
    throw new Error('Please select at least one paper.');
  }

  const updateData: Record<string, unknown> = {
    year: meta?.year,
    stream: meta?.year === 1 ? null : meta?.stream,
    selected_papers: papers,
    onboarding_complete: true
  };

  if (meta?.phone?.trim()) {
    updateData.phone = meta.phone.trim();
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  // PostHog: onboarding_completed
  const timeToComplete = meta?.startedAt
    ? Math.round((Date.now() - meta.startedAt) / 1000)
    : null;

  await captureServerEvent(user.id, 'onboarding_completed', {
    year: meta?.year ?? null,
    stream: meta?.stream ?? null,
    papers_selected: papers,
    time_to_complete: timeToComplete,
  });

  revalidatePath('/onboarding', 'layout');
  redirect(ROUTES.onboardingFreeSubject);
}

/**
 * Final onboarding step: user picks their one free subject to unlock.
 * Idempotent — if they already have a signup_free entitlement, skip the grant.
 */
export async function grantFreeSubject(courseCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (!courseCode) {
    throw new Error('Please select a subject to unlock.');
  }

  // Guard: check if already has a signup_free entitlement
  const { data: existing } = await supabase
    .from('user_entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('entitlement_type', 'subject_unlock')
    .eq('source', 'signup_free')
    .maybeSingle();

  if (!existing) {
    // Guard: check verification status
    const { data: verification } = await supabase
      .from('student_verifications')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'verified')
      .maybeSingle();

    if (!verification) {
      throw new Error('Please verify your student status to unlock your free subject.');
    }

    await grantSubjectEntitlement({
      supabase,
      userId: user.id,
      courseCode,
      source: 'signup_free',
      metadata: { reason: 'User-selected free subject at onboarding' },
    });

    await captureServerEvent(user.id, 'free_subject_selected', {
      course_code: courseCode,
    });
  }

  revalidatePath(ROUTES.dashboard, 'layout');
  redirect(ROUTES.dashboard);
}

export async function verifyStudentDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { status: 'error', message: 'No file uploaded.' };
  }

  // Basic validation
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!allowedMimeTypes.includes(file.type)) {
    return { status: 'error', message: 'Invalid file format. Only PDF, PNG, JPG, and JPEG are supported.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { status: 'error', message: 'File is too large. Maximum allowed size is 10MB.' };
  }

  try {
    // Read file and parse with Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const result = await parseVerificationDocument(base64Data, file.type);

    if (result.is_tampered) {
      return {
        status: 'error',
        message: `Verification failed: The document appears to be digitally modified or generated. Please upload a direct, unmodified photo of your physical card or the official PDF from the IGNOU portal.`
      };
    }

    if (!result.valid_mapc || result.document_type === 'invalid') {
      return { 
        status: 'error', 
        message: 'Verification failed: The document could not be verified as a valid IGNOU MAPC psychology card. Please ensure your name, enrollment number, and programme are clearly visible.' 
      };
    }

    if (!result.enrollment_number) {
      return { status: 'error', message: 'Could not read enrollment number from the document. Please upload a clearer image.' };
    }

    // Check if this enrollment number is already verified by another user
    const { data: duplicate } = await supabase
      .from('student_verifications')
      .select('user_id')
      .eq('enrollment_number', result.enrollment_number)
      .neq('user_id', user.id)
      .maybeSingle();

    if (duplicate) {
      return { 
        status: 'error', 
        message: 'This enrollment number has already been registered and verified by another account. If you believe this is an error, contact support.' 
      };
    }

    // Upload to private Supabase Storage
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${user.id}/verify_${Date.now()}.${fileExt}`;
    
    // Ensure bucket is initialized
    try {
      await supabase.storage.createBucket('admit_cards', { public: false });
    } catch {
      // Bucket might already exist or script handles it, ignore
    }

    const { error: uploadError } = await supabase.storage
      .from('admit_cards')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('File upload to Supabase Storage failed:', uploadError.message);
      return { status: 'error', message: 'Failed to save document. Please try again.' };
    }

    const { data: existingVerification } = await supabase
      .from('student_verifications')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'verified')
      .maybeSingle();

    const isNewVerification = !existingVerification;

    // Insert verification record
    const { error: verifyError } = await supabase
      .from('student_verifications')
      .upsert({
        user_id: user.id,
        enrollment_number: result.enrollment_number,
        document_type: result.document_type,
        file_url: filePath,
        status: 'verified',
        raw_ocr_data: result,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (verifyError) {
      console.error('Verification insert failed:', verifyError.message);
      return { status: 'error', message: 'Failed to record student verification state.' };
    }

    if (isNewVerification) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();
      const currentCredits = userProfile?.credits ?? 0;
      await supabase
        .from('users')
        .update({ credits: currentCredits + 1 })
        .eq('id', user.id);
    }

    // PostHog event
    await captureServerEvent(user.id, 'student_verified', {
      document_type: result.document_type,
      enrollment_number: result.enrollment_number,
    });

    if (result.document_type === 'admit_card') {
      // Determine Year & Stream dynamically based on course codes
      const theoryCodes = COURSE_CATALOG.map(c => c.code);
      const selectedPapers = result.extracted_papers
        .map(p => p.toUpperCase().trim())
        .filter(p => theoryCodes.includes(p));

      if (selectedPapers.length === 0) {
        return { 
          status: 'error', 
          message: 'Admit Card verified, but could not identify any standard MAPC theory papers. Please configure your subjects manually.' 
        };
      }

      // Check for Year 2 papers
      const hasYear2Papers = selectedPapers.some(code => {
        const item = COURSE_CATALOG.find(c => c.code === code);
        return item && item.year === 2;
      });
      const year = hasYear2Papers ? 2 : 1;

      // Determine stream from Year 2 papers (first matching stream in CATALOG)
      let stream: string | null = null;
      if (year === 2) {
        for (const code of selectedPapers) {
          const item = COURSE_CATALOG.find(c => c.code === code);
          if (item && item.stream && item.stream !== 'Common') {
            stream = item.stream;
            break;
          }
        }
      }

      // Auto-onboard the user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          year,
          stream,
          selected_papers: selectedPapers,
          onboarding_complete: true,
          name: result.student_name || undefined
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update user profile during auto-onboard:', updateError.message);
        return { status: 'error', message: 'Failed to update your subject configuration.' };
      }

      revalidatePath('/onboarding', 'layout');
      return { 
        status: 'success', 
        document_type: 'admit_card', 
        papers: selectedPapers, 
        year, 
        stream 
      };
    } else {
      // It is an ID Card, update name only and verify, but don't complete onboarding unless papers already selected
      const { data: userProfile } = await supabase
        .from('users')
        .select('selected_papers')
        .eq('id', user.id)
        .single();

      const hasPapers = ((userProfile?.selected_papers as string[] | null) ?? []).length > 0;

      await supabase
        .from('users')
        .update({
          name: result.student_name || undefined,
          onboarding_complete: hasPapers ? true : undefined
        })
        .eq('id', user.id);

      return { 
        status: 'success', 
        document_type: 'id_card', 
        enrollment_number: result.enrollment_number, 
        student_name: result.student_name,
        redirect_to: hasPapers ? ROUTES.onboardingFreeSubject : ROUTES.onboardingYear
      };
    }
  } catch (error: unknown) {
    console.error('Student verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during parsing.';
    return { status: 'error', message: errorMessage };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isGoogleAuthEnabled } from '@/lib/authConfig';
import { safeNextPath } from '@/lib/navigation';
import { ROUTES } from '@/lib/routes';
import { captureServerEvent } from '@/lib/posthog-server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

async function authCallbackUrl(next: string) {
  const headerStore = await headers();
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    vercelProductionUrl ??
    headerStore.get('origin') ??
    'http://localhost:3000';

  return `${origin}${ROUTES.authCallback}?next=${encodeURIComponent(next)}`;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const redirectTo = safeNextPath(formData.get('redirectTo') as string | null);

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await captureServerEvent(user.id, 'user_logged_in', { auth_provider: 'email' });
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const redirectTo = safeNextPath(formData.get('redirectTo') as string | null);
  const phone = (formData.get('phone') as string | null)?.trim() || null;

  // Retrieve referral code from form data or referer URL query param
  let referralCode = (formData.get('referral_code') as string | null)?.trim() || null;
  if (!referralCode) {
    const headerStore = await headers();
    const referer = headerStore.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        referralCode = refererUrl.searchParams.get('ref')?.trim() || null;
      } catch {
        // ignore
      }
    }
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        phone,
        referred_by: referralCode,
      },
    },
  };

  const { data: signupData, error } = await supabase.auth.signUp(data);

  if (error) {
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Insert referral row if code exists and refers to a valid user
  if (signupData?.user?.id && referralCode) {
    try {
      const admin = createAdminClient();
      const { data: referrerUser } = await admin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (referrerUser) {
        await admin.from('referrals').insert({
          referrer_user_id: referrerUser.id,
          referred_user_id: signupData.user.id,
          referral_code: referralCode,
          status: 'pending',
        });
      }
    } catch (err) {
      console.error('Error inserting referral record:', err);
    }
  }

  // PostHog: user_signed_up
  if (signupData?.user?.id) {
    await captureServerEvent(signupData.user.id, 'user_signed_up', {
      auth_provider: 'email',
      referral_code: referralCode || null,
      phone_present: Boolean(phone),
    });
  }

  revalidatePath('/', 'layout');
  redirect(`${ROUTES.login}?message=${encodeURIComponent('Check your email to confirm your account')}&next=${encodeURIComponent(redirectTo)}`);
}

export async function signInWithGoogle(formData?: FormData) {
  if (!isGoogleAuthEnabled()) {
    redirect(`${ROUTES.login}?error=${encodeURIComponent('Google sign-in is not enabled yet. Please use email login for now.')}`);
  }

  const supabase = await createClient();
  const redirectTo = safeNextPath(formData?.get('redirectTo') as string | null);
  const referralCode = (formData?.get('referral_code') as string | null)?.trim() || null;

  let nextParam = redirectTo;
  if (referralCode) {
    const separator = nextParam.includes('?') ? '&' : '?';
    nextParam = `${nextParam}${separator}ref=${encodeURIComponent(referralCode)}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: await authCallbackUrl(nextParam),
    },
  });

  if (error) {
    redirect(`${ROUTES.login}?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(ROUTES.login);
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) {
    redirect(`${ROUTES.resetPassword}?error=${encodeURIComponent('Email is required')}`);
  }

  const supabase = await createClient();
  const redirectTo = await authCallbackUrl('/reset-password/update');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    redirect(`${ROUTES.resetPassword}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${ROUTES.resetPassword}?message=${encodeURIComponent('Password reset link sent! Check your email.')}`);
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  if (!password) {
    redirect(`/reset-password/update?error=${encodeURIComponent('Password is required')}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password/update?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${ROUTES.login}?message=${encodeURIComponent('Password updated successfully. Please log in.')}`);
}

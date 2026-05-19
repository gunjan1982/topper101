'use server';

import { createClient } from '@/lib/supabase/server';
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

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        phone,
        referred_by: (formData.get('referral_code') as string | null)?.trim() || null,
      },
    },
  };

  const referralCode = formData.get('referral_code') as string | null;

  const { data: signupData, error } = await supabase.auth.signUp(data);

  if (error) {
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`);
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: await authCallbackUrl(redirectTo),
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

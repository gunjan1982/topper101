'use client';

import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';

export default function PostHogIdentify({
  userId,
  email,
  phone,
}: {
  userId: string;
  email?: string | null;
  phone?: string | null;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog && userId) {
      posthog.identify(userId, { email: email ?? undefined, phone: phone ?? undefined });
    }
  }, [posthog, userId, email, phone]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';

export default function PostHogIdentify({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog && userId) {
      posthog.identify(userId, { email: email ?? undefined });
    }
  }, [posthog, userId, email]);

  return null;
}

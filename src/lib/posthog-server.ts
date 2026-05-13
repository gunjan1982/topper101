import { PostHog } from 'posthog-node';

// Singleton server-side PostHog client
// Used in server actions and API routes
let client: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 1,     // Flush immediately for server actions
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Fire-and-forget server-side event capture.
 * Wraps the PostHog client so a missing key never crashes prod.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {}
) {
  try {
    const ph = getPostHogClient();
    ph.capture({ distinctId, event, properties });
    await ph.flush();
  } catch (err) {
    // Never let analytics failures crash the app
    console.warn('[PostHog]', event, err);
  }
}

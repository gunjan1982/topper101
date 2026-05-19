'use client';

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import posthog from "posthog-js";

export default function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });

      const key = 'topper101_visitor_id';
      let anonymousId = window.localStorage.getItem(key);
      if (!anonymousId) {
        anonymousId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(key, anonymousId);
      }

      fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          anonymousId,
          path: pathname,
          url,
          referrer: document.referrer || null,
        }),
      }).catch(() => {});
    }
  }, [pathname, searchParams]);

  return null;
}

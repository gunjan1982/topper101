import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingIncludes: {
    '/courses/[courseCode]': ['./data/textbooks/**/*.json'],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation + project — set SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN in CI/Vercel
  silent: !process.env.CI,
  // Only upload source maps when SENTRY_AUTH_TOKEN is present
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  disableLogger: true,
  automaticVercelMonitors: true,
});

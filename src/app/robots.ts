import { ROUTES } from '@/lib/routes';
import type { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.topper101.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [ROUTES.home, ROUTES.guide, ROUTES.career],
      disallow: [
        ROUTES.login,
        ROUTES.signup,
        ROUTES.resetPassword,
        ROUTES.dashboard,
        ROUTES.pricing,
        ROUTES.support,
        ROUTES.settings,
        ROUTES.planner,
        ROUTES.concepts,
        '/courses',
        '/onboarding',
        '/admin',
        '/api',
        '/auth',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

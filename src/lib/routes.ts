export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  pricing: '/pricing',
  guide: '/guide',
  career: '/career',
  support: '/support',
  settings: '/settings',
  onboardingYear: '/onboarding/year',
  onboardingStream: '/onboarding/stream',
  onboardingPapers: '/onboarding/papers',
  onboardingFreeSubject: '/onboarding/free-subject',
  authCallback: '/auth/callback',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminRequests: '/admin/requests',
} as const;

export const AUTH_ROUTE_PREFIXES = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.resetPassword,
] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.dashboard,
  '/onboarding',
  '/courses',
  ROUTES.pricing,
  ROUTES.support,
  ROUTES.settings,
] as const;

export const DASHBOARD_NAV_LINKS = [
  { href: ROUTES.dashboard, label: 'Dashboard' },
  { href: ROUTES.guide, label: 'Guide' },
  { href: ROUTES.pricing, label: 'Pricing' },
  { href: ROUTES.support, label: 'Help' },
  { href: ROUTES.settings, label: 'Settings' },
] as const;

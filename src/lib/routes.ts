export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  pricing: '/pricing',
  settings: '/settings',
  onboardingYear: '/onboarding/year',
  onboardingStream: '/onboarding/stream',
  onboardingPapers: '/onboarding/papers',
  onboardingFreeSubject: '/onboarding/free-subject',
  authCallback: '/auth/callback',
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
  ROUTES.settings,
] as const;

export const DASHBOARD_NAV_LINKS = [
  { href: ROUTES.dashboard, label: 'Dashboard' },
  { href: ROUTES.pricing, label: 'Pricing' },
  { href: ROUTES.settings, label: 'Settings' },
] as const;

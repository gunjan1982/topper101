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
  planner: '/planner',
  concepts: '/concepts',
  mockTest: (courseCode: string) => `/courses/${courseCode}/mock-test`,
} as const;

export const AUTH_ROUTE_PREFIXES = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.resetPassword,
] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.dashboard,
  ROUTES.concepts,
  '/onboarding',
  '/courses',
  ROUTES.pricing,
  ROUTES.support,
  ROUTES.settings,
  ROUTES.planner,
] as const;

export const DASHBOARD_NAV_LINKS = [
  { href: ROUTES.dashboard, label: 'Dashboard' },
  { href: ROUTES.concepts, label: 'Concept Tree' },
  { href: ROUTES.planner, label: 'Study Planner' },
  { href: ROUTES.guide, label: 'Guide' },
  { href: ROUTES.pricing, label: 'Pricing' },
  { href: ROUTES.support, label: 'Help' },
  { href: ROUTES.settings, label: 'Settings' },
] as const;

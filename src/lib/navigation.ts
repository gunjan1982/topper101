import { ROUTES } from './routes';

export function safeNextPath(value: string | null | undefined, fallback = ROUTES.dashboard) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

export function withRedirectTo(path: string, redirectTo: string) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}next=${encodeURIComponent(safeNextPath(redirectTo))}`;
}

export function isGoogleAuthEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
}

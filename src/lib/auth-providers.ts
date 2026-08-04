/** True when Google OAuth client credentials are configured for Auth.js. */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()
  );
}

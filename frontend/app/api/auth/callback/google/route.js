import { PUBLIC_API_BASE_URL } from '@/lib/config';

/**
 * Google redirects here because this is the redirect URI registered in Google Cloud Console.
 * Forward the browser, query string intact, to the API, which finishes sign-in (ADR-020).
 * @param {Request} request
 */
export function GET(request) {
  const { search } = new URL(request.url);
  // The API base may be relative (same-site rewrite), so resolve it against this request.
  const target = new URL(`${PUBLIC_API_BASE_URL}/auth/google/callback${search}`, request.url);
  return Response.redirect(target, 302);
}

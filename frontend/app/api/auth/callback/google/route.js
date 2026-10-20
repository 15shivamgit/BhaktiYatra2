import { PUBLIC_API_BASE_URL } from '@/lib/config';

/**
 * Google redirects here because this is the redirect URI registered in Google Cloud Console.
 * Forward the browser, query string intact, to the API, which finishes sign-in (ADR-020).
 * @param {Request} request
 */
export function GET(request) {
  const { search } = new URL(request.url);
  return Response.redirect(`${PUBLIC_API_BASE_URL}/auth/google/callback${search}`, 302);
}

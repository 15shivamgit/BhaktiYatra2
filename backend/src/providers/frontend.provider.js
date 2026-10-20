/**
 * Tells the Next.js app to drop cached public content after an admin change
 * (docs/04-api/07-uploads-revalidate-misc.md). Disabled when no shared secret is configured.
 * @param {{ siteUrl: string, secret?: string }} config
 */
export function createFrontendProvider({ siteUrl, secret }) {
  return {
    enabled: Boolean(secret),

    /** @param {{ tags?: string[], paths?: string[] }} targets */
    async revalidate({ tags = [], paths = [] }) {
      const res = await fetch(`${siteUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
        body: JSON.stringify({ tags, paths }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Frontend revalidation failed with status ${res.status}`);
    },
  };
}

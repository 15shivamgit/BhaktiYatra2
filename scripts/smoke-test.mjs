#!/usr/bin/env node
/**
 * Smoke test for a deployed environment (docs/02-architecture/05-deployment.md "Smoke-test
 * checklist", docs/09-config/05-deployment-guide.md). Reads only, unless --write is given.
 *
 *   node scripts/smoke-test.mjs --site https://bhaktiyatra-staging.vercel.app \
 *     --api https://bhaktiyatra-api-staging.onrender.com --staging --write
 *
 *   --site     the website (required)
 *   --api      the API's own address, to check it directly as well (optional)
 *   --staging  expect "noindex" and the staging badge settings
 *   --write    also register a throwaway account to check the session cookie (staging only)
 */
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    site: { type: 'string' },
    api: { type: 'string' },
    staging: { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
  },
});
if (!values.site) {
  process.stderr.write(
    'Usage: node scripts/smoke-test.mjs --site <url> [--api <url>] [--staging] [--write]\n',
  );
  process.exit(2);
}
const SITE = values.site.replace(/\/+$/, '');
const API = values.api?.replace(/\/+$/, '');
const results = [];
const out = (line) => process.stdout.write(`${line}\n`);

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push(true);
    out(`ok    ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    results.push(false);
    out(`FAIL  ${name}: ${error.message}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

/** A free Render service can take about a minute to wake up, so allow for that once. */
const get = (url, init = {}) =>
  fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(90_000), ...init });

if (API) {
  await check('API health (direct)', async () => {
    const res = await get(`${API}/api/v1/health`);
    const body = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    expect(body.data?.db === 'up', `db ${body.data?.db}`);
    return `version ${body.data.version}, ${body.data.status}`;
  });
}

await check('API health through the website (/api/v1 rewrite)', async () => {
  const res = await get(`${SITE}/api/v1/health`);
  const body = await res.json();
  expect(res.status === 200 && body.data?.db === 'up', `status ${res.status}, db ${body.data?.db}`);
  return `db ${body.data.db}`;
});

let homeHtml = '';
await check('home page renders with title and security headers', async () => {
  const res = await get(`${SITE}/`);
  homeHtml = await res.text();
  expect(res.status === 200, `status ${res.status}`);
  expect(/<title>[^<]*BhaktiYatra/.test(homeHtml), 'no BhaktiYatra <title>');
  const csp = res.headers.get('content-security-policy') ?? '';
  expect(csp.includes("frame-ancestors 'none'"), 'Content-Security-Policy missing');
  expect(res.headers.get('x-content-type-options') === 'nosniff', 'nosniff missing');
  if (SITE.startsWith('https://')) {
    expect(Boolean(res.headers.get('strict-transport-security')), 'HSTS missing');
  }
  return `${Math.round(homeHtml.length / 1024)} KB`;
});

await check('a temple page renders with its name and canonical link', async () => {
  const list = await (await get(`${SITE}/api/v1/temples?limit=1`)).json();
  const temple = list.data?.[0];
  expect(temple, 'no published temple (seed the content first)');
  const res = await get(`${SITE}/temples/${temple.slug}`);
  const html = await res.text();
  expect(res.status === 200, `status ${res.status}`);
  expect(html.includes(temple.name), 'temple name not in the HTML');
  expect(
    html.includes(`<link rel="canonical" href="${SITE}/temples/${temple.slug}"`),
    'canonical link',
  );
  return temple.slug;
});

await check('a tour page renders (when tours exist)', async () => {
  const list = await (await get(`${SITE}/api/v1/tours?limit=1`)).json();
  const tour = list.data?.[0];
  if (!tour) return 'no published tours yet, skipped';
  const res = await get(`${SITE}/tours/${tour.slug}`);
  expect(res.status === 200, `status ${res.status}`);
  expect((await res.text()).includes(tour.title), 'tour title not in the HTML');
  return tour.slug;
});

await check(
  values.staging
    ? 'robots.txt blocks crawlers (staging)'
    : 'robots.txt allows crawling and links the sitemap',
  async () => {
    const res = await get(`${SITE}/robots.txt`);
    const body = await res.text();
    if (values.staging) {
      expect(/Disallow: \/\s*$/m.test(body), 'staging must disallow everything');
      const home = await get(`${SITE}/`);
      expect(
        (home.headers.get('x-robots-tag') ?? '').includes('noindex'),
        'X-Robots-Tag noindex missing',
      );
    } else {
      expect(body.includes(`Sitemap: ${SITE}/sitemap.xml`), 'sitemap line missing');
      expect(!/Disallow: \/\s*$/m.test(body), 'production must not disallow everything');
    }
  },
);

await check('sitemap.xml lists pages on this site', async () => {
  const res = await get(`${SITE}/sitemap.xml`);
  const body = await res.text();
  expect(res.status === 200, `status ${res.status}`);
  expect(body.includes(`<loc>${SITE}/`), 'no URLs for this site');
  return `${(body.match(/<loc>/g) ?? []).length} URLs`;
});

await check('a request from a foreign origin is refused', async () => {
  const res = await get(`${SITE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ email: 'x@example.com', password: 'whatever-1' }),
  });
  expect(res.status === 403, `status ${res.status}`);
});

if (values.write) {
  await check('register sets a first-party session cookie, and /auth/me works', async () => {
    const email = `smoke-${Date.now()}@example.com`;
    const res = await get(`${SITE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: SITE },
      body: JSON.stringify({ name: 'Smoke Test', email, password: 'Smoke-Test-Pass-1' }),
    });
    expect(res.status === 201, `register status ${res.status}`);
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(/by_session=/.test(cookie), 'no session cookie');
    expect(/HttpOnly/i.test(cookie), 'cookie not HttpOnly');
    expect(/SameSite=Lax/i.test(cookie), 'cookie not SameSite=Lax');
    expect(!/Domain=/i.test(cookie), 'cookie must belong to the website (no Domain attribute)');
    if (SITE.startsWith('https://')) expect(/Secure/i.test(cookie), 'cookie not Secure');
    const me = await get(`${SITE}/api/v1/auth/me`, { headers: { Cookie: cookie.split(';')[0] } });
    expect(me.status === 200, `/auth/me status ${me.status}`);
    return email;
  });
}

const failed = results.filter((ok) => !ok).length;
out(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

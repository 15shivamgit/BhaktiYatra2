import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Called by the API after admins change published content
 * (docs/04-api/07-uploads-revalidate-misc.md). Expires the given cache tags immediately so the
 * next visitor sees the change.
 */
function authorised(request) {
  const expected = process.env.REVALIDATE_SECRET;
  const given = request.headers.get('x-revalidate-secret');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const isStringList = (value) =>
  Array.isArray(value) && value.every((v) => typeof v === 'string' && v.length <= 200);

export async function POST(request) {
  if (!authorised(request)) {
    return Response.json({ revalidated: false, message: 'Unauthorised' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const tags = isStringList(body.tags) ? body.tags.slice(0, 50) : [];
  const paths = isStringList(body.paths)
    ? body.paths.filter((p) => p.startsWith('/')).slice(0, 50)
    : [];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) revalidatePath(path);
  return Response.json({ revalidated: true, tags, paths });
}

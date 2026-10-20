import { CONTENT_CACHE_TAG } from '../../config/content.js';

/**
 * Ask the frontend to refresh cached public pages. Fire-and-forget: a failure is logged and the
 * frontend's own cache lifetime (about five minutes) still brings the change through.
 * @param {{ logger: import('pino').Logger, providers: { frontend: any } }} ctx
 * @param {string[]} [extraTags]
 */
export function revalidateContent(ctx, extraTags = []) {
  if (!ctx.providers.frontend.enabled) return;
  const tags = [CONTENT_CACHE_TAG, ...extraTags];
  ctx.providers.frontend
    .revalidate({ tags })
    .catch((error) =>
      ctx.logger.warn({ tags, err: error.message }, 'Frontend revalidation failed'),
    );
}

import sanitizeHtml from 'sanitize-html';

/**
 * Allow-list for admin rich text (docs/02-architecture/04-security.md §4). Anything not listed,
 * including scripts, inline styles and event handlers, is removed.
 */
const OPTIONS = {
  allowedTags: [
    'p',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'a',
    'img',
    'blockquote',
    'br',
  ],
  allowedAttributes: {
    a: ['href', 'rel', 'target'],
    img: ['src', 'alt', 'width', 'height'],
  },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  exclusiveFilter: (frame) =>
    frame.tag === 'img' && !/^https:\/\/res\.cloudinary\.com\//.test(frame.attribs.src ?? ''),
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        ...(attribs.target && { target: '_blank' }),
      },
    }),
  },
};

/** @param {string | undefined | null} html */
export function sanitizeRichText(html) {
  if (html === undefined || html === null) return html;
  return sanitizeHtml(String(html), OPTIONS).trim();
}

/** Visible text length of an HTML fragment (used for publish rules). */
export function textLength(html) {
  return sanitizeHtml(String(html ?? ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim().length;
}

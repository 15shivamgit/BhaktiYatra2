import { maskEmail } from '../utils/phone.js';

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Mail provider interface (ADR-018, ADR-033):
 *   name                 'resend' | 'console'
 *   send({ to, subject, html, text, attachments?: [{ filename, content: Buffer }], replyTo? })
 *     → { id }
 *
 * Resend over its REST API (no SDK). Without RESEND_API_KEY the console provider logs each
 * message instead of sending, so development works offline.
 * @param {{ provider?: 'resend' | 'console', apiKey?: string, from: string, replyTo?: string,
 *   logger: any, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 */
export function createMailProvider({
  provider,
  apiKey,
  from,
  replyTo,
  logger,
  fetchImpl = fetch,
  timeoutMs = 15_000,
}) {
  const name = provider ?? (apiKey ? 'resend' : 'console');

  if (name === 'console') {
    return {
      name,
      async send({ to, subject, attachments = [] }) {
        logger.info(
          {
            to: [to].flat().map(maskEmail),
            subject,
            attachments: attachments.map((a) => a.filename),
          },
          'Email (console provider, not sent)',
        );
        return { id: `console_${Date.now()}` };
      },
    };
  }

  return {
    name,
    async send({ to, subject, html, text, attachments = [], replyTo: perMessageReplyTo }) {
      let res;
      try {
        res = await fetchImpl(RESEND_API, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [to].flat(),
            subject,
            html,
            text,
            ...((perMessageReplyTo ?? replyTo) && { reply_to: perMessageReplyTo ?? replyTo }),
            ...(attachments.length && {
              attachments: attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString('base64'),
              })),
            }),
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw new Error(`Resend request failed: ${error.message}`, { cause: error });
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Resend ${res.status}: ${body?.message ?? 'send failed'}`);
      return { id: body.id };
    },
  };
}

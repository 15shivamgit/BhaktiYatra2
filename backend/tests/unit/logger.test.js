import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { REDACT_PATHS } from '../../src/config/logger.js';

describe('logger redaction (TC-SEC-05)', () => {
  it('never writes cookies, authorization headers or passwords', () => {
    let output = '';
    const sink = new Writable({
      write(chunk, _enc, cb) {
        output += chunk.toString();
        cb();
      },
    });
    const logger = pino({ redact: { paths: REDACT_PATHS, censor: '[redacted]' } }, sink);

    logger.info({
      req: { headers: { cookie: 'by_session=abc', authorization: 'Bearer xyz' } },
      body: { password: 'hunter22', token: 't0k3n' },
    });

    expect(output).not.toMatch(/by_session=abc|Bearer xyz|hunter22|t0k3n/);
    expect(output).toMatch(/\[redacted\]/);
  });
});

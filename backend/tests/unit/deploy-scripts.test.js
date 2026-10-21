import { describe, expect, it } from 'vitest';
import { isProductionDb } from '../../scripts/lib/production-db.js';

describe('production database guard for seeding scripts', () => {
  it('recognises the production database by name, whatever the host', () => {
    expect(isProductionDb('mongodb+srv://u:p@c.mongodb.net/bhaktiyatra?retryWrites=true')).toBe(
      true,
    );
    expect(isProductionDb('mongodb://localhost:27017/bhaktiyatra')).toBe(true);
  });

  it('leaves other databases alone', () => {
    expect(isProductionDb('mongodb+srv://u:p@c.mongodb.net/bhaktiyatra_staging?w=1')).toBe(false);
    expect(isProductionDb('mongodb://localhost:27017/bhaktiyatra_dev')).toBe(false);
    expect(isProductionDb('not a url')).toBe(false);
  });
});

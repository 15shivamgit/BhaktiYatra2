import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb, testMongoUrl } from '../helpers/test-app.js';

const run = promisify(execFile);
const scripts = path.resolve(import.meta.dirname, '../../scripts');
let url;
let workDir;

beforeAll(async () => {
  url = testMongoUrl();
  await connectTestDb(url);
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'by-backup-'));
});
afterAll(async () => {
  await disconnectTestDb();
  fs.rmSync(workDir, { recursive: true, force: true });
});

const script = (name, args, env) =>
  run(process.execPath, [path.join(scripts, name), ...args], {
    env: { ...process.env, MONGO_URL: url, ...env },
  });

describe('db-backup and db-restore', () => {
  it('round-trips every collection with ObjectIds and dates intact', async () => {
    const db = mongoose.connection.db;
    const id = new mongoose.Types.ObjectId();
    const at = new Date('2026-10-21T10:00:00Z');
    await db
      .collection('backup_places')
      .insertMany([{ _id: id, name: 'Kedarnath', at }, { name: 'Badrinath' }]);
    await db.collection('backup_orders').insertOne({ ref: 'BY-1', temple: id, amount: 7999 });

    const { stdout } = await script('db-backup.js', ['--out', workDir]);
    expect(stdout).toMatch(/backup_places: 2 documents/);
    const [folder] = fs.readdirSync(workDir);

    await db.collection('backup_places').deleteMany({});
    await db.collection('backup_orders').updateOne({ ref: 'BY-1' }, { $set: { amount: 1 } });

    const refused = await script('db-restore.js', ['--from', path.join(workDir, folder)]).catch(
      (error) => error,
    );
    expect(refused.code).toBe(1); // needs --yes
    expect(await db.collection('backup_places').countDocuments()).toBe(0);

    await script('db-restore.js', ['--from', path.join(workDir, folder), '--yes']);
    const temple = await db.collection('backup_places').findOne({ name: 'Kedarnath' });
    expect(temple._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(temple._id.equals(id)).toBe(true);
    expect(temple.at).toBeInstanceOf(Date);
    expect(temple.at.getTime()).toBe(at.getTime());
    expect(await db.collection('backup_places').countDocuments()).toBe(2);
    expect((await db.collection('backup_orders').findOne({ ref: 'BY-1' })).amount).toBe(7999);
  });

  it('refuses to restore into the production database without --production', async () => {
    const prodUrl = new URL(url);
    prodUrl.pathname = '/bhaktiyatra';
    const [folder] = fs.readdirSync(workDir);
    const refused = await run(
      process.execPath,
      [path.join(scripts, 'db-restore.js'), '--from', path.join(workDir, folder), '--yes'],
      { env: { ...process.env, MONGO_URL: prodUrl.toString() } },
    ).catch((error) => error);
    expect(refused.code).toBe(1);
    expect(refused.stdout).toMatch(/Refusing to restore into the production database/);
  });
});

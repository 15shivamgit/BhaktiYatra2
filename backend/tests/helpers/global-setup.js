import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * One in-memory replica set for the whole test run (replica set so transactions work in
 * later phases). Each test file connects to its own database name via createTestDb().
 */
let replSet;

export async function setup({ provide }) {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  provide('mongoUri', replSet.getUri());
}

export async function teardown() {
  await replSet?.stop();
}

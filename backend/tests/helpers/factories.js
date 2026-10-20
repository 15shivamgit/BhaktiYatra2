import { User } from '../../src/models/User.js';
import { hashPassword } from '../../src/modules/auth/password.js';

export const DEFAULT_PASSWORD = 'Correct-Horse-9';
let counter = 0;

/** Create a user directly in the database. */
export async function makeUser(overrides = {}) {
  counter += 1;
  const { password = DEFAULT_PASSWORD, ...rest } = overrides;
  return User.create({
    name: `Test User ${counter}`,
    email: `user${counter}@example.com`,
    passwordHash: password === null ? undefined : await hashPassword(password, 4),
    ...rest,
  });
}

export function makeAdmin(overrides = {}) {
  return makeUser({ role: 'admin', ...overrides });
}

/** Log in through the API with a cookie-keeping supertest agent. */
export async function loginAgent(agent, email, password = DEFAULT_PASSWORD) {
  const res = await agent.post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200)
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res;
}

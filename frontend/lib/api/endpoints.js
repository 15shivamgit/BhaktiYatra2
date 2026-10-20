import { PUBLIC_API_BASE_URL } from '@/lib/config';
import { apiFetch } from './client';

/** Auth endpoints (docs/04-api/02-auth.md). Each resolves to the envelope's `data`. */
export const authApi = {
  me: async () => (await apiFetch('/auth/me')).data.user,
  /** Signed-in user or null; never 401 for guests. */
  session: async () => (await apiFetch('/auth/session')).data.user,
  login: async (body) => (await apiFetch('/auth/login', { method: 'POST', body })).data.user,
  register: async (body) => (await apiFetch('/auth/register', { method: 'POST', body })).data.user,
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  updateMe: async (body) => (await apiFetch('/auth/me', { method: 'PATCH', body })).data.user,
  changePassword: (body) => apiFetch('/auth/change-password', { method: 'POST', body }),
  forgotPassword: (body) => apiFetch('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => apiFetch('/auth/reset-password', { method: 'POST', body }),
  /** Full-page navigation target that starts Google sign-in. */
  googleStartUrl: (next) => {
    const url = new URL(`${PUBLIC_API_BASE_URL}/auth/google`);
    if (next && next !== '/') url.searchParams.set('next', next);
    return url.toString();
  },
};

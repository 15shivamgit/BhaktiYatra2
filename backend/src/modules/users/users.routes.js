import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { toAdminUser } from '../../models/User.js';
import { listUsersSchema, updateUserSchema, userIdSchema } from './users.schemas.js';
import { getUser, listUsers, updateUser } from './users.service.js';

/** Admin user management (docs/04-api/02-auth.md "Admin: users"). */
export function adminUsersRouter({ env }) {
  const router = Router();
  router.use(requireAuth(env), requireRole('admin'));

  router.get('/', validate(listUsersSchema), async (req, res) => {
    const { users, meta } = await listUsers(req.valid.query);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: users.map(toAdminUser), meta });
  });

  router.get('/:id', validate(userIdSchema), async (req, res) => {
    const user = await getUser(req.valid.params.id);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: toAdminUser(user) });
  });

  router.patch('/:id', validate(updateUserSchema), async (req, res) => {
    const user = await updateUser(req.user, req.valid.params.id, req.valid.body, req);
    res.json({ success: true, data: toAdminUser(user) });
  });

  return router;
}

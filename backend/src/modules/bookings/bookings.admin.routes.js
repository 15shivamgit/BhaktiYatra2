import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { toAdminBookingDetail, toAdminBookingSummary } from './bookings.mapper.js';
import * as schemas from './bookings.admin.schemas.js';
import * as service from './bookings.admin.service.js';

/** Admin booking endpoints (docs/04-api/05-bookings-payments.md "Admin: bookings and payments"). */
export function adminBookingsRouter(ctx) {
  const router = Router();
  router.use(requireAuth(ctx.env), requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const detail = async (id) => {
    const data = await service.getBookingAdmin(id);
    return toAdminBookingDetail(data, service.allowedActions(data.booking));
  };

  router.get('/', validate(schemas.listAdminBookingsSchema), async (req, res) => {
    if (req.valid.query.format === 'csv') {
      await service.streamBookingsCsv(req.valid.query, res);
      return;
    }
    const { bookings, meta } = await service.listBookingsAdmin(req.valid.query);
    res.json({ success: true, data: bookings.map(toAdminBookingSummary), meta });
  });

  router.get('/:id', validate(schemas.bookingIdSchema), async (req, res) => {
    res.json({ success: true, data: await detail(req.valid.params.id) });
  });

  router.patch('/:id/status', validate(schemas.changeStatusSchema), async (req, res) => {
    const id = await service.changeStatus(ctx, req.user, req.valid.params.id, req.valid.body, req);
    res.json({ success: true, data: await detail(id) });
  });

  router.post('/:id/cancel', validate(schemas.adminCancelSchema), async (req, res) => {
    const id = await service.cancelByAdmin(ctx, req.user, req.valid.params.id, req.valid.body, req);
    res.json({ success: true, data: await detail(id) });
  });

  router.post('/:id/notes', validate(schemas.addNoteSchema), async (req, res) => {
    const booking = await service.addNote(req.user, req.valid.params.id, req.valid.body.text, req);
    res.status(201).json({ success: true, data: (await detail(booking._id)).notes });
  });

  router.post('/:id/regenerate-documents', validate(schemas.bookingIdSchema), async (req, res) => {
    await service.regenerateBookingDocuments(ctx, req.user, req.valid.params.id, req);
    res.status(202).json({ success: true, data: await detail(req.valid.params.id) });
  });

  router.post('/:id/resend-confirmation', validate(schemas.bookingIdSchema), async (req, res) => {
    await service.resendConfirmation(ctx, req.user, req.valid.params.id, req);
    res.status(202).json({
      success: true,
      data: await detail(req.valid.params.id),
      message: 'The confirmation email is queued.',
    });
  });

  return router;
}

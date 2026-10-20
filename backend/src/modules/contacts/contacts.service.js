import { Contact } from '../../models/Contact.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex, sha256Hex } from '../../utils/crypto.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { recordAudit } from '../audit/audit.service.js';
import { enqueueNotification } from '../notifications/notifications.service.js';

const toContact = (c) => ({
  id: c._id.toString(),
  name: c.name,
  email: c.email,
  phone: c.phone ?? null,
  subject: c.subject ?? null,
  message: c.message,
  status: c.status,
  createdAt: c.createdAt,
});

/**
 * Store a contact message. A filled honeypot marks it as spam silently, so bots get the same
 * success response and learn nothing.
 */
export async function submitContact(ctx, { website, ...fields }, req) {
  const isSpam = Boolean(website);
  const contact = await Contact.create({
    ...fields,
    status: isSpam ? 'spam' : 'new',
    ipHash: req.ip ? sha256Hex(req.ip) : undefined,
  });
  if (!isSpam && ctx.env.ADMIN_NOTIFY_EMAIL) {
    await enqueueNotification(ctx, {
      type: 'contact_received_admin',
      to: ctx.env.ADMIN_NOTIFY_EMAIL,
      dedupeKey: `contact_received_admin:${contact._id}`,
      payload: {
        contactId: contact._id.toString(),
        name: contact.name,
        subject: contact.subject ?? null,
      },
    });
  }
  return contact;
}

export async function listContacts({ status, q, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }];
  }
  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skipFor({ page, limit })).limit(limit),
    Contact.countDocuments(filter),
  ]);
  return { contacts: contacts.map(toContact), meta: pageMeta({ page, limit }, total) };
}

export async function updateContactStatus(id, status, actor, req) {
  const contact = await Contact.findById(id);
  if (!contact) throw AppError.notFound('Message not found');
  const before = contact.status;
  contact.status = status;
  await contact.save();
  await recordAudit({
    actor,
    action: 'contact.status.change',
    entityType: 'Contact',
    entityId: contact._id,
    before: { status: before },
    after: { status },
    req,
  });
  return toContact(contact);
}

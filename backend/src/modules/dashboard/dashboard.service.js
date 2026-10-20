import { BOOKING_STATUSES, UPCOMING_DEPARTURE_STATUSES } from '../../config/tours.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Booking } from '../../models/Booking.js';
import { Circuit } from '../../models/Circuit.js';
import { Payment } from '../../models/Payment.js';
import { Temple } from '../../models/Temple.js';
import { Tour } from '../../models/Tour.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { User } from '../../models/User.js';
import { addDays, istMidnight, toIstYmd, todayIst } from '../../utils/dates.js';
import { toAuditEntry } from '../audit/audit.mapper.js';
import { reconcileInventory } from '../bookings/bookings.service.js';
import { toAdminBookingSummary } from '../bookings/bookings.mapper.js';
import { failedEmailCount } from '../notifications/mailer.service.js';

export const DASHBOARD_RANGES = Object.freeze(['7d', '30d', '90d', 'mtd']);
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

/** Start of the range in IST: the last N calendar days including today, or month to date. */
export function rangeStart(range, now = new Date()) {
  if (range === 'mtd') return istMidnight(`${toIstYmd(now).slice(0, 7)}-01`);
  return addDays(todayIst(now), -(RANGE_DAYS[range] - 1));
}

const countByStatus = async (Model) => {
  const rows = await Model.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
};

/**
 * Money from Payment documents only (never booking amounts): gross captured (a refunded payment
 * was captured first), refunds, and net = captured − refunds. Dated by capture and refund time.
 */
async function revenue(from) {
  const capturedAt = { $ifNull: ['$capturedAt', '$createdAt'] };
  const [row] = await Payment.aggregate([
    { $match: { status: { $in: ['captured', 'refunded'] } } },
    {
      $group: {
        _id: null,
        capturedAllTime: { $sum: '$amount' },
        capturedInRange: { $sum: { $cond: [{ $gte: [capturedAt, from] }, '$amount', 0] } },
        refundedAllTime: { $sum: { $ifNull: ['$refund.amount', 0] } },
        refundedInRange: {
          $sum: {
            $cond: [{ $gte: ['$refund.at', from] }, { $ifNull: ['$refund.amount', 0] }, 0],
          },
        },
      },
    },
  ]);
  const r = row ?? {
    capturedAllTime: 0,
    capturedInRange: 0,
    refundedAllTime: 0,
    refundedInRange: 0,
  };
  return {
    capturedInRange: r.capturedInRange,
    refundedInRange: r.refundedInRange,
    netInRange: r.capturedInRange - r.refundedInRange,
    capturedAllTime: r.capturedAllTime,
    refundedAllTime: r.refundedAllTime,
    netAllTime: r.capturedAllTime - r.refundedAllTime,
    currency: 'INR',
  };
}

/**
 * GET /admin/dashboard (docs/04-api/06-admin.md). Every number is a direct count or aggregation;
 * the router caches the result for 60 seconds.
 * @param {'7d' | '30d' | '90d' | 'mtd'} range
 */
export async function dashboardData(range, now = new Date()) {
  const from = rangeStart(range, now);
  const today = todayIst(now);

  const [
    temples,
    circuits,
    tours,
    departures,
    usersTotal,
    usersNew,
    statusRows,
    confirmedRows,
    holds,
    money,
    recentBookings,
    recentAudit,
    inventory,
    emailFailures,
  ] = await Promise.all([
    countByStatus(Temple),
    countByStatus(Circuit),
    countByStatus(Tour),
    TourDeparture.aggregate([
      { $match: { status: { $in: [...UPCOMING_DEPARTURE_STATUSES] }, startDate: { $gte: today } } },
      {
        $group: {
          _id: null,
          upcoming: { $sum: 1 },
          full: { $sum: { $cond: [{ $eq: ['$status', 'full'] }, 1, 0] } },
          nextSevenDays: { $sum: { $cond: [{ $lt: ['$startDate', addDays(today, 7)] }, 1, 0] } },
        },
      },
    ]),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: from } }),
    Booking.aggregate([{ $group: { _id: '$bookingStatus', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { confirmedAt: { $gte: from } } },
      { $group: { _id: null, bookings: { $sum: 1 }, seats: { $sum: '$seats' } } },
    ]),
    Booking.aggregate([
      { $match: { bookingStatus: 'pending', holdExpiresAt: { $gt: now } } },
      { $group: { _id: null, bookings: { $sum: 1 }, seats: { $sum: '$seats' } } },
    ]),
    revenue(from),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('tour', 'title slug images')
      .populate('user', 'name email'),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('actor', 'name email'),
    reconcileInventory({ now }),
    failedEmailCount({ since: new Date(now.getTime() - 24 * 3_600_000) }),
  ]);

  const byStatus = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]));
  for (const row of statusRows) byStatus[row._id] = row.n;
  const dep = departures[0] ?? { upcoming: 0, full: 0, nextSevenDays: 0 };

  return {
    range,
    from: toIstYmd(from),
    generatedAt: now,
    content: {
      templesPublished: temples.published ?? 0,
      templesDraft: temples.draft ?? 0,
      circuitsPublished: circuits.published ?? 0,
      toursPublished: tours.published ?? 0,
      toursDraft: tours.draft ?? 0,
    },
    departures: { upcoming: dep.upcoming, full: dep.full, nextSevenDays: dep.nextSevenDays },
    users: { total: usersTotal, newInRange: usersNew },
    bookings: {
      byStatus,
      confirmedInRange: confirmedRows[0]?.bookings ?? 0,
      seatsConfirmedInRange: confirmedRows[0]?.seats ?? 0,
    },
    revenue: money,
    holds: { activePending: holds[0]?.bookings ?? 0, seatsHeld: holds[0]?.seats ?? 0 },
    recentBookings: recentBookings.map(toAdminBookingSummary),
    recentAudit: recentAudit.map((entry) => {
      const { id, action, actor, entityType, entityId, reason, createdAt } = toAuditEntry(entry);
      return {
        id,
        action,
        actorName: actor?.name ?? null,
        entityType,
        entityId,
        reason,
        createdAt,
      };
    }),
    alerts: [
      { type: 'payment_received_no_seats', count: byStatus.payment_received_no_seats },
      { type: 'cancellation_requested', count: byStatus.cancellation_requested },
      { type: 'inventory_mismatch', count: inventory.mismatches.length },
      { type: 'email_failures_24h', count: emailFailures },
    ],
  };
}

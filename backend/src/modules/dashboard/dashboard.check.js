import mongoose from 'mongoose';
import { addDays, todayIst } from '../../utils/dates.js';
import { dashboardData, rangeStart } from './dashboard.service.js';

/**
 * The dashboard figures next to the same numbers from plain MongoDB queries written by hand,
 * without the service's aggregation pipelines (Phase 8 exit criterion). Read-only.
 * Used by `npm run db:check-dashboard` and by the integration tests.
 * @returns {Promise<[label: string, query: number, dashboard: number][]>}
 */
export async function compareDashboard(range = '7d', now = new Date()) {
  const { db } = mongoose.connection;
  const from = rangeStart(range, now);
  const today = todayIst(now);
  const count = (collection, filter) => db.collection(collection).countDocuments(filter);
  const sum = async (collection, match, field) => {
    const [row] = await db
      .collection(collection)
      .aggregate([{ $match: match }, { $group: { _id: null, n: { $sum: field } } }])
      .toArray();
    return row?.n ?? 0;
  };
  const captured = { status: { $in: ['captured', 'refunded'] } };

  const data = await dashboardData(range, now);
  return [
    [
      'temples published',
      await count('temples', { status: 'published' }),
      data.content.templesPublished,
    ],
    ['temples draft', await count('temples', { status: 'draft' }), data.content.templesDraft],
    [
      'circuits published',
      await count('circuits', { status: 'published' }),
      data.content.circuitsPublished,
    ],
    ['tours published', await count('tours', { status: 'published' }), data.content.toursPublished],
    ['tours draft', await count('tours', { status: 'draft' }), data.content.toursDraft],
    [
      'departures upcoming',
      await count('tourdepartures', {
        status: { $in: ['scheduled', 'full'] },
        startDate: { $gte: today },
      }),
      data.departures.upcoming,
    ],
    [
      'departures full',
      await count('tourdepartures', { status: 'full', startDate: { $gte: today } }),
      data.departures.full,
    ],
    [
      'departures next 7 days',
      await count('tourdepartures', {
        status: { $in: ['scheduled', 'full'] },
        startDate: { $gte: today, $lt: addDays(today, 7) },
      }),
      data.departures.nextSevenDays,
    ],
    ['users total', await count('users', {}), data.users.total],
    [
      'users new in range',
      await count('users', { createdAt: { $gte: from } }),
      data.users.newInRange,
    ],
    ...(await Promise.all(
      Object.keys(data.bookings.byStatus).map(async (status) => [
        `bookings ${status}`,
        await count('bookings', { bookingStatus: status }),
        data.bookings.byStatus[status],
      ]),
    )),
    [
      'bookings confirmed in range',
      await count('bookings', { confirmedAt: { $gte: from } }),
      data.bookings.confirmedInRange,
    ],
    [
      'seats confirmed in range',
      await sum('bookings', { confirmedAt: { $gte: from } }, '$seats'),
      data.bookings.seatsConfirmedInRange,
    ],
    [
      'active holds',
      await count('bookings', { bookingStatus: 'pending', holdExpiresAt: { $gt: now } }),
      data.holds.activePending,
    ],
    [
      'revenue captured all time',
      await sum('payments', captured, '$amount'),
      data.revenue.capturedAllTime,
    ],
    [
      'revenue captured in range',
      (await sum('payments', { ...captured, capturedAt: { $gte: from } }, '$amount')) +
        (await sum(
          'payments',
          { ...captured, capturedAt: null, createdAt: { $gte: from } },
          '$amount',
        )),
      data.revenue.capturedInRange,
    ],
    [
      'refunds all time',
      await sum('payments', captured, '$refund.amount'),
      data.revenue.refundedAllTime,
    ],
    [
      'refunds in range',
      await sum('payments', { ...captured, 'refund.at': { $gte: from } }, '$refund.amount'),
      data.revenue.refundedInRange,
    ],
  ];
}

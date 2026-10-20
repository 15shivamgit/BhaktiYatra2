import { describe, expect, it } from 'vitest';
import {
  emptyTourValues,
  resizeItinerary,
  toFormValues,
  toPayload,
  tourFieldFor,
} from '@/lib/admin/tour-form';
import { formatDate, formatDateRange, formatPrice } from '@/lib/format';
import { departureBadge } from '@/lib/tours';

const apiTour = {
  title: 'Char Dham Yatra',
  slug: 'char-dham-yatra',
  summary: 'Four dhams in ten days.',
  description: '<p>Long</p>',
  destinations: ['Yamunotri', 'Gangotri'],
  durationDays: 2,
  durationNights: 1,
  basePrice: 32999,
  pickupCities: ['Haridwar', 'Delhi'],
  highlights: ['Ganga aarti'],
  itinerary: [{ day: 1, title: 'Arrive', description: '', meals: ['dinner'], stay: 'Haridwar' }],
  inclusions: ['Hotel'],
  exclusions: [],
  temples: [{ id: 'a1', name: 'Kedarnath' }],
  faqs: [{ question: 'Q?', answer: 'A.' }],
  seo: null,
};

describe('tour form mapping', () => {
  it('round-trips API data through form values', () => {
    const values = toFormValues(apiTour);
    expect(values.destinationsText).toBe('Yamunotri, Gangotri');
    expect(values.durationDays).toBe('2');
    const payload = toPayload(
      { ...values, itinerary: resizeItinerary(values.itinerary, 2) },
      { mode: 'update', originalSlug: 'char-dham-yatra' },
    );
    expect(payload).toMatchObject({
      destinations: ['Yamunotri', 'Gangotri'],
      durationDays: 2,
      durationNights: 1,
      basePrice: 32999,
      pickupCities: ['Haridwar', 'Delhi'],
      highlights: ['Ganga aarti'],
      temples: ['a1'],
      faqs: [{ question: 'Q?', answer: 'A.' }],
    });
    expect(payload.slug).toBeUndefined();
    expect(payload.itinerary).toEqual([
      { day: 1, title: 'Arrive', description: '', meals: ['dinner'], stay: 'Haridwar' },
      { day: 2, title: '', description: '', meals: [], stay: '' },
    ]);
  });

  it('create payload has only draft fields and drops blank FAQ rows on update', () => {
    const create = toPayload(
      { ...emptyTourValues(), title: 'Kashi', basePrice: '9999', durationNights: '' },
      { mode: 'create' },
    );
    expect(Object.keys(create).sort()).toEqual(
      [
        'basePrice',
        'description',
        'destinations',
        'durationDays',
        'featured',
        'pickupCities',
        'summary',
        'title',
      ].sort(),
    );
    const update = toPayload(
      { ...toFormValues(apiTour), faqs: [{ question: ' ', answer: '' }] },
      { mode: 'update', originalSlug: 'x' },
    );
    expect(update.faqs).toEqual([]);
    expect(update.slug).toBe('char-dham-yatra');
  });

  it('resizes the itinerary to the duration', () => {
    const rows = [{ title: 'A', description: '', meals: [], stay: '' }];
    expect(resizeItinerary(rows, 3)).toHaveLength(3);
    expect(resizeItinerary(rows, 3)[0].title).toBe('A');
    expect(resizeItinerary([...rows, ...rows], 1)).toHaveLength(1);
  });

  it('maps API error paths to form fields', () => {
    expect(tourFieldFor('body.destinations.0')).toBe('destinationsText');
    expect(tourFieldFor('body.itinerary.2.title')).toBe('itinerary.2.title');
    expect(tourFieldFor('body.basePrice')).toBe('basePrice');
  });
});

describe('tour formatting', () => {
  it('formats rupees and calendar dates without time-zone shifts', () => {
    expect(formatPrice(24999)).toBe('₹24,999');
    expect(formatDate('2026-05-10', 'short')).toBe('10 May');
    expect(formatDate('2026-05-10')).toBe('10 May 2026');
    expect(formatDateRange('2026-05-10', '2026-05-16')).toBe('10 May – 16 May 2026');
    expect(formatDateRange('2026-12-29', '2027-01-07')).toBe('29 Dec 2026 – 7 Jan 2027');
  });

  it('labels departures for badges', () => {
    const base = { status: 'scheduled', isBookable: true, seatsAvailable: 20 };
    expect(departureBadge(base).key).toBe('tours.statusAvailable');
    expect(departureBadge({ ...base, seatsAvailable: 3 }).key).toBe('tours.statusFew');
    expect(departureBadge({ ...base, isBookable: false }).key).toBe('tours.statusClosed');
    expect(departureBadge({ ...base, status: 'full', seatsAvailable: 0 }).key).toBe(
      'tours.statusFull',
    );
  });
});

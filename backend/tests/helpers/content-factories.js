import { Circuit } from '../../src/models/Circuit.js';
import { Temple } from '../../src/models/Temple.js';

let counter = 0;

export const LONG_DESCRIPTION = `<p>${'A sacred place of pilgrimage with a long history. '.repeat(6)}</p>`;

/** A temple that satisfies every publish prerequisite unless overridden. */
export function templeDefaults(overrides = {}) {
  counter += 1;
  return {
    name: `Test Temple ${counter}`,
    slug: `test-temple-${counter}`,
    deity: 'Shiva',
    state: 'Uttarakhand',
    city: 'Rishikesh',
    shortDescription: 'A riverside shrine visited by pilgrims all year.',
    description: LONG_DESCRIPTION,
    location: { type: 'Point', coordinates: [78.3, 30.1] },
    timings: [{ label: 'Darshan', open: '05:00', close: '21:00' }],
    images: [
      {
        url: `https://res.cloudinary.com/demo/image/upload/seed/t${counter}.jpg`,
        publicId: `BhaktiYatra/t${counter}`,
        alt: 'Temple entrance',
        isPrimary: true,
        order: 0,
      },
    ],
    status: 'published',
    publishedAt: new Date(),
    ...overrides,
  };
}

export function makeTemple(overrides = {}) {
  return Temple.create(templeDefaults(overrides));
}

/** Point `km` north of (lat, lng); good enough for distance-ordering fixtures. */
export function pointNorth(lat, lng, km) {
  return { type: 'Point', coordinates: [lng, lat + km / 111.2] };
}

export function makeCircuit(overrides = {}) {
  counter += 1;
  return Circuit.create({
    name: `Test Circuit ${counter}`,
    slug: `test-circuit-${counter}`,
    shortDescription: 'A traditional route linking several shrines.',
    status: 'published',
    publishedAt: new Date(),
    ...overrides,
  });
}

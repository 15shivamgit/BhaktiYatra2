/**
 * Sample tours for development, staging and E2E (docs/03-database/04-seed-data.md). Routes follow
 * real pilgrimage patterns, but prices, hotels and dates are placeholders: the owner sets real
 * products in the admin panel. Images reuse temple photos from cloudinary-images.json.
 */

export const SAMPLE_NOTE =
  'Sample tour created by scripts/seed-sample-tours.js. Prices, stays and dates are placeholders.';

const day = (n, title, description, meals, stay) => ({
  day: n,
  title,
  description: `<p>${description}</p>`,
  meals,
  stay,
});

const BLD = ['breakfast', 'lunch', 'dinner'];
const BD = ['breakfast', 'dinner'];

const COMMON_INCLUSIONS = [
  'Shared AC transport for the whole route',
  'Hotel or dharamshala stays on twin sharing',
  'Meals as listed in the itinerary (vegetarian)',
  'Tour coordinator throughout the yatra',
];
const COMMON_EXCLUSIONS = [
  'Train or air fare to the pickup city',
  'Special darshan, puja or VIP entry tickets',
  'Ponies, palkis and helicopter tickets',
  'Personal expenses and tips',
];

export const SAMPLE_TOURS = [
  {
    title: 'Char Dham Yatra from Haridwar',
    slug: 'char-dham-yatra-haridwar',
    summary:
      'Yamunotri, Gangotri, Kedarnath and Badrinath in ten days, starting and ending at Haridwar.',
    description:
      '<p>The classic Uttarakhand Char Dham circuit in the traditional order, west to east. The route crosses high Himalayan roads, so the yatra runs from May to October when the temples are open.</p>',
    highlights: [
      'All four dhams in the traditional order',
      'Ganga aarti at Har Ki Pauri on arrival',
      'Overnight near Kedarnath base for an early trek',
    ],
    temples: [
      'yamunotri-temple-uttarkashi',
      'gangotri-temple-uttarkashi',
      'kedarnath-temple-rudraprayag',
      'badrinath-temple-chamoli',
    ],
    destinations: ['Haridwar', 'Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'],
    durationDays: 10,
    itinerary: [
      day(
        1,
        'Arrive in Haridwar',
        'Check in and attend the evening Ganga aarti at Har Ki Pauri.',
        ['dinner'],
        'Haridwar',
      ),
      day(2, 'Haridwar to Barkot', 'Drive through Mussoorie and the Yamuna valley.', BD, 'Barkot'),
      day(
        3,
        'Yamunotri darshan',
        'Drive to Janki Chatti and trek about 6 km to Yamunotri.',
        BLD,
        'Barkot',
      ),
      day(
        4,
        'Barkot to Uttarkashi',
        'Drive along the Bhagirathi; visit Vishwanath temple in Uttarkashi.',
        BD,
        'Uttarkashi',
      ),
      day(5, 'Gangotri darshan', 'Day trip to Gangotri and back to Uttarkashi.', BLD, 'Uttarkashi'),
      day(6, 'Uttarkashi to Guptkashi', 'Long mountain drive via Tehri.', BD, 'Guptkashi'),
      day(
        7,
        'Kedarnath darshan',
        'Trek from Gaurikund (about 16 km) or optional helicopter.',
        BLD,
        'Kedarnath',
      ),
      day(
        8,
        'Kedarnath to Badrinath',
        'Morning darshan, trek down and drive towards Badrinath.',
        BD,
        'Badrinath',
      ),
      day(
        9,
        'Badrinath darshan and Mana village',
        'Darshan, Tapt Kund and Mana, the last village before Tibet.',
        BLD,
        'Rudraprayag',
      ),
      day(
        10,
        'Return to Haridwar',
        'Drive back to Haridwar; tour ends in the evening.',
        ['breakfast'],
        '',
      ),
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    pickupCities: ['Haridwar', 'Delhi'],
    basePrice: 32999,
    featured: true,
    images: [
      ['kedar1', 'Kedarnath temple below snow-covered peaks'],
      ['badrinath1', 'Colourful facade of Badrinath temple'],
      ['gangotri', 'Gangotri temple beside the Bhagirathi river'],
    ],
    faqs: [
      {
        question: 'Is the Kedarnath trek difficult?',
        answer:
          'It is about 16 km uphill at high altitude. Ponies, palkis and helicopter tickets can be arranged at extra cost.',
      },
      {
        question: 'When does this yatra run?',
        answer: 'Between May and October, when the four temples are open.',
      },
    ],
    departures: [
      { inDays: 21, totalSeats: 36 },
      { inDays: 42, totalSeats: 36, price: 34999 },
      { inDays: 70, totalSeats: 40 },
    ],
  },
  {
    title: 'Kashi and Ayodhya Darshan',
    slug: 'kashi-ayodhya-darshan',
    summary: 'Kashi Vishwanath, the Ganga ghats and Ram Mandir Ayodhya in five relaxed days.',
    description:
      '<p>Two of the holiest cities of Uttar Pradesh: the ghats and lanes of Varanasi and the new Ram Mandir at Ayodhya, with time for Sarnath.</p>',
    highlights: [
      'Evening Ganga aarti at Dashashwamedh Ghat',
      'Sunrise boat ride',
      'Ram Mandir darshan',
    ],
    temples: ['kashi-vishwanath-temple-varanasi', 'ram-mandir-ayodhya'],
    destinations: ['Varanasi', 'Sarnath', 'Ayodhya'],
    durationDays: 5,
    itinerary: [
      day(
        1,
        'Arrive in Varanasi',
        'Check in; evening Ganga aarti at Dashashwamedh Ghat.',
        ['dinner'],
        'Varanasi',
      ),
      day(
        2,
        'Kashi Vishwanath and the ghats',
        'Early boat ride, Kashi Vishwanath darshan and Annapurna temple.',
        BLD,
        'Varanasi',
      ),
      day(3, 'Sarnath', 'Half day at Sarnath; free evening in the old city.', BD, 'Varanasi'),
      day(4, 'Varanasi to Ayodhya', 'Drive to Ayodhya; Saryu aarti in the evening.', BD, 'Ayodhya'),
      day(
        5,
        'Ram Mandir darshan',
        'Morning darshan at Ram Mandir and Hanuman Garhi; tour ends at Ayodhya.',
        ['breakfast'],
        '',
      ),
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    pickupCities: ['Varanasi', 'Lucknow'],
    basePrice: 14999,
    featured: true,
    images: [
      ['kash4', 'Ghats of Varanasi along the Ganga'],
      ['ram', 'Ram Mandir in Ayodhya'],
    ],
    faqs: [
      {
        question: 'Can elderly pilgrims join?',
        answer:
          'Yes. Walking is moderate; wheelchairs can be arranged at Kashi Vishwanath on request.',
      },
    ],
    departures: [
      { inDays: 14, totalSeats: 30 },
      { inDays: 35, totalSeats: 30 },
      { inDays: 56, totalSeats: 30, price: 13999 },
    ],
  },
  {
    title: 'Ujjain and Omkareshwar Jyotirlinga Yatra',
    slug: 'ujjain-omkareshwar-jyotirlinga-yatra',
    summary: 'Two Jyotirlingas of Madhya Pradesh, Mahakaleshwar and Omkareshwar, in three days.',
    description:
      '<p>A short yatra from Indore covering Mahakaleshwar in Ujjain, with its famous Bhasma Aarti, and Omkareshwar on its island in the Narmada.</p>',
    highlights: ['Mahakaleshwar darshan', 'Narmada parikrama point at Omkareshwar'],
    temples: ['mahakaleshwar-temple-ujjain', 'omkareshwar-temple-khandwa'],
    destinations: ['Indore', 'Ujjain', 'Omkareshwar'],
    durationDays: 3,
    itinerary: [
      day(
        1,
        'Indore to Ujjain',
        'Drive to Ujjain; Mahakaleshwar darshan and Ram Ghat aarti.',
        BD,
        'Ujjain',
      ),
      day(
        2,
        'Ujjain to Omkareshwar',
        'Optional Bhasma Aarti (booked separately); drive to Omkareshwar.',
        BLD,
        'Omkareshwar',
      ),
      day(3, 'Omkareshwar darshan', 'Morning darshan and drive back to Indore.', ['breakfast'], ''),
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    pickupCities: ['Indore'],
    basePrice: 7999,
    images: [
      ['ujjain', 'Mahakaleshwar temple in Ujjain'],
      ['ohmkaleshwer', 'Omkareshwar temple on the Narmada'],
    ],
    faqs: [
      {
        question: 'Is the Bhasma Aarti included?',
        answer: 'No. It needs a separate online booking by the temple; we help you apply.',
      },
    ],
    departures: [
      { inDays: 10, totalSeats: 20 },
      { inDays: 24, totalSeats: 20 },
      { inDays: 38, totalSeats: 20 },
      { inDays: 52, totalSeats: 20 },
    ],
  },
  {
    title: 'Dwarka and Somnath Yatra',
    slug: 'dwarka-somnath-yatra',
    summary:
      'Dwarkadhish, Nageshwar Jyotirlinga and Somnath along the Saurashtra coast in six days.',
    description:
      '<p>The sacred coast of Gujarat: Krishna’s Dwarka, Bet Dwarka, the Nageshwar Jyotirlinga and Somnath, the first of the twelve Jyotirlingas.</p>',
    highlights: ['Bet Dwarka by boat', 'Somnath light and sound show', 'Two Jyotirlingas'],
    temples: [
      'dwarkadhish-temple-dwarka',
      'nageshwar-jyotirlinga-dwarka',
      'somnath-temple-veraval',
    ],
    destinations: ['Dwarka', 'Bet Dwarka', 'Somnath'],
    durationDays: 6,
    itinerary: [
      day(
        1,
        'Ahmedabad to Dwarka',
        'Long drive across Saurashtra to Dwarka.',
        ['dinner'],
        'Dwarka',
      ),
      day(2, 'Dwarkadhish and Bet Dwarka', 'Mangla aarti, then boat to Bet Dwarka.', BLD, 'Dwarka'),
      day(3, 'Nageshwar and Rukmini temple', 'Nageshwar Jyotirlinga and Gomti Ghat.', BD, 'Dwarka'),
      day(4, 'Dwarka to Somnath', 'Coastal drive via Porbandar (Kirti Mandir).', BD, 'Somnath'),
      day(
        5,
        'Somnath darshan',
        'Morning darshan, Triveni Sangam and evening light show.',
        BLD,
        'Somnath',
      ),
      day(6, 'Return to Ahmedabad', 'Drive back; tour ends in the evening.', ['breakfast'], ''),
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    pickupCities: ['Ahmedabad', 'Rajkot'],
    basePrice: 18999,
    images: [
      ['dwarka1', 'Dwarkadhish temple spire in Dwarka'],
      ['somnath1', 'Somnath temple by the Arabian Sea'],
    ],
    faqs: [],
    departures: [
      { inDays: 28, totalSeats: 30 },
      { inDays: 63, totalSeats: 30 },
    ],
  },
  {
    title: 'Puri Jagannath Darshan',
    slug: 'puri-jagannath-darshan',
    summary: 'Jagannath Puri, Konark and the Bhubaneswar temples in three days.',
    description:
      '<p>A short yatra to Shri Jagannath at Puri, with the Sun Temple at Konark and the Lingaraj temple in Bhubaneswar.</p>',
    highlights: ['Jagannath darshan', 'Konark Sun Temple', 'Lingaraj temple'],
    temples: ['jagannath-temple-puri'],
    destinations: ['Bhubaneswar', 'Puri', 'Konark'],
    durationDays: 3,
    itinerary: [
      day(1, 'Bhubaneswar to Puri', 'Lingaraj temple, then drive to Puri.', BD, 'Puri'),
      day(
        2,
        'Jagannath darshan and Konark',
        'Morning darshan; afternoon at Konark Sun Temple.',
        BLD,
        'Puri',
      ),
      day(
        3,
        'Return to Bhubaneswar',
        'Free morning at Puri beach; tour ends at Bhubaneswar.',
        ['breakfast'],
        '',
      ),
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    pickupCities: ['Bhubaneswar', 'Kolkata'],
    basePrice: 8999,
    images: [['puri1', 'Jagannath temple in Puri']],
    faqs: [
      {
        question: 'Can non-Hindus enter the Jagannath temple?',
        answer: 'No. The temple allows only Hindus inside; others can see it from outside.',
      },
    ],
    departures: [{ inDays: 18, totalSeats: 25 }],
  },
];

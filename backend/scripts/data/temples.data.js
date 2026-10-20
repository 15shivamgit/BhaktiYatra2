/**
 * Launch temple content (docs/07-content/02-initial-temples.md, ADR-015).
 *
 * Drafted by Claude on 2026-10-20 from general knowledge. NOT yet checked against official
 * sources: the owner must review every entry, especially timings, fees and coordinates, before
 * production. `images` lists Cloudinary public ids from the owner's `BhaktiYatra` folder; each
 * listed image was viewed and its alt text describes what it shows.
 */

const REVIEW_NOTE =
  'Drafted by Claude (2026-10-20) from general knowledge; not yet verified against official sources. Check timings, fees and coordinates before publishing to production.';
const TIMING_NOTE = 'Timings change with the season and on festival days. Confirm before visiting.';

const p = (...paragraphs) => paragraphs.map((text) => `<p>${text}</p>`).join('');

export const TEMPLES = [
  {
    slug: 'kedarnath-temple-rudraprayag',
    name: 'Kedarnath Temple',
    deity: 'Shiva',
    state: 'Uttarakhand',
    city: 'Kedarnath',
    district: 'Rudraprayag',
    location: { lat: 30.7352, lng: 79.0669 },
    shortDescription:
      'One of the twelve Jyotirlingas, standing at about 3,580 m in the Garhwal Himalaya and reached by a mountain trek. Open only from late spring to autumn.',
    description: p(
      'Kedarnath Temple stands at the head of the Mandakini valley in Uttarakhand, surrounded by snow peaks at an altitude of about 3,580 metres. Lord Shiva is worshipped here as Kedareshwar, and the temple is counted among the twelve Jyotirlingas, the Panch Kedar and the Chhota Char Dham of Uttarakhand.',
      'The temple is built of large grey stone slabs on a raised platform, with a pyramidal shikhara and a hall in front of the sanctum. Inside, the lingam is an irregular, cone-shaped rock rather than a carved form, which devotees touch and anoint during the morning rituals.',
      'Because of heavy snow, the temple opens only from around Akshaya Tritiya (April or May) until Bhai Dooj (October or November). In winter the festival idol is carried to Ukhimath, where worship continues. Most pilgrims walk the trek of about 16 km from Gaurikund; ponies, palanquins and helicopter services are also available.',
    ),
    history: p(
      'Tradition holds that the Pandavas first built a shrine here and that Adi Shankaracharya restored it in the 8th century; his samadhi shrine stands behind the temple. The present stone structure is several centuries old.',
      'In June 2013, flash floods devastated the valley. The temple itself survived, protected according to many accounts by a large boulder that came to rest behind it, now revered as Bhim Shila.',
    ),
    significance: p(
      'According to the legend, the Pandavas sought Shiva after the Kurukshetra war to be freed of sin. Shiva avoided them by taking the form of a bull and sinking into the earth; the hump remained at Kedarnath while other parts appeared at the other Panch Kedar shrines.',
    ),
    timings: [
      { label: 'Morning darshan (season)', open: '06:00', close: '15:00', note: TIMING_NOTE },
      {
        label: 'Evening darshan (season)',
        open: '17:00',
        close: '21:00',
        note: 'Closed in winter, about November to April/May.',
      },
    ],
    aartiSchedule: [
      { name: 'Morning puja and abhishek', note: 'Early morning, before general darshan' },
      { name: 'Evening aarti', note: 'After the evening shringar' },
    ],
    festivals: [
      {
        name: 'Opening day (Kapat opening)',
        month: null,
        description: 'Around Akshaya Tritiya in April or May, announced each year.',
      },
      {
        name: 'Maha Shivaratri',
        month: null,
        description:
          'February or March; the opening date for the season is announced at Ukhimath on this day.',
      },
      {
        name: 'Closing day (Kapat closing)',
        month: null,
        description: 'On Bhai Dooj, after Diwali, in October or November.',
      },
    ],
    bestTimeToVisit:
      'May–June and September–October. Avoid the monsoon months of July and August, when landslides are common.',
    howToReach: {
      nearestAirport: 'Jolly Grant Airport, Dehradun, about 240 km from Gaurikund.',
      nearestRailway: 'Rishikesh, about 215 km from Gaurikund; Haridwar is a little further.',
      nearestBusStand:
        'Gaurikund, the road head, with buses and shared taxis from Rishikesh, Haridwar and Guptkashi.',
      byRoad:
        'Drive or take a bus to Sonprayag, then a shuttle to Gaurikund and trek about 16 km. Helicopter services run from Phata, Sersi and Guptkashi during the season.',
    },
    rules: [
      'Registration with the Uttarakhand Char Dham yatra portal is required before the trek.',
      'Carry warm clothing and rain gear even in summer.',
      'Photography inside the sanctum is not allowed.',
      'Follow the shrine committee’s instructions on queues and darshan slots.',
    ],
    entryFee: 'Free darshan; special puja fees are set by the temple committee.',
    officialWebsite: 'https://badrinath-kedarnath.gov.in',
    tags: ['jyotirlinga', 'char-dham', 'panch-kedar', 'himalayan', 'trek'],
    featured: true,
    images: [
      [
        'kedar2',
        'Stone facade of Kedarnath Temple with a trident in front, snow-covered peaks behind and devotees gathered outside',
      ],
      [
        'kedar1',
        'Kedarnath Temple in daylight beneath rocky Himalayan slopes, with a crowd of pilgrims',
      ],
      ['kedar3', 'Kedarnath Temple lit up at dusk, with pilgrims resting in the courtyard'],
      ['kedar4', 'Pilgrims gathered before Kedarnath Temple under snow peaks and a blue sky'],
    ],
  },
  {
    slug: 'badrinath-temple-chamoli',
    name: 'Badrinath Temple',
    deity: 'Vishnu',
    state: 'Uttarakhand',
    city: 'Badrinath',
    district: 'Chamoli',
    location: { lat: 30.7433, lng: 79.4938 },
    shortDescription:
      'The shrine of Lord Badrinarayan on the Alaknanda river, one of the four dhams of India and of the Chhota Char Dham of Uttarakhand.',
    description: p(
      'Badrinath Temple stands on the bank of the Alaknanda river between the Nar and Narayan ranges, at about 3,100 metres. Lord Vishnu is worshipped here as Badrinarayan, shown seated in meditation in a black stone image about a metre high.',
      'The colourful facade, with its arched gateway and painted woodwork, makes the temple instantly recognisable. Pilgrims usually bathe in the Tapt Kund, a natural hot spring just below the temple, before darshan.',
      'Badrinath is one of the Char Dham established by tradition across India, and also one of the Chhota Char Dham of Uttarakhand. Like Kedarnath, it opens only from late April or May until November; in winter worship continues at Joshimath.',
    ),
    history: p(
      'Adi Shankaracharya is credited with re-establishing worship at Badrinath in the 8th century after recovering the image from the Alaknanda. The temple has been rebuilt several times after avalanches and earthquakes; the head priest, the Rawal, traditionally comes from a Namboodiri family of Kerala.',
    ),
    significance: p(
      'According to the Puranas, Vishnu meditated here while Lakshmi sheltered him as a badri (jujube) tree, giving the place its name. It is one of the 108 Divya Desams praised by the Alvar saints.',
    ),
    timings: [
      { label: 'Morning darshan (season)', open: '04:30', close: '13:00', note: TIMING_NOTE },
      {
        label: 'Evening darshan (season)',
        open: '15:00',
        close: '21:00',
        note: 'Closed in winter, about November to April/May.',
      },
    ],
    aartiSchedule: [
      { name: 'Maha abhishek', note: 'Early morning' },
      { name: 'Geet Govind and Shayan aarti', note: 'At night, before the temple closes' },
    ],
    festivals: [
      {
        name: 'Opening day (Kapat opening)',
        month: null,
        description: 'April or May, date announced on Vasant Panchami.',
      },
      {
        name: 'Mata Murti ka Mela',
        month: 9,
        description: 'September; honours the mother of Nar and Narayan.',
      },
      { name: 'Closing day', month: 11, description: 'November, date announced on Vijayadashami.' },
    ],
    bestTimeToVisit: 'May–June and September–October.',
    howToReach: {
      nearestAirport: 'Jolly Grant Airport, Dehradun, about 315 km.',
      nearestRailway: 'Rishikesh, about 295 km.',
      nearestBusStand: 'Badrinath bus stand, with services from Rishikesh, Haridwar and Joshimath.',
      byRoad:
        'Motorable all the way via Rishikesh, Rudraprayag and Joshimath; the road can close after landslides in the monsoon.',
    },
    rules: [
      'Registration with the Uttarakhand Char Dham yatra portal is required.',
      'Photography inside the temple is not allowed.',
      'Dress modestly.',
    ],
    entryFee: 'Free darshan; puja and special darshan fees are set by the temple committee.',
    officialWebsite: 'https://badrinath-kedarnath.gov.in',
    tags: ['char-dham', 'bada-char-dham', 'divya-desam', 'himalayan'],
    featured: true,
    images: [
      ['badrinath3', 'Brightly painted arched entrance of Badrinath Temple with devotees in front'],
      [
        'badrinath1',
        'Badrinath town and temple on the bank of the Alaknanda river below mountains',
      ],
    ],
  },
  {
    slug: 'gangotri-temple-uttarkashi',
    name: 'Gangotri Temple',
    deity: 'Ganga',
    state: 'Uttarakhand',
    city: 'Gangotri',
    district: 'Uttarkashi',
    location: { lat: 30.9947, lng: 78.9398 },
    shortDescription:
      'The white granite shrine of the goddess Ganga on the Bhagirathi river, one of the Chhota Char Dham of Uttarakhand.',
    description: p(
      'Gangotri Temple stands at about 3,100 metres on the bank of the Bhagirathi, the headstream of the Ganga. The goddess Ganga is worshipped here in a modest white temple, and pilgrims bathe in the icy river before darshan.',
      'The actual glacier source of the river, Gaumukh, lies about 19 km further up the valley and is reached by a permitted trek. For most pilgrims, Gangotri itself is the place where the river is honoured.',
      'The temple is open from Akshaya Tritiya (April or May) until Diwali; in winter the goddess is worshipped at Mukhba village.',
    ),
    history: p(
      'The present temple is generally attributed to the Gorkha commander Amar Singh Thapa in the early 19th century, on a site that had long been sacred.',
    ),
    significance: p(
      'According to legend, King Bhagirath performed penance here so that the Ganga would descend to earth and liberate the souls of his ancestors; Shiva caught the river in his locks to soften its fall. A rock near the temple is revered as the place of Bhagirath’s penance.',
    ),
    timings: [
      {
        label: 'Darshan (season)',
        open: '06:00',
        close: '21:00',
        note: `${TIMING_NOTE} Closed for a midday break.`,
      },
    ],
    aartiSchedule: [
      { name: 'Morning aarti', note: 'Early morning' },
      { name: 'Ganga aarti', note: 'At sunset on the river bank' },
    ],
    festivals: [
      { name: 'Opening day', month: null, description: 'Akshaya Tritiya, April or May.' },
      {
        name: 'Ganga Dussehra',
        month: null,
        description: 'May or June; celebrates the descent of the Ganga.',
      },
      { name: 'Closing day', month: null, description: 'Diwali, October or November.' },
    ],
    bestTimeToVisit: 'May–June and September–October.',
    howToReach: {
      nearestAirport: 'Jolly Grant Airport, Dehradun, about 250 km.',
      nearestRailway: 'Rishikesh, about 250 km.',
      nearestBusStand: 'Gangotri, with buses from Uttarkashi and Rishikesh in the season.',
      byRoad: 'Motorable via Uttarkashi and Harsil.',
    },
    rules: [
      'Registration with the Uttarakhand Char Dham yatra portal is required.',
      'A permit is needed for the Gaumukh trek.',
    ],
    entryFee: 'Free',
    tags: ['char-dham', 'himalayan', 'river'],
    featured: false,
    images: [
      ['gangotri', 'White Gangotri Temple with a golden dome, framed by mountains'],
      ['gangotri2', 'Gangotri town beside the rushing Bhagirathi river below rocky peaks'],
    ],
  },
  {
    slug: 'yamunotri-temple-uttarkashi',
    name: 'Yamunotri Temple',
    deity: 'Yamuna',
    state: 'Uttarakhand',
    city: 'Yamunotri',
    district: 'Uttarkashi',
    location: { lat: 31.0141, lng: 78.4563 },
    shortDescription:
      'The shrine of the goddess Yamuna near the river’s source, traditionally the first stop of the Chhota Char Dham yatra.',
    description: p(
      'Yamunotri Temple stands at about 3,290 metres on the western edge of the Garhwal Himalaya, near the source of the Yamuna. Reaching it involves a trek of about 6 km from Janki Chatti.',
      'Next to the temple are hot springs, the best known being Surya Kund, where pilgrims cook rice and potatoes tied in cloth and take them home as prasad.',
      'The yatra traditionally begins here before moving on to Gangotri, Kedarnath and Badrinath. The temple is open from Akshaya Tritiya until Bhai Dooj.',
    ),
    history: p(
      'The present temple dates from the 19th century and has been repaired several times after damage from snow and floods.',
    ),
    significance: p(
      'The Yamuna is revered as the daughter of Surya and the sister of Yama; bathing here is believed to protect devotees from an untimely death.',
    ),
    timings: [{ label: 'Darshan (season)', open: '06:00', close: '20:00', note: TIMING_NOTE }],
    festivals: [
      { name: 'Opening day', month: null, description: 'Akshaya Tritiya, April or May.' },
      { name: 'Closing day', month: null, description: 'Bhai Dooj, October or November.' },
    ],
    bestTimeToVisit: 'May–June and September–October.',
    howToReach: {
      nearestAirport: 'Jolly Grant Airport, Dehradun, about 210 km to Janki Chatti.',
      nearestRailway: 'Dehradun or Rishikesh, about 175–200 km.',
      nearestBusStand: 'Janki Chatti, the road head.',
      byRoad:
        'Drive to Janki Chatti via Barkot, then trek about 6 km; ponies and palanquins are available.',
    },
    rules: [
      'Registration with the Uttarakhand Char Dham yatra portal is required.',
      'The trek is steep; carry rain gear.',
    ],
    entryFee: 'Free',
    tags: ['char-dham', 'himalayan', 'trek'],
    featured: false,
    images: [['yamunotri', 'Yamunotri Temple and pilgrim lodges among forested slopes']],
  },
  {
    slug: 'kashi-vishwanath-temple-varanasi',
    name: 'Kashi Vishwanath Temple',
    deity: 'Shiva',
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    district: 'Varanasi',
    location: { lat: 25.3109, lng: 83.0107 },
    shortDescription:
      'The golden-spired Jyotirlinga temple at the heart of Varanasi, near the Ganga ghats, now linked to the river by the Kashi Vishwanath Dham corridor.',
    description: p(
      'Kashi Vishwanath Temple, in the old city of Varanasi, is dedicated to Shiva as Vishwanath, the Lord of the Universe, and is one of the twelve Jyotirlingas. Its spires are covered in gold, and the temple is the spiritual centre of a city that devotees regard as the oldest living city in the world.',
      'Since 2021 the Kashi Vishwanath Dham corridor has connected the temple directly to the Ganga at Lalita and Manikarnika ghats, with wide courtyards, museums and facilities for pilgrims. The narrow lanes of the old city still lead to the temple from other sides.',
      'A visit usually combines darshan with a walk along the ghats and the evening Ganga aarti at Dashashwamedh Ghat.',
    ),
    history: p(
      'The temple has been destroyed and rebuilt several times. The present structure was built in 1780 by Ahilyabai Holkar of Indore, and Maharaja Ranjit Singh later donated gold for its spires.',
    ),
    significance: p(
      'Devotees believe that Shiva himself resides in Kashi and that dying here brings liberation. A darshan of Vishwanath, followed by a bath in the Ganga, is considered among the most meritorious acts of a Hindu pilgrimage.',
    ),
    timings: [
      {
        label: 'Darshan',
        open: '04:00',
        close: '23:00',
        note: `${TIMING_NOTE} Darshan pauses during the aartis.`,
      },
    ],
    aartiSchedule: [
      { name: 'Mangala aarti', time: '03:00' },
      { name: 'Bhog aarti', time: '11:15' },
      { name: 'Sandhya aarti', time: '19:00' },
      { name: 'Shringar aarti', time: '21:00' },
      { name: 'Shayan aarti', time: '22:30' },
    ],
    festivals: [
      {
        name: 'Maha Shivaratri',
        month: null,
        description: 'February or March; the busiest day of the year.',
      },
      {
        name: 'Shravan Mondays',
        month: null,
        description: 'Mondays in the month of Shravan (July–August).',
      },
      {
        name: 'Dev Deepawali',
        month: null,
        description: 'Kartik Purnima (November), when the ghats are lit with lamps.',
      },
    ],
    bestTimeToVisit:
      'October to March, when the weather is pleasant. Expect very large crowds on festival days.',
    howToReach: {
      nearestAirport: 'Lal Bahadur Shastri Airport, Babatpur, about 25 km.',
      nearestRailway:
        'Varanasi Junction (Varanasi Cantt), about 5 km; Banaras station is also close.',
      nearestBusStand: 'Varanasi Cantt bus stand, about 5 km.',
      byRoad:
        'Vehicles stop outside the old city; continue by e-rickshaw or on foot, or arrive by boat at the corridor ghat.',
    },
    rules: [
      'Mobile phones, cameras and leather items are not allowed inside; lockers are available.',
      'Expect security checks at the entrances.',
      'Sugam darshan and aarti tickets are booked through the temple trust.',
    ],
    entryFee: 'Free general darshan; Sugam darshan and aarti tickets are paid.',
    officialWebsite: 'https://shrikashivishwanath.org',
    tags: ['jyotirlinga', 'ganga', 'ghats'],
    featured: true,
    images: [
      [
        'banaras-CVxmzokW',
        'Ghats of Varanasi on the Ganga at sunrise, with boats and gulls on the river',
      ],
      ['kash4', 'Golden spire of Kashi Vishwanath Temple seen from the temple corridor'],
    ],
  },
  {
    slug: 'somnath-temple-veraval',
    name: 'Somnath Temple',
    deity: 'Shiva',
    state: 'Gujarat',
    city: 'Prabhas Patan',
    district: 'Gir Somnath',
    location: { lat: 20.888, lng: 70.4012 },
    shortDescription:
      'The seaside temple on the Arabian Sea traditionally counted as the first of the twelve Jyotirlingas, rebuilt in 1951.',
    description: p(
      'Somnath Temple stands on the shore of the Arabian Sea at Prabhas Patan, near Veraval in Gujarat. It is traditionally listed first among the twelve Jyotirlingas, and Shiva is worshipped here as Somnath, the Lord of the Moon.',
      'The present temple, built in the Chalukya (Solanki) style with a richly carved sandstone shikhara, faces the sea. An arrow pillar on the sea wall indicates that there is no land in a straight line between this point and Antarctica.',
      'Evenings bring a sound-and-light show on the temple’s history. The nearby Triveni Sangam and Bhalka Tirth, associated with the end of Krishna’s life, are often visited on the same day.',
    ),
    history: p(
      'The temple was attacked and rebuilt many times over the centuries, most famously after the raid of Mahmud of Ghazni in 1026. After Independence, Sardar Vallabhbhai Patel led its reconstruction, and the present temple was consecrated in 1951.',
    ),
    significance: p(
      'According to legend, the Moon god Soma regained his radiance here through Shiva’s grace after being cursed by his father-in-law Daksha.',
    ),
    timings: [{ label: 'Darshan', open: '06:00', close: '22:00', note: TIMING_NOTE }],
    aartiSchedule: [
      { name: 'Morning aarti', time: '07:00' },
      { name: 'Midday aarti', time: '12:00' },
      { name: 'Evening aarti', time: '19:00' },
    ],
    festivals: [
      { name: 'Maha Shivaratri', month: null, description: 'February or March.' },
      { name: 'Kartik Purnima fair', month: null, description: 'October or November.' },
      {
        name: 'Shravan month',
        month: null,
        description: 'July–August, with special pujas every Monday.',
      },
    ],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Diu Airport, about 85 km; Rajkot, about 190 km.',
      nearestRailway: 'Veraval, about 7 km; Somnath station is also served by some trains.',
      nearestBusStand: 'Somnath bus stand, close to the temple.',
      byRoad: 'Good roads from Junagadh, Rajkot, Diu and Dwarka.',
    },
    rules: [
      'Mobile phones and cameras are not allowed inside the temple; lockers are available.',
      'Dress modestly.',
    ],
    entryFee: 'Free',
    officialWebsite: 'https://somnath.org',
    tags: ['jyotirlinga', 'coastal'],
    featured: false,
    images: [
      ['somnath1', 'Carved sandstone shikhara of Somnath Temple under a blue sky'],
      ['somnath4', 'Somnath Temple and its halls seen from the side facing the sea'],
    ],
  },
  {
    slug: 'mahakaleshwar-temple-ujjain',
    name: 'Mahakaleshwar Temple',
    deity: 'Shiva',
    state: 'Madhya Pradesh',
    city: 'Ujjain',
    district: 'Ujjain',
    location: { lat: 23.1828, lng: 75.7682 },
    shortDescription:
      'Ujjain’s south-facing Jyotirlinga beside the Rudra Sagar lake, famous for its pre-dawn Bhasma Aarti.',
    description: p(
      'Mahakaleshwar Temple in Ujjain is one of the twelve Jyotirlingas and the only one whose lingam faces south, a form linked with Shiva as the Lord of Time and Death. The temple has several levels, with the Jyotirlinga in an underground sanctum.',
      'Its best-known ritual is the Bhasma Aarti before dawn, which requires advance booking. The Shri Mahakal Lok corridor, opened in 2022, adds a long walkway of sculptures depicting Shiva’s stories.',
      'Ujjain is also one of the seven sacred cities (Sapta Puri) and hosts the Simhastha Kumbh Mela on the Shipra river every twelve years.',
    ),
    history: p(
      'The temple was destroyed in 1234–35 and rebuilt in the 18th century under the Maratha general Ranoji Shinde. It has been expanded and renovated many times since.',
    ),
    significance: p(
      'Mahakal is regarded as the presiding deity of Ujjain. Devotees believe that worshipping him frees one from the fear of untimely death.',
    ),
    timings: [{ label: 'Darshan', open: '04:00', close: '23:00', note: TIMING_NOTE }],
    aartiSchedule: [
      {
        name: 'Bhasma aarti',
        time: '04:00',
        note: 'Advance booking required; dress code applies.',
      },
      { name: 'Bhog aarti', time: '10:30' },
      { name: 'Sandhya aarti', time: '19:00' },
      { name: 'Shayan aarti', time: '22:30' },
    ],
    festivals: [
      { name: 'Maha Shivaratri', month: null, description: 'February or March.' },
      {
        name: 'Shravan Sawari',
        month: null,
        description: 'Processions of Mahakal through the city on Shravan Mondays (July–August).',
      },
      {
        name: 'Simhastha Kumbh',
        month: null,
        description: 'Every twelve years on the Shipra river.',
      },
    ],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Devi Ahilyabai Holkar Airport, Indore, about 55 km.',
      nearestRailway: 'Ujjain Junction, about 2 km.',
      nearestBusStand: 'Ujjain bus stand, about 2 km.',
      byRoad: 'Well connected by road to Indore, Bhopal and Ahmedabad.',
    },
    rules: [
      'Men attending the Bhasma Aarti wear a dhoti; women wear a saree.',
      'Mobile phones are not allowed in the sanctum area.',
    ],
    entryFee: 'Free general darshan; Bhasma Aarti and quick darshan have booking charges.',
    tags: ['jyotirlinga', 'sapta-puri', 'kumbh'],
    featured: true,
    images: [
      [
        'ujjain',
        'Saffron shikhara of Mahakaleshwar Temple above carved pillars, with the Jyotirlinga name board',
      ],
    ],
  },
  {
    slug: 'omkareshwar-temple-khandwa',
    name: 'Omkareshwar Temple',
    deity: 'Shiva',
    state: 'Madhya Pradesh',
    city: 'Omkareshwar',
    district: 'Khandwa',
    location: { lat: 22.2456, lng: 76.151 },
    shortDescription:
      'A Jyotirlinga on Mandhata island in the Narmada, whose shape is said to resemble the sacred syllable Om.',
    description: p(
      'Omkareshwar Temple stands on Mandhata island in the Narmada river, an island whose outline is said to resemble the syllable Om. Shiva is worshipped here as Omkareshwar, one of the twelve Jyotirlingas.',
      'Pilgrims cross to the island by bridge or boat and climb to the temple. Many also visit Mamaleshwar (Amareshwar) Temple on the south bank, which tradition pairs with Omkareshwar.',
      'The parikrama path around the island passes ghats, smaller shrines and views of the river gorge.',
    ),
    history: p(
      'The temple’s present form dates largely from the 18th and 19th centuries, with patronage from the Holkar rulers of Indore.',
    ),
    significance: p(
      'Legend says Shiva appeared here as a column of light to bless King Mandhata, after whom the island is named.',
    ),
    timings: [{ label: 'Darshan', open: '05:00', close: '22:00', note: TIMING_NOTE }],
    festivals: [
      { name: 'Maha Shivaratri', month: null, description: 'February or March.' },
      {
        name: 'Kartik Purnima',
        month: null,
        description: 'October or November, with a fair on the river banks.',
      },
    ],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Indore, about 80 km.',
      nearestRailway: 'Omkareshwar Road (Mortakka), about 12 km; Khandwa, about 70 km.',
      nearestBusStand: 'Omkareshwar, with buses from Indore and Khandwa.',
      byRoad: 'About two hours by road from Indore.',
    },
    rules: ['Dress modestly.', 'Use only licensed boats to cross the river.'],
    entryFee: 'Free',
    tags: ['jyotirlinga', 'narmada', 'river'],
    featured: false,
    images: [['ohmkaleshwer', 'Temple buildings and ghats at Omkareshwar above the Narmada river']],
  },
  {
    slug: 'trimbakeshwar-temple-nashik',
    name: 'Trimbakeshwar Temple',
    deity: 'Shiva',
    state: 'Maharashtra',
    city: 'Trimbak',
    district: 'Nashik',
    location: { lat: 19.9322, lng: 73.5309 },
    shortDescription:
      'A black-stone Jyotirlinga near the source of the Godavari, where the lingam has three faces for Brahma, Vishnu and Shiva.',
    description: p(
      'Trimbakeshwar Temple, near Nashik, is one of the twelve Jyotirlingas. Its lingam is unusual: a hollow with three small lingams representing Brahma, Vishnu and Shiva, covered by a jewelled crown on special occasions.',
      'The temple is built of black basalt in the Nagara style, set at the foot of the Brahmagiri hills, where the Godavari river is said to rise. A climb up Brahmagiri leads to the traditional source.',
      'Trimbakeshwar is also known for rites performed for ancestors, such as Narayan Nagbali, conducted by local priests.',
    ),
    history: p(
      'The present temple was built in the mid-18th century by the Peshwa Balaji Bajirao (Nanasaheb).',
    ),
    significance: p(
      'The Godavari is revered as the Ganga of the south. Nashik and Trimbak host the Kumbh Mela every twelve years.',
    ),
    timings: [{ label: 'Darshan', open: '05:30', close: '21:00', note: TIMING_NOTE }],
    festivals: [
      { name: 'Maha Shivaratri', month: null, description: 'February or March.' },
      { name: 'Kumbh Mela', month: null, description: 'Every twelve years at Nashik and Trimbak.' },
    ],
    bestTimeToVisit: 'October to March; the monsoon brings lush scenery but heavy rain.',
    howToReach: {
      nearestAirport: 'Nashik (Ozar), about 50 km; Mumbai, about 180 km.',
      nearestRailway: 'Nashik Road, about 40 km.',
      nearestBusStand: 'Trimbak, with frequent buses from Nashik.',
      byRoad: 'About 45 minutes by road from Nashik.',
    },
    rules: [
      'Only men in traditional dress may enter the inner sanctum for some rituals; follow temple instructions.',
      'Mobile phones are restricted inside.',
    ],
    entryFee: 'Free general darshan; paid quick darshan may be available.',
    tags: ['jyotirlinga', 'godavari', 'kumbh'],
    featured: false,
    images: [
      ['trimbakeshwar', 'Black stone shikharas of Trimbakeshwar Temple under a cloudy sky'],
      ['trimbakeshwar2', 'Carved stone towers of Trimbakeshwar Temple and its courtyard'],
    ],
  },
  {
    slug: 'bhimashankar-temple-pune',
    name: 'Bhimashankar Temple',
    deity: 'Shiva',
    state: 'Maharashtra',
    city: 'Bhimashankar',
    district: 'Pune',
    location: { lat: 19.0718, lng: 73.5357 },
    shortDescription:
      'A Jyotirlinga in the forested Sahyadri hills at the source of the Bhima river, inside a wildlife sanctuary.',
    description: p(
      'Bhimashankar Temple lies in the Sahyadri range north-west of Pune, at the source of the Bhima river. Shiva is worshipped here as one of the twelve Jyotirlingas, in a temple of dark stone in the Nagara style.',
      'The surrounding Bhimashankar Wildlife Sanctuary protects evergreen forest and is home to the Indian giant squirrel. In the monsoon the hills are covered in mist and waterfalls, attracting trekkers as well as pilgrims.',
      'The approach involves steps down from the car park to the temple.',
    ),
    history: p(
      'Parts of the temple date back several centuries, with additions in the 18th century by the Maratha statesman Nana Phadnavis.',
    ),
    significance: p(
      'Legend says Shiva destroyed the demon Bhima here and, at the request of the gods, remained as a Jyotirlinga.',
    ),
    timings: [{ label: 'Darshan', open: '05:00', close: '21:30', note: TIMING_NOTE }],
    festivals: [{ name: 'Maha Shivaratri', month: null, description: 'February or March.' }],
    bestTimeToVisit:
      'October to February; July–September for the monsoon scenery, with slippery paths.',
    howToReach: {
      nearestAirport: 'Pune, about 110 km.',
      nearestRailway: 'Pune, about 110 km; Karjat for trekking routes.',
      nearestBusStand: 'Bhimashankar, with state buses from Pune.',
      byRoad: 'About three hours by road from Pune via Manchar.',
    },
    rules: ['Respect sanctuary rules: no plastic or littering.', 'Dress modestly.'],
    entryFee: 'Free',
    tags: ['jyotirlinga', 'sahyadri', 'forest'],
    featured: false,
    images: [
      ['bhimashankar', 'Dark stone Bhimashankar Temple with its carved spire among green hills'],
    ],
  },
  {
    slug: 'grishneshwar-temple-ellora',
    name: 'Grishneshwar Temple',
    deity: 'Shiva',
    state: 'Maharashtra',
    city: 'Verul',
    district: 'Chhatrapati Sambhajinagar',
    location: { lat: 20.0249, lng: 75.1696 },
    shortDescription:
      'A red-stone Jyotirlinga temple near the Ellora caves, often listed last among the twelve Jyotirlingas.',
    description: p(
      'Grishneshwar Temple stands in the village of Verul, less than a kilometre from the Ellora caves. It is one of the twelve Jyotirlingas and is built of red basalt, with carvings of deities and stories on its walls.',
      'The temple is compact, and visitors can often reach the sanctum quickly outside festival times. Many combine darshan with a visit to Ellora, a UNESCO World Heritage Site.',
    ),
    history: p(
      'The present temple was rebuilt in the 18th century by Ahilyabai Holkar, who also restored Kashi Vishwanath and many other shrines.',
    ),
    significance: p(
      'According to legend, Shiva restored the son of his devotee Ghushma here, and remained at her request as Ghushmeshwar (Grishneshwar).',
    ),
    timings: [{ label: 'Darshan', open: '05:30', close: '21:30', note: TIMING_NOTE }],
    festivals: [{ name: 'Maha Shivaratri', month: null, description: 'February or March.' }],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Chhatrapati Sambhajinagar (Aurangabad), about 35 km.',
      nearestRailway: 'Chhatrapati Sambhajinagar, about 30 km.',
      nearestBusStand: 'Verul (Ellora), with buses from the city.',
      byRoad: 'About an hour by road from Chhatrapati Sambhajinagar.',
    },
    rules: ['Men remove their shirts to enter the sanctum, by local custom.', 'Dress modestly.'],
    entryFee: 'Free',
    tags: ['jyotirlinga', 'ellora'],
    featured: false,
    images: [['grisneswer', 'Red stone Grishneshwar Temple and its spire seen from above']],
  },
  {
    slug: 'nageshwar-jyotirlinga-dwarka',
    name: 'Nageshwar Jyotirlinga',
    deity: 'Shiva',
    state: 'Gujarat',
    city: 'Dwarka',
    district: 'Devbhumi Dwarka',
    location: { lat: 22.3355, lng: 69.087 },
    shortDescription:
      'A Jyotirlinga temple between Dwarka and Bet Dwarka, known for its large outdoor statue of a seated Shiva.',
    description: p(
      'Nageshwar Jyotirlinga stands on the road between Dwarka and Bet Dwarka in Gujarat. Shiva is worshipped here as Nageshwar, the Lord of Serpents, and the temple is visited by most pilgrims travelling to Dwarka.',
      'A large statue of Shiva seated in meditation stands in the temple grounds and can be seen from the road. The sanctum is below ground level.',
    ),
    history: p(
      'The present temple is modern. Other sites, such as Aundha Nagnath in Maharashtra, are also claimed as the Nageshwar Jyotirlinga.',
    ),
    significance: p(
      'According to the Shiva Purana, Shiva protected his devotee Supriya here from the demon Daruka.',
    ),
    timings: [{ label: 'Darshan', open: '06:00', close: '21:00', note: TIMING_NOTE }],
    festivals: [{ name: 'Maha Shivaratri', month: null, description: 'February or March.' }],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Jamnagar, about 130 km.',
      nearestRailway: 'Dwarka, about 17 km.',
      nearestBusStand: 'Dwarka.',
      byRoad: 'About 25 minutes by road from Dwarka.',
    },
    rules: ['Dress modestly.'],
    entryFee: 'Free',
    tags: ['jyotirlinga', 'coastal'],
    featured: false,
    images: [['nageshwer', 'Large statue of Shiva seated in meditation beside Nageshwar temple']],
  },
  {
    slug: 'mallikarjuna-swamy-temple-srisailam',
    name: 'Mallikarjuna Swamy Temple',
    deity: 'Shiva',
    state: 'Andhra Pradesh',
    city: 'Srisailam',
    district: 'Nandyal',
    location: { lat: 16.074, lng: 78.868 },
    shortDescription:
      'A hilltop temple above the Krishna river that is both a Jyotirlinga and a Shakti Peeth, for Shiva and the goddess Bhramaramba.',
    description: p(
      'The Mallikarjuna Swamy Temple stands on Srisailam hill in the Nallamala forest, above the Krishna river. Shiva is worshipped as Mallikarjuna, one of the twelve Jyotirlingas, and the goddess as Bhramaramba, making the shrine also one of the Shakti Peethas.',
      'The temple complex is enclosed by high walls with carved gopurams. The drive to Srisailam passes through the Nagarjunasagar–Srisailam Tiger Reserve, and the Srisailam dam is close by.',
    ),
    history: p(
      'The temple has been patronised by many dynasties, including the Vijayanagara kings, who built much of the present complex.',
    ),
    significance: p(
      'Devotees believe that a darshan of Mallikarjuna grants the merit of all pilgrimages; the presence of both a Jyotirlinga and a Shakti Peetha makes it rare.',
    ),
    timings: [{ label: 'Darshan', open: '04:30', close: '22:00', note: TIMING_NOTE }],
    festivals: [
      { name: 'Maha Shivaratri Brahmotsavam', month: null, description: 'February or March.' },
      { name: 'Ugadi', month: null, description: 'March or April.' },
    ],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Hyderabad, about 215 km.',
      nearestRailway: 'Markapur Road, about 85 km.',
      nearestBusStand: 'Srisailam, with buses from Hyderabad, Kurnool and Vijayawada.',
      byRoad: 'Through the tiger reserve; forest check posts close the road at night.',
    },
    rules: [
      'Traditional dress is expected for sparsha (touch) darshan.',
      'Forest roads close at night.',
    ],
    entryFee: 'Free general darshan; paid darshans are available.',
    tags: ['jyotirlinga', 'shakti-peeth'],
    featured: false,
    images: [['mallika', 'Carved gopuram at the Srisailam temple complex']],
  },
  {
    slug: 'ramanathaswamy-temple-rameswaram',
    name: 'Ramanathaswamy Temple',
    deity: 'Shiva',
    state: 'Tamil Nadu',
    city: 'Rameswaram',
    district: 'Ramanathapuram',
    location: { lat: 9.2881, lng: 79.3174 },
    shortDescription:
      'The island temple with India’s longest temple corridors, a Jyotirlinga and one of the four dhams, linked to Rama’s journey to Lanka.',
    description: p(
      'Ramanathaswamy Temple stands on Rameswaram island in the Gulf of Mannar. It is one of the twelve Jyotirlingas and one of the four dhams of India, so it is central to many all-India pilgrimages.',
      'The temple is famous for its corridors, lined with carved pillars, which are among the longest of any temple in India. Inside the complex are 22 sacred wells (theerthams); pilgrims bathe at each, then at Agni Theertham on the seashore, before darshan.',
      'Rameswaram is reached across the Pamban bridges from the mainland. Dhanushkodi, at the tip of the island, is a short drive away.',
    ),
    history: p(
      'The temple was expanded over many centuries, mainly by the Sethupathi rulers of Ramanathapuram in the 17th and 18th centuries, who built the great corridors.',
    ),
    significance: p(
      'According to the Ramayana tradition, Rama worshipped Shiva here to atone for killing Ravana, using a lingam made of sand by Sita. A second lingam, brought by Hanuman from Kailash, is also worshipped.',
    ),
    timings: [
      { label: 'Morning darshan', open: '05:00', close: '13:00', note: TIMING_NOTE },
      { label: 'Evening darshan', open: '15:00', close: '21:00' },
    ],
    aartiSchedule: [
      { name: 'Spatika lingam darshan', time: '05:00', note: 'Early morning, by ticket' },
    ],
    festivals: [
      { name: 'Maha Shivaratri', month: null, description: 'February or March.' },
      {
        name: 'Thirukalyanam',
        month: 7,
        description: 'Celestial wedding festival, usually July–August.',
      },
    ],
    bestTimeToVisit: 'October to April.',
    howToReach: {
      nearestAirport: 'Madurai, about 175 km.',
      nearestRailway: 'Rameswaram station, about 1.5 km.',
      nearestBusStand: 'Rameswaram bus stand, about 2 km.',
      byRoad: 'Across the Pamban road bridge from Mandapam.',
    },
    rules: [
      'Bathing at the theerthams is done in clothes; carry a change of clothes.',
      'Traditional dress is expected inside the temple.',
      'Mobile phones are not allowed inside.',
    ],
    entryFee: 'Free general darshan; fees for theertham bath and special darshan.',
    tags: ['jyotirlinga', 'bada-char-dham', 'coastal', 'ramayana'],
    featured: true,
    images: [
      [
        'rames',
        'Yellow west gopuram of Ramanathaswamy Temple with “Siva Siva” written in Tamil, auto-rickshaws in front',
      ],
    ],
  },
  {
    slug: 'baidyanath-dham-deoghar',
    name: 'Baidyanath Dham',
    deity: 'Shiva',
    state: 'Jharkhand',
    city: 'Deoghar',
    district: 'Deoghar',
    location: { lat: 24.4925, lng: 86.7 },
    shortDescription:
      'Deoghar’s Jyotirlinga complex of white-spired shrines, the destination of the Shravan Kanwar Yatra from Sultanganj.',
    description: p(
      'Baidyanath Dham in Deoghar, Jharkhand, is regarded by many as one of the twelve Jyotirlingas. The main temple is surrounded by twenty-one smaller temples in one complex, all with tall white shikharas.',
      'During the month of Shravan, lakhs of kanwariyas carry water from the Ganga at Sultanganj in Bihar, walking about 105 km barefoot to offer it to Baidyanath.',
      'The shrine is also counted among the Shakti Peethas, with the temple of Jaya Durga in the complex.',
    ),
    history: p(
      'The temple has been a major pilgrimage centre for centuries; the present structures were built and restored by various local rulers.',
    ),
    significance: p(
      'According to legend, Ravana carried a lingam from Kailash towards Lanka but was forced to set it down here, where it remained. Shiva as Baidyanath is worshipped as the divine healer.',
    ),
    timings: [
      {
        label: 'Darshan',
        open: '04:00',
        close: '21:00',
        note: `${TIMING_NOTE} Hours are extended during Shravan.`,
      },
    ],
    festivals: [
      {
        name: 'Shravani Mela',
        month: null,
        description: 'July–August; the Kanwar Yatra from Sultanganj.',
      },
      { name: 'Maha Shivaratri', month: null, description: 'February or March.' },
    ],
    bestTimeToVisit: 'October to March; Shravan for the festival, with very large crowds.',
    howToReach: {
      nearestAirport: 'Deoghar Airport, about 12 km.',
      nearestRailway: 'Baidyanath Dham station, about 2 km; Jasidih Junction, about 7 km.',
      nearestBusStand: 'Deoghar bus stand.',
      byRoad: 'Well connected to Patna, Ranchi and Kolkata.',
    },
    rules: [
      'Expect long queues in Shravan; quick darshan passes may be issued by the administration.',
      'Dress modestly.',
    ],
    entryFee: 'Free',
    tags: ['jyotirlinga', 'shakti-peeth', 'kanwar'],
    featured: false,
    images: [
      ['vaidnath', 'White shikharas of the Baidyanath Dham temple complex with flags between them'],
      ['vaidnath2', 'Crowds of saffron-clad pilgrims at Baidyanath Dham below the temple spires'],
    ],
  },
  {
    slug: 'dwarkadhish-temple-dwarka',
    name: 'Dwarkadhish Temple',
    deity: 'Krishna',
    state: 'Gujarat',
    city: 'Dwarka',
    district: 'Devbhumi Dwarka',
    location: { lat: 22.2379, lng: 68.9675 },
    shortDescription:
      'Krishna’s temple at the mouth of the Gomti river, one of the four dhams and one of the seven sacred cities.',
    description: p(
      'Dwarkadhish Temple stands where the Gomti river meets the Arabian Sea in Dwarka, the city associated with Krishna’s kingdom. Krishna is worshipped here as Dwarkadhish, the King of Dwarka.',
      'The temple’s five-storeyed shikhara rises about 78 metres, topped by a large flag that is changed several times a day. Pilgrims enter through the Swarga Dwar and leave through the Moksha Dwar, which opens onto steps leading down to the Gomti.',
      'Dwarka is one of the four dhams and one of the seven sacred cities. Bet Dwarka island, Nageshwar Jyotirlinga and Rukmini Temple are usually visited on the same trip.',
    ),
    history: p(
      'The present temple dates from around the 15th–16th centuries, built in the Chalukya style on a site that tradition says was first sanctified by Krishna’s great-grandson Vajranabha.',
    ),
    significance: p(
      'Dwarka is revered as the city Krishna founded after leaving Mathura. A darshan of Dwarkadhish completes the western dham of the four-dham pilgrimage.',
    ),
    timings: [
      { label: 'Morning darshan', open: '06:30', close: '13:00', note: TIMING_NOTE },
      { label: 'Evening darshan', open: '17:00', close: '21:30' },
    ],
    aartiSchedule: [
      { name: 'Mangala aarti', time: '06:30' },
      { name: 'Shringar aarti', time: '10:30' },
      { name: 'Sandhya aarti', time: '19:30' },
      { name: 'Shayan aarti', time: '20:30' },
    ],
    festivals: [
      {
        name: 'Janmashtami',
        month: null,
        description: 'August or September; the biggest festival of the year.',
      },
      { name: 'Holi (Phool Dol)', month: null, description: 'March.' },
    ],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Jamnagar, about 130 km; Porbandar, about 100 km.',
      nearestRailway: 'Dwarka station, about 2 km.',
      nearestBusStand: 'Dwarka bus stand, about 1 km.',
      byRoad: 'Good roads from Jamnagar, Porbandar and Somnath.',
    },
    rules: [
      'Mobile phones and cameras are not allowed inside; lockers are available.',
      'Dress modestly.',
    ],
    entryFee: 'Free',
    tags: ['bada-char-dham', 'sapta-puri', 'krishna', 'coastal'],
    featured: false,
    images: [
      ['dwarka1', 'Tall carved shikhara of Dwarkadhish Temple with its flag flying'],
      [
        'dwarka',
        'Fishing boat and gulls in the Gulf of Kutch near Bet Dwarka, with bridge towers on the horizon',
      ],
    ],
  },
  {
    slug: 'jagannath-temple-puri',
    name: 'Jagannath Temple',
    deity: 'Vishnu',
    state: 'Odisha',
    city: 'Puri',
    district: 'Puri',
    location: { lat: 19.8048, lng: 85.818 },
    shortDescription:
      'The 12th-century temple of Jagannath, Balabhadra and Subhadra, one of the four dhams and home of the Rath Yatra.',
    description: p(
      'The Jagannath Temple in Puri is dedicated to Jagannath, a form of Vishnu, worshipped together with his brother Balabhadra and sister Subhadra. The wooden images are renewed in the Nabakalebara ceremony every 12 to 19 years.',
      'The main tower rises about 65 metres above the town, crowned by the Neela Chakra and a flag that is changed every day by priests who climb the spire. The temple kitchen is among the largest in the world, and the Mahaprasad cooked there is shared by all castes in the Ananda Bazaar.',
      'Each year in June or July, the three deities are taken out on huge wooden chariots in the Rath Yatra, drawing pilgrims from across the world.',
    ),
    history: p(
      'The present temple was built in the 12th century by King Anantavarman Chodaganga of the Eastern Ganga dynasty.',
    ),
    significance: p(
      'Puri is the eastern dham of the four-dham pilgrimage. Devotees believe that seeing Jagannath on his chariot during the Rath Yatra brings liberation.',
    ),
    timings: [
      {
        label: 'Darshan',
        open: '05:00',
        close: '23:00',
        note: `${TIMING_NOTE} Darshan pauses for rituals during the day.`,
      },
    ],
    festivals: [
      { name: 'Rath Yatra', month: null, description: 'June or July.' },
      {
        name: 'Snana Purnima',
        month: null,
        description: 'June; the bathing festival before the Rath Yatra.',
      },
      { name: 'Chandan Yatra', month: null, description: 'April–May.' },
    ],
    bestTimeToVisit: 'October to March, or June–July for the Rath Yatra.',
    howToReach: {
      nearestAirport: 'Biju Patnaik Airport, Bhubaneswar, about 60 km.',
      nearestRailway: 'Puri station, about 3 km.',
      nearestBusStand: 'Puri bus stand, about 2 km.',
      byRoad: 'About 90 minutes by road from Bhubaneswar.',
    },
    rules: [
      'Entry is restricted to followers of Hinduism, as set by the temple administration.',
      'Mobile phones, cameras and leather items are not allowed inside.',
    ],
    entryFee: 'Free',
    officialWebsite: 'https://jagannath.nic.in',
    tags: ['bada-char-dham', 'rath-yatra', 'coastal'],
    featured: true,
    images: [
      [
        'puri1',
        'Garlanded gateway and spires of the Jagannath Temple with a crowd of devotees in front',
      ],
      [
        'puri3',
        'Main spire of the Jagannath Temple with its flag, photographed in black and white',
      ],
      ['jagnath', 'Painted Rath Yatra chariots lined up on the Grand Road in Puri'],
    ],
  },
  {
    slug: 'vaishno-devi-katra',
    name: 'Vaishno Devi Temple',
    deity: 'Devi',
    state: 'Jammu and Kashmir',
    city: 'Katra',
    district: 'Reasi',
    location: { lat: 33.03, lng: 74.949 },
    shortDescription:
      'The cave shrine of Mata Vaishno Devi on the Trikuta hills, reached by a 12 km path from Katra and visited by millions each year.',
    description: p(
      'The shrine of Mata Vaishno Devi lies in a cave on the Trikuta hills above Katra in Jammu and Kashmir, at about 1,580 metres. The goddess is worshipped in the form of three natural rock formations, the Pindies, representing Maha Kali, Maha Lakshmi and Maha Saraswati.',
      'Pilgrims register at Katra and walk, ride a pony or take a battery car along a well-maintained path of about 12 km to the Bhawan. Helicopter services fly from Katra to Sanjichhat, about 2.5 km from the shrine.',
      'Many continue to the Bhairon temple above the Bhawan, which tradition says completes the pilgrimage.',
    ),
    history: p(
      'The shrine is managed by the Shri Mata Vaishno Devi Shrine Board, set up in 1986, which built most of the present path, lodging and facilities.',
    ),
    significance: p(
      'According to legend, the goddess took refuge in the cave while escaping Bhairon Nath and later beheaded him; Bhairon’s head fell on the nearby hill, where his temple now stands.',
    ),
    timings: [
      {
        label: 'Darshan',
        note: 'The shrine is open almost round the clock, except during the morning and evening aarti. Yatra registration is required.',
      },
    ],
    aartiSchedule: [
      { name: 'Morning aarti', note: 'Before sunrise' },
      { name: 'Evening aarti', note: 'At sunset' },
    ],
    festivals: [
      { name: 'Navratri', month: null, description: 'March–April and September–October.' },
    ],
    bestTimeToVisit: 'March–June and September–October. Winters are cold but less crowded.',
    howToReach: {
      nearestAirport: 'Jammu, about 50 km from Katra.',
      nearestRailway: 'Shri Mata Vaishno Devi Katra station.',
      nearestBusStand: 'Katra bus stand.',
      byRoad: 'About 1.5 hours by road from Jammu to Katra, then the 12 km path.',
    },
    rules: [
      'Yatra registration (RFID card) is mandatory before starting.',
      'Leather items, mobile phones and cameras are not allowed in the cave.',
      'Lockers and cloakrooms are available at the Bhawan.',
    ],
    entryFee: 'Free darshan; fees for helicopter, battery car and ropeway services.',
    officialWebsite: 'https://www.maavaishnodevi.org',
    tags: ['shakti-peeth', 'himalayan', 'trek', 'cave'],
    featured: true,
    images: [['vaishnodevi', 'Vaishno Devi Bhawan lit up at night on the Trikuta hillside']],
  },
  {
    slug: 'tirumala-venkateswara-temple-tirupati',
    name: 'Tirumala Venkateswara Temple',
    deity: 'Vishnu',
    state: 'Andhra Pradesh',
    city: 'Tirumala',
    district: 'Tirupati',
    location: { lat: 13.6833, lng: 79.3474 },
    shortDescription:
      'The hill temple of Lord Venkateswara at Tirumala, among the most visited places of worship in the world.',
    description: p(
      'The Sri Venkateswara Temple stands on the seventh peak of the Tirumala hills above Tirupati. Lord Venkateswara, a form of Vishnu also called Balaji or Srinivasa, is worshipped here by tens of thousands of pilgrims every day.',
      'The temple is managed by Tirumala Tirupati Devasthanams (TTD), which runs queue complexes, free meals (Anna Prasadam) and lodging. The famous Tirupati laddu is given as prasad.',
      'Many devotees offer their hair as a vow at the Kalyana Katta tonsure halls, and some climb the hills on foot by the Alipiri or Srivari Mettu footpaths.',
    ),
    history: p(
      'The temple has inscriptions from the Pallava, Chola and Vijayanagara periods. Krishnadevaraya of Vijayanagara made rich donations in the 16th century.',
    ),
    significance: p(
      'Devotees believe that Vishnu came to earth as Venkateswara in the present age to save humanity, and that a vow fulfilled at Tirumala is especially powerful.',
    ),
    timings: [
      {
        label: 'Darshan',
        note: 'Open most of the day; book darshan slots through TTD. Timings vary with rituals and festivals.',
      },
    ],
    aartiSchedule: [
      { name: 'Suprabhatam', time: '03:00' },
      { name: 'Ekantha seva', note: 'Late night, when the temple closes' },
    ],
    festivals: [
      {
        name: 'Brahmotsavam',
        month: 9,
        description: 'Nine-day festival, usually September or October.',
      },
      { name: 'Vaikuntha Ekadashi', month: null, description: 'December or January.' },
    ],
    bestTimeToVisit: 'September to March; weekdays are less crowded.',
    howToReach: {
      nearestAirport: 'Tirupati Airport, Renigunta, about 40 km.',
      nearestRailway: 'Tirupati station, about 25 km.',
      nearestBusStand: 'Tirupati, with frequent TTD and APSRTC buses up the ghat road.',
      byRoad: 'Ghat road from Tirupati, or the footpaths from Alipiri and Srivari Mettu.',
    },
    rules: [
      'Traditional dress is required: dhoti or kurta-pyjama for men, saree or churidar for women.',
      'Mobile phones and cameras are not allowed inside.',
      'Darshan tickets and slots are booked through TTD.',
    ],
    entryFee: 'Free Sarva darshan; Special Entry Darshan and sevas are paid.',
    officialWebsite: 'https://www.tirumala.org',
    tags: ['divya-desam', 'balaji'],
    featured: true,
    images: [
      ['tiru1', 'Whitewashed gopuram of the Tirumala temple complex against green hills'],
      ['tirumala', 'Temple tower at Tirumala with forested hills behind'],
    ],
  },
  {
    slug: 'meenakshi-amman-temple-madurai',
    name: 'Meenakshi Amman Temple',
    deity: 'Devi',
    state: 'Tamil Nadu',
    city: 'Madurai',
    district: 'Madurai',
    location: { lat: 9.9195, lng: 78.1193 },
    shortDescription:
      'Madurai’s great temple of Meenakshi and Sundareswarar, with fourteen sculpted gopurams and the Hall of a Thousand Pillars.',
    description: p(
      'The Meenakshi Amman Temple stands at the centre of Madurai, and the old city is laid out in squares around it. It is dedicated to the goddess Meenakshi, a form of Parvati, and her consort Sundareswarar, a form of Shiva.',
      'Fourteen gopurams covered with thousands of painted figures rise above the complex, the tallest about 50 metres high. Inside are the Golden Lotus Tank and the Hall of a Thousand Pillars, which now houses a museum.',
      'Each night the image of Sundareswarar is carried to Meenakshi’s shrine in a procession, a ritual many visitors try to attend.',
    ),
    history: p(
      'Although the site is ancient, most of the present complex was built by the Nayak rulers of Madurai in the 16th and 17th centuries.',
    ),
    significance: p(
      'The temple celebrates the divine marriage of Meenakshi and Sundareswarar, re-enacted every year in the Chithirai festival.',
    ),
    timings: [
      { label: 'Morning darshan', open: '05:00', close: '12:30', note: TIMING_NOTE },
      { label: 'Evening darshan', open: '16:00', close: '22:00' },
    ],
    festivals: [
      {
        name: 'Chithirai Thiruvizha',
        month: 4,
        description: 'April–May; the celestial wedding of Meenakshi and Sundareswarar.',
      },
      { name: 'Navaratri', month: null, description: 'September–October.' },
    ],
    bestTimeToVisit: 'October to March, or April–May for the Chithirai festival.',
    howToReach: {
      nearestAirport: 'Madurai Airport, about 12 km.',
      nearestRailway: 'Madurai Junction, about 1.5 km.',
      nearestBusStand: 'Periyar bus stand, about 1 km.',
      byRoad: 'Well connected across Tamil Nadu.',
    },
    rules: [
      'Mobile phones and cameras are not allowed inside.',
      'Traditional or modest dress is expected.',
    ],
    entryFee: 'Free general darshan; special darshan tickets are paid.',
    tags: ['shakti', 'dravidian', 'gopuram'],
    featured: false,
    images: [
      ['meenakshi', 'Tall painted gopuram of the Meenakshi Amman Temple above trees'],
      ['meenakshi2', 'Close view of the colourful sculpted figures on a Meenakshi Temple gopuram'],
    ],
  },
  {
    slug: 'ram-mandir-ayodhya',
    name: 'Shri Ram Janmabhoomi Mandir',
    deity: 'Rama',
    state: 'Uttar Pradesh',
    city: 'Ayodhya',
    district: 'Ayodhya',
    location: { lat: 26.7956, lng: 82.1943 },
    shortDescription:
      'The new temple of Ram Lalla at Ayodhya, built in the Nagara style and consecrated in January 2024.',
    description: p(
      'The Shri Ram Janmabhoomi Mandir in Ayodhya is dedicated to Rama in his child form, Ram Lalla. Built of pink sandstone in the Nagara style, the temple has several mandapas and carved pillars, and was consecrated on 22 January 2024.',
      'The black stone murti of Ram Lalla, adorned with jewellery and garlands, stands in the sanctum. The temple is managed by the Shri Ram Janmabhoomi Teerth Kshetra trust.',
      'Pilgrims often also visit Hanuman Garhi, Kanak Bhawan and the ghats on the Saryu river.',
    ),
    history: p(
      'Construction began in 2020 after the Supreme Court judgment of 2019. Work on parts of the complex continued after the consecration.',
    ),
    significance: p(
      'Ayodhya is revered as the birthplace of Rama and is one of the seven sacred cities (Sapta Puri).',
    ),
    timings: [
      { label: 'Morning darshan', open: '06:30', close: '11:30', note: TIMING_NOTE },
      { label: 'Afternoon and evening darshan', open: '14:00', close: '21:30' },
    ],
    aartiSchedule: [
      { name: 'Shringar aarti', time: '06:30', note: 'Passes issued by the trust' },
      { name: 'Sandhya aarti', time: '19:30', note: 'Passes issued by the trust' },
    ],
    festivals: [
      { name: 'Ram Navami', month: null, description: 'March or April.' },
      {
        name: 'Diwali (Deepotsav)',
        month: null,
        description: 'October or November, with lamps lit along the Saryu.',
      },
    ],
    bestTimeToVisit: 'October to March.',
    howToReach: {
      nearestAirport: 'Maharishi Valmiki International Airport, Ayodhya, about 10 km.',
      nearestRailway: 'Ayodhya Dham Junction, about 2 km.',
      nearestBusStand: 'Ayodhya bus stand.',
      byRoad: 'About 2.5 hours by road from Lucknow.',
    },
    rules: [
      'Mobile phones, cameras and bags are not allowed inside; free lockers are provided.',
      'Expect security checks.',
    ],
    entryFee: 'Free',
    officialWebsite: 'https://srjbtkshetra.org',
    tags: ['sapta-puri', 'ramayana'],
    featured: true,
    images: [['ram', 'Murti of Ram Lalla adorned with a crown, jewellery and flower garlands']],
  },
  {
    slug: 'golden-temple-amritsar',
    name: 'Golden Temple (Harmandir Sahib)',
    deity: 'Guru Granth Sahib',
    religion: 'sikh',
    state: 'Punjab',
    city: 'Amritsar',
    district: 'Amritsar',
    location: { lat: 31.62, lng: 74.8765 },
    shortDescription:
      'Sri Harmandir Sahib, the holiest gurdwara of Sikhism, set in the Amrit Sarovar and open to people of every faith.',
    description: p(
      'Sri Harmandir Sahib, known as the Golden Temple, stands in the middle of the Amrit Sarovar, the sacred pool at the heart of Amritsar. Its upper floors are covered in gold, and the Guru Granth Sahib is installed inside during the day.',
      'Visitors walk around the marble parikrama surrounding the pool, then cross the causeway to the shrine. Kirtan (hymns) is sung continuously from early morning until night.',
      'The Guru Ka Langar serves free meals to tens of thousands of people every day, prepared and served by volunteers. Everyone is welcome, regardless of religion.',
    ),
    history: p(
      'Guru Arjan Dev completed the Harmandir Sahib in 1604 and installed the Adi Granth there. Maharaja Ranjit Singh covered the upper storeys with gold in the early 19th century.',
    ),
    significance: p(
      'The four entrances of the shrine signify openness to people from all directions and backgrounds, a central value of the Sikh faith.',
    ),
    timings: [
      {
        label: 'Open',
        note: 'The complex is open day and night; the Guru Granth Sahib is installed in the morning and carried to rest at night.',
      },
    ],
    festivals: [
      {
        name: 'Guru Nanak Gurpurab',
        month: null,
        description: 'Kartik Purnima, October or November.',
      },
      { name: 'Vaisakhi', month: 4, description: 'Mid-April.' },
      { name: 'Bandi Chhor Divas', month: null, description: 'With Diwali, October or November.' },
    ],
    bestTimeToVisit: 'October to March. Early morning and late evening are calm and beautiful.',
    howToReach: {
      nearestAirport: 'Sri Guru Ram Dass Jee International Airport, Amritsar, about 13 km.',
      nearestRailway: 'Amritsar Junction, about 2 km.',
      nearestBusStand: 'Amritsar bus stand, about 2 km.',
      byRoad: 'Well connected to Delhi and across Punjab.',
    },
    rules: [
      'Cover your head (scarves are provided) and remove shoes and socks.',
      'Tobacco, alcohol and smoking are strictly forbidden.',
      'Wash your feet in the shallow pool at the entrance.',
    ],
    entryFee: 'Free',
    officialWebsite: 'https://sgpc.net',
    tags: ['gurdwara', 'langar'],
    featured: true,
    images: [
      [
        'golden',
        'Golden Temple and the Amrit Sarovar lit up at night, with reflections in the water',
      ],
    ],
  },
];

export const CIRCUITS = [
  {
    slug: 'char-dham',
    name: 'Char Dham (Uttarakhand)',
    region: 'Uttarakhand',
    featured: true,
    shortDescription:
      'The four Himalayan shrines of Uttarakhand, visited from west to east: Yamunotri, Gangotri, Kedarnath and Badrinath.',
    description: p(
      'The Chhota Char Dham yatra of Uttarakhand links four shrines high in the Garhwal Himalaya: Yamunotri and Gangotri, at the sources of the Yamuna and the Ganga, then Kedarnath and Badrinath.',
      'By tradition the journey runs from west to east, beginning at Yamunotri. A complete yatra by road usually takes 10 to 12 days from Haridwar or Rishikesh, including treks to Yamunotri and Kedarnath.',
      'All four temples are open only from about April or May to October or November. Registration on the Uttarakhand government’s yatra portal is required.',
    ),
    temples: [
      'yamunotri-temple-uttarkashi',
      'gangotri-temple-uttarkashi',
      'kedarnath-temple-rudraprayag',
      'badrinath-temple-chamoli',
    ],
    image: ['kedar4', 'Pilgrims gathered before Kedarnath Temple under snow peaks and a blue sky'],
  },
  {
    slug: '12-jyotirlingas',
    name: '12 Jyotirlingas',
    region: 'Pan-India',
    featured: true,
    shortDescription:
      'The twelve shrines where Shiva is worshipped as a column of light, from Somnath on the Arabian Sea to Kedarnath in the Himalaya.',
    description: p(
      'The twelve Jyotirlingas are shrines where, according to the Shiva Purana, Shiva appeared as an endless column of light (jyoti). They are spread across India, from Gujarat to Jharkhand and from the Himalaya to Tamil Nadu.',
      'This list follows the order of the Dvadasha Jyotirlinga Stotra, beginning with Somnath. Some places are claimed by more than one site; for example, Aundha Nagnath in Maharashtra is also revered as Nageshwar, and Vaidyanath at Parli as Baidyanath.',
      'Pilgrims rarely visit all twelve in one journey; regional groupings such as the five in Maharashtra and Gujarat, or the two in Madhya Pradesh, are common.',
    ),
    // Order of the Dvadasha Jyotirlinga Stotra ("Saurashtre Somanatham cha…").
    temples: [
      'somnath-temple-veraval',
      'mallikarjuna-swamy-temple-srisailam',
      'mahakaleshwar-temple-ujjain',
      'omkareshwar-temple-khandwa',
      'baidyanath-dham-deoghar',
      'bhimashankar-temple-pune',
      'ramanathaswamy-temple-rameswaram',
      'nageshwar-jyotirlinga-dwarka',
      'kashi-vishwanath-temple-varanasi',
      'trimbakeshwar-temple-nashik',
      'kedarnath-temple-rudraprayag',
      'grishneshwar-temple-ellora',
    ],
    image: [
      'kedar1',
      'Kedarnath Temple in daylight beneath rocky Himalayan slopes, with a crowd of pilgrims',
    ],
  },
  {
    slug: 'bada-char-dham',
    name: 'Bada Char Dham',
    region: 'Pan-India',
    featured: true,
    shortDescription:
      'The four abodes at the four corners of India associated with Adi Shankaracharya: Badrinath, Dwarka, Puri and Rameswaram.',
    description: p(
      'The Bada (great) Char Dham are four temples at the four corners of India: Badrinath in the north, Dwarka in the west, Puri in the east and Rameswaram in the south. Tradition associates the grouping with Adi Shankaracharya.',
      'Three of the dhams are Vaishnava shrines, while Rameswaram is dedicated to Shiva. Completing all four has long been regarded as one of the most meritorious pilgrimages of a lifetime.',
      'Travelling between them takes weeks; most pilgrims visit them over several journeys, often by train or air.',
    ),
    temples: [
      'badrinath-temple-chamoli',
      'dwarkadhish-temple-dwarka',
      'jagannath-temple-puri',
      'ramanathaswamy-temple-rameswaram',
    ],
    image: [
      'puri1',
      'Garlanded gateway and spires of the Jagannath Temple with a crowd of devotees in front',
    ],
  },
];

export { REVIEW_NOTE };

import { ogImageUrl } from '@/lib/cloudinary-loader';
import { BUSINESS, SITE_URL } from '@/lib/config';

const abs = (path) => new URL(path, SITE_URL).toString();

const PLACE_TYPE = { hindu: 'HinduTemple', buddhist: 'BuddhistTemple' };

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS.name,
    url: SITE_URL,
    logo: abs('/logo.png'),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BUSINESS.phoneHref.replace('tel:', ''),
      email: BUSINESS.email,
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BUSINESS.name,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${abs('/temples')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/** @param {{ name: string, path: string }[]} items */
export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Temple page structured data (docs/07-content/04-seo.md). */
export function templeJsonLd(temple) {
  return {
    '@context': 'https://schema.org',
    '@type': PLACE_TYPE[temple.religion] ?? 'PlaceOfWorship',
    name: temple.name,
    description: temple.shortDescription,
    url: abs(`/temples/${temple.slug}`),
    image: temple.images.map((image) => image.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality: temple.city,
      addressRegion: temple.state,
      ...(temple.pincode && { postalCode: temple.pincode }),
      ...(temple.address && { streetAddress: temple.address }),
      addressCountry: 'IN',
    },
    ...(temple.location && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: temple.location.lat,
        longitude: temple.location.lng,
      },
    }),
    openingHoursSpecification: temple.timings
      .filter((t) => t.open && t.close)
      .map((t) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAYS,
        opens: t.open,
        closes: t.close,
      })),
    isAccessibleForFree: /free/i.test(temple.entryFee ?? ''),
    ...(temple.contactPhone && { telephone: temple.contactPhone }),
    ...(temple.officialWebsite && { sameAs: [temple.officialWebsite] }),
  };
}

export function circuitJsonLd(circuit) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: circuit.name,
    description: circuit.shortDescription,
    url: abs(`/circuits/${circuit.slug}`),
    numberOfItems: circuit.temples.length,
    itemListElement: circuit.temples.map((t) => ({
      '@type': 'ListItem',
      position: t.position,
      name: t.name,
      url: abs(`/temples/${t.slug}`),
    })),
  };
}

/** Tour page structured data: TouristTrip with one Offer per bookable departure. */
export function tourJsonLd(tour) {
  const url = abs(`/tours/${tour.slug}`);
  const offers = tour.departures
    .filter((d) => d.status === 'scheduled' || d.status === 'full')
    .map((d) => ({
      '@type': 'Offer',
      price: d.price,
      priceCurrency: tour.currency ?? 'INR',
      availability:
        d.isBookable && d.seatsAvailable > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      validThrough: d.bookingClosesAt,
      url,
      name: `${tour.title}, ${d.startDate}`,
    }));
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.summary,
    url,
    image: tour.images.map((image) => image.url),
    touristType: 'Pilgrims',
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: tour.itinerary.length,
      itemListElement: tour.itinerary.map((day) => ({
        '@type': 'ListItem',
        position: day.day,
        name: day.title,
      })),
    },
    ...(offers.length && { offers }),
    provider: { '@type': 'Organization', name: BUSINESS.name, url: SITE_URL },
  };
}

export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** Open Graph image list for a primary image, or the site default. */
export function ogImages(image) {
  if (!image?.url) return [{ url: abs('/og-default.jpg'), width: 1200, height: 630 }];
  return [{ url: ogImageUrl(image.url), width: 1200, height: 630, alt: image.alt }];
}
